
import { describe, it, before, after, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

import app from "../../src/app.js";
import config from "../../src/config/env.config.js";

import User from "../../src/models/user.model.js";
import Product from "../../src/models/product.model.js";
import Order from "../../src/models/order.model.js";
import Delivery from "../../src/models/delivery.model.js";

import {
  ORDER_STATUS,
  ORDER_PRIORITY,
  PRODUCT_STATUS,
} from "../../src/constants/index.js";

describe("Orders - Pruebas funcionales", () => {
  const userIds = new Set();
  const productIds = new Set();
  const orderIds = new Set();
  const deliveryIds = new Set();

  const assertSuccess = (response, statusCode) => {
    expect(response.status).to.equal(statusCode);
    expect(response.body.status).to.equal("success");
  };

  const assertError = (response, statusCode, code) => {
    expect(response.status).to.equal(statusCode);
    expect(response.body.status).to.equal("error");
    expect(response.body.code).to.equal(code);
    expect(response.body.message).to.be.a("string");
  };

  const createUser = async () => {
    const password = await bcrypt.hash("ClaveSegura123", 10);

    const user = await User.create({
      firstName: "Usuario",
      lastName: "Testing",
      email: `orders-${randomUUID()}@example.com`,
      password,
    });

    userIds.add(user._id.toString());

    return user;
  };

  const createProduct = async (overrides = {}) => {
    const data = {
      name: "Producto de prueba",
      description: "Producto para pruebas funcionales",
      category: "Testing",
      price: 125.5,
      stock: 10,
      ...overrides,
    };

    const product = await Product.create({
      ...data,
      status:
        data.stock > 0
          ? PRODUCT_STATUS.AVAILABLE
          : PRODUCT_STATUS.OUT_OF_STOCK,
    });

    productIds.add(product._id.toString());

    return product;
  };

  const createOrderData = (user, product, quantity = 2) => ({
    user: user._id.toString(),
    products: [
      {
        product: product._id.toString(),
        quantity,
      },
    ],
  });

  const createOrder = async (
    user,
    product,
    quantity = 2
  ) => {
    const response = await request(app)
      .post("/api/orders")
      .send(createOrderData(user, product, quantity));

    assertSuccess(response, 201);

    orderIds.add(response.body.payload._id);

    return response.body.payload;
  };

  const createDelivery = async (orderId) => {
    const delivery = await Delivery.create({
      order: orderId,
      deliveryAddress: "Calle de prueba 123",
    });

    deliveryIds.add(delivery._id.toString());

    return delivery;
  };

  const changeStatus = async (orderId, status) => {
    return request(app)
      .patch(`/api/orders/${orderId}`)
      .send({ status });
  };

  before(async () => {
    if (
      config.nodeEnv !== "test" ||
      new URL(config.mongodbUri).pathname !== "/shipnow_test"
    ) {
      throw new Error(
        "Las pruebas deben utilizar exclusivamente shipnow_test"
      );
    }

    await mongoose.connect(config.mongodbUri);

    if (mongoose.connection.name !== "shipnow_test") {
      await mongoose.disconnect();

      throw new Error(
        "La conexión no utiliza la base de pruebas"
      );
    }

    await Promise.all([
      User.init(),
      Product.init(),
      Order.init(),
      Delivery.init(),
    ]);
  });

  afterEach(async () => {
    if (
      mongoose.connection.readyState !== 1 ||
      mongoose.connection.name !== "shipnow_test"
    ) {
      return;
    }

    if (deliveryIds.size > 0) {
      await Delivery.deleteMany({
        _id: { $in: [...deliveryIds] },
      });
      deliveryIds.clear();
    }

    if (orderIds.size > 0) {
      await Order.deleteMany({
        _id: { $in: [...orderIds] },
      });
      orderIds.clear();
    }

    if (productIds.size > 0) {
      await Product.deleteMany({
        _id: { $in: [...productIds] },
      });
      productIds.clear();
    }

    if (userIds.size > 0) {
      await User.deleteMany({
        _id: { $in: [...userIds] },
      });
      userIds.clear();
    }
  });

  after(async () => {
    await mongoose.disconnect();
  });

  describe("GET /api/orders", () => {
    it("debe devolver un listado de pedidos", async () => {
      const response = await request(app)
        .get("/api/orders");

      assertSuccess(response, 200);
      expect(response.body.payload).to.be.an("array");
    });

    it("debe devolver pedidos con usuario y productos", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const response = await request(app)
        .get("/api/orders");

      assertSuccess(response, 200);

      const returnedOrder = response.body.payload.find(
        (item) => item._id === order._id
      );

      expect(returnedOrder).to.exist;
      expect(returnedOrder.user.email).to.equal(user.email);
      expect(returnedOrder.products).to.have.lengthOf(1);
      expect(returnedOrder.products[0].product.name).to.equal(
        product.name
      );
    });
  });

  describe("GET /api/orders/:id", () => {
    it("debe obtener un pedido existente", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const response = await request(app)
        .get(`/api/orders/${order._id}`);

      assertSuccess(response, 200);
      expect(response.body.payload._id).to.equal(order._id);
      expect(response.body.payload.total).to.equal(251);
    });

    it("debe rechazar un ObjectId inválido", async () => {
      const response = await request(app)
        .get("/api/orders/id-invalido");

      assertError(response, 400, "INVALID_OBJECT_ID");
    });

    it("debe devolver 404 si el pedido no existe", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/orders/${id}`);

      assertError(response, 404, "ORDER_NOT_FOUND");
    });
  });

  describe("POST /api/orders", () => {
    it("debe crear un pedido y descontar stock", async () => {
      const user = await createUser();
      const product = await createProduct();

      const order = await createOrder(user, product, 3);

      expect(order.status).to.equal(ORDER_STATUS.PENDING);
      expect(order.total).to.equal(376.5);

      const storedProduct = await Product.findById(product._id);

      expect(storedProduct.stock).to.equal(7);
    });

    it("debe asignar prioridad MEDIUM por defecto", async () => {
      const user = await createUser();
      const product = await createProduct();

      const order = await createOrder(user, product);

      expect(order.priority).to.equal(ORDER_PRIORITY.MEDIUM);
    });

    it("debe calcular el total con varios productos", async () => {
      const user = await createUser();
      const firstProduct = await createProduct({
        price: 100,
      });
      const secondProduct = await createProduct({
        price: 50,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          user: user._id.toString(),
          products: [
            {
              product: firstProduct._id.toString(),
              quantity: 2,
            },
            {
              product: secondProduct._id.toString(),
              quantity: 3,
            },
          ],
        });

      assertSuccess(response, 201);
      orderIds.add(response.body.payload._id);

      expect(response.body.payload.total).to.equal(350);

      const firstStored = await Product.findById(
        firstProduct._id
      );
      const secondStored = await Product.findById(
        secondProduct._id
      );

      expect(firstStored.stock).to.equal(8);
      expect(secondStored.stock).to.equal(7);
    });

    it("debe rechazar un usuario inexistente", async () => {
      const product = await createProduct();
      const missingUser = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/orders")
        .send({
          user: missingUser.toString(),
          products: [
            {
              product: product._id.toString(),
              quantity: 1,
            },
          ],
        });

      assertError(response, 404, "USER_NOT_FOUND");
    });

    it("debe rechazar un producto inexistente", async () => {
      const user = await createUser();
      const missingProduct = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/orders")
        .send({
          user: user._id.toString(),
          products: [
            {
              product: missingProduct.toString(),
              quantity: 1,
            },
          ],
        });

      assertError(response, 404, "PRODUCT_NOT_FOUND");
    });

    it("debe rechazar un pedido sin productos", async () => {
      const user = await createUser();

      const response = await request(app)
        .post("/api/orders")
        .send({
          user: user._id.toString(),
          products: [],
        });

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar productos duplicados", async () => {
      const user = await createUser();
      const product = await createProduct();

      const response = await request(app)
        .post("/api/orders")
        .send({
          user: user._id.toString(),
          products: [
            {
              product: product._id.toString(),
              quantity: 1,
            },
            {
              product: product._id.toString(),
              quantity: 2,
            },
          ],
        });

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar cantidades inválidas", async () => {
      const user = await createUser();
      const product = await createProduct();

      const response = await request(app)
        .post("/api/orders")
        .send(createOrderData(user, product, 0));

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar stock insuficiente sin modificar inventario", async () => {
      const user = await createUser();
      const product = await createProduct({
        stock: 2,
      });

      const response = await request(app)
        .post("/api/orders")
        .send(createOrderData(user, product, 5));

      assertError(response, 409, "ORDER_INSUFFICIENT_STOCK");

      const storedProduct = await Product.findById(product._id);

      expect(storedProduct.stock).to.equal(2);
    });
  });

  describe("PATCH /api/orders/:id", () => {
    it("debe actualizar la prioridad", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const response = await request(app)
        .patch(`/api/orders/${order._id}`)
        .send({
          priority: ORDER_PRIORITY.HIGH,
        });

      assertSuccess(response, 200);
      expect(response.body.payload.priority).to.equal(
        ORDER_PRIORITY.HIGH
      );
    });

    it("debe pasar de PENDING a PROCESSING", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.PROCESSING
      );

      assertSuccess(response, 200);
      expect(response.body.payload.status).to.equal(
        ORDER_STATUS.PROCESSING
      );
    });

    it("debe pasar de PROCESSING a SHIPPED", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      await changeStatus(order._id, ORDER_STATUS.PROCESSING);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.SHIPPED
      );

      assertSuccess(response, 200);
      expect(response.body.payload.status).to.equal(
        ORDER_STATUS.SHIPPED
      );
    });

    it("debe rechazar una transición inválida", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.DELIVERED
      );

      assertError(
        response,
        409,
        "ORDER_INVALID_STATUS_TRANSITION"
      );
    });

    it("debe rechazar una actualización vacía", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const response = await request(app)
        .patch(`/api/orders/${order._id}`)
        .send({});

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe devolver 404 al actualizar un pedido inexistente", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/orders/${id}`)
        .send({
          priority: ORDER_PRIORITY.HIGH,
        });

      assertError(response, 404, "ORDER_NOT_FOUND");
    });
  });

  describe("Cancelación de pedidos", () => {
    it("debe cancelar un pedido pendiente y devolver el stock", async () => {
      const user = await createUser();
      const product = await createProduct({
        stock: 10,
      });
      const order = await createOrder(user, product, 3);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );

      assertSuccess(response, 200);

      expect(response.body.payload.status).to.equal(
        ORDER_STATUS.CANCELLED
      );

      const storedProduct = await Product.findById(product._id);

      expect(storedProduct.stock).to.equal(10);
    });

    it("debe cancelar un pedido en PROCESSING", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const processing = await changeStatus(
        order._id,
        ORDER_STATUS.PROCESSING
      );

      assertSuccess(processing, 200);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );

      assertSuccess(response, 200);

      const storedProduct = await Product.findById(product._id);

      expect(storedProduct.stock).to.equal(10);
    });

    it("debe impedir cancelar dos veces el mismo pedido", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const firstResponse = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );

      assertSuccess(firstResponse, 200);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );

      assertError(response, 409, "ORDER_ALREADY_CANCELLED");

      const storedProduct = await Product.findById(product._id);

      expect(storedProduct.stock).to.equal(10);
    });

    it("debe impedir cancelar un pedido enviado", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const processing = await changeStatus(
        order._id,
        ORDER_STATUS.PROCESSING
      );
      assertSuccess(processing, 200);

      const shipped = await changeStatus(
        order._id,
        ORDER_STATUS.SHIPPED
      );
      assertSuccess(shipped, 200);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );

      assertError(response, 409, "ORDER_CANNOT_BE_CANCELLED");
    });

    it("debe impedir cancelar un pedido con entrega asociada", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      await createDelivery(order._id);

      const response = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );

      assertError(response, 409, "ORDER_DELIVERY_CONFLICT");

      const storedProduct = await Product.findById(product._id);

      expect(storedProduct.stock).to.equal(8);
    });
  });

  describe("DELETE /api/orders/:id", () => {
    it("debe eliminar un pedido cancelado", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const cancellation = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );
      assertSuccess(cancellation, 200);

      const response = await request(app)
        .delete(`/api/orders/${order._id}`);

      assertSuccess(response, 200);

      expect(response.body.message).to.equal(
        "Pedido eliminado correctamente"
      );

      const storedOrder = await Order.findById(order._id);

      expect(storedOrder).to.equal(null);
    });

    it("debe impedir eliminar un pedido pendiente", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const response = await request(app)
        .delete(`/api/orders/${order._id}`);

      assertError(response, 409, "ORDER_CANNOT_BE_DELETED");
    });

    it("debe impedir eliminar un pedido con entrega asociada", async () => {
      const user = await createUser();
      const product = await createProduct();
      const order = await createOrder(user, product);

      const cancellation = await changeStatus(
        order._id,
        ORDER_STATUS.CANCELLED
      );
      assertSuccess(cancellation, 200);

      await createDelivery(order._id);

      const response = await request(app)
        .delete(`/api/orders/${order._id}`);

      assertError(response, 409, "ORDER_DELIVERY_CONFLICT");
    });

    it("debe devolver 404 al eliminar un pedido inexistente", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/orders/${id}`);

      assertError(response, 404, "ORDER_NOT_FOUND");
    });
  });
});
