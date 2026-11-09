
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
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  DELIVERY_STATUS,
} from "../../src/constants/index.js";

describe("Deliveries - Pruebas funcionales", () => {
  const userIds = new Set();
  const productIds = new Set();
  const orderIds = new Set();
  const deliveryIds = new Set();

  const assertSuccess = (response, statusCode) => {
    expect(response.status).to.equal(statusCode);
    expect(response.body.status).to.equal("success");
  };

  const assertError = (response, code, statusCode = null) => {
    if (statusCode !== null) {
      expect(response.status).to.equal(statusCode);
    } else {
      expect(response.status).to.be.within(400, 499);
    }

    expect(response.body.status).to.equal("error");
    expect(response.body.code).to.equal(code);
    expect(response.body.message).to.be.a("string");
  };

  const createUser = async (role = USER_ROLES.USER) => {
    const password = await bcrypt.hash("ClaveSegura123", 10);

    const user = await User.create({
      firstName: "Usuario",
      lastName: "Testing",
      email: `deliveries-${randomUUID()}@example.com`,
      password,
      role,
    });

    userIds.add(user._id.toString());

    return user;
  };

  const createProduct = async (stock = 10) => {
    const product = await Product.create({
      name: "Producto para entregas",
      description: "Producto de prueba funcional",
      category: "Testing",
      price: 150,
      stock,
      status:
        stock > 0
          ? PRODUCT_STATUS.AVAILABLE
          : PRODUCT_STATUS.OUT_OF_STOCK,
    });

    productIds.add(product._id.toString());

    return product;
  };

  const changeOrderStatus = async (orderId, status) => {
    const response = await request(app)
      .patch(`/api/orders/${orderId}`)
      .send({ status });

    assertSuccess(response, 200);

    return response.body.payload;
  };

  const createOrder = async (
    initialStatus = ORDER_STATUS.PROCESSING
  ) => {
    const user = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .post("/api/orders")
      .send({
        user: user._id.toString(),
        products: [
          {
            product: product._id.toString(),
            quantity: 2,
          },
        ],
      });

    assertSuccess(response, 201);

    const orderId = response.body.payload._id;

    orderIds.add(orderId);

    if (initialStatus === ORDER_STATUS.PROCESSING) {
      await changeOrderStatus(
        orderId,
        ORDER_STATUS.PROCESSING
      );
    }

    if (initialStatus === ORDER_STATUS.SHIPPED) {
      await changeOrderStatus(
        orderId,
        ORDER_STATUS.PROCESSING
      );

      await changeOrderStatus(
        orderId,
        ORDER_STATUS.SHIPPED
      );
    }

    return {
      orderId,
      user,
      product,
    };
  };

  const createDelivery = async (
    orderId,
    driverId = null
  ) => {
    const body = {
      order: orderId,
      deliveryAddress: "Av. Principal 1234",
    };

    if (driverId !== null) {
      body.driver = driverId;
    }

    const response = await request(app)
      .post("/api/deliveries")
      .send(body);

    assertSuccess(response, 201);

    const delivery = response.body.payload;

    deliveryIds.add(delivery._id);

    return delivery;
  };

  const updateDelivery = async (id, data) => {
    return request(app)
      .patch(`/api/deliveries/${id}`)
      .send(data);
  };

  const createAssignedDelivery = async (
    orderStatus = ORDER_STATUS.PROCESSING
  ) => {
    const { orderId } = await createOrder(orderStatus);
    const driver = await createUser(USER_ROLES.DRIVER);

    const delivery = await createDelivery(
      orderId,
      driver._id.toString()
    );

    const response = await updateDelivery(delivery._id, {
      status: DELIVERY_STATUS.ASSIGNED,
    });

    assertSuccess(response, 200);

    return {
      orderId,
      driver,
      deliveryId: delivery._id,
    };
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

  describe("GET /api/deliveries", () => {
    it("debe devolver un listado de entregas", async () => {
      const response = await request(app)
        .get("/api/deliveries");

      assertSuccess(response, 200);
      expect(response.body.payload).to.be.an("array");
    });

    it("debe incluir las entregas creadas", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await request(app)
        .get("/api/deliveries");

      assertSuccess(response, 200);

      const found = response.body.payload.find(
        (item) => item._id === delivery._id
      );

      expect(found).to.exist;
      expect(found.deliveryAddress).to.equal(
        "Av. Principal 1234"
      );
      expect(found.order).to.be.an("object");
    });
  });

  describe("GET /api/deliveries/:id", () => {
    it("debe obtener una entrega existente", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await request(app)
        .get(`/api/deliveries/${delivery._id}`);

      assertSuccess(response, 200);
      expect(response.body.payload._id).to.equal(
        delivery._id
      );
    });

    it("debe rechazar un ObjectId inválido", async () => {
      const response = await request(app)
        .get("/api/deliveries/id-invalido");

      assertError(response, "INVALID_OBJECT_ID", 400);
    });

    it("debe devolver 404 para una entrega inexistente", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/deliveries/${id}`);

      assertError(response, "DELIVERY_NOT_FOUND", 404);
    });
  });

  describe("GET /api/deliveries/order/:orderId", () => {
    it("debe obtener una entrega por pedido", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await request(app)
        .get(`/api/deliveries/order/${orderId}`);

      assertSuccess(response, 200);
      expect(response.body.payload._id).to.equal(
        delivery._id
      );
    });

    it("debe rechazar un ID de pedido inválido", async () => {
      const response = await request(app)
        .get("/api/deliveries/order/id-invalido");

      assertError(response, "INVALID_OBJECT_ID", 400);
    });

    it("debe devolver 404 cuando no existe entrega para el pedido", async () => {
      const { orderId } = await createOrder();

      const response = await request(app)
        .get(`/api/deliveries/order/${orderId}`);

      assertError(response, "DELIVERY_NOT_FOUND", 404);
    });
  });

  describe("POST /api/deliveries", () => {
    it("debe crear una entrega para un pedido en PROCESSING", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      expect(delivery.status).to.equal(
        DELIVERY_STATUS.PENDING
      );
      expect(delivery.driver).to.equal(null);

      const stored = await Delivery.findById(delivery._id);

      expect(stored).to.exist;
      expect(stored.order.toString()).to.equal(orderId);
    });

    it("debe crear una entrega para un pedido en SHIPPED", async () => {
      const { orderId } = await createOrder(
        ORDER_STATUS.SHIPPED
      );

      const delivery = await createDelivery(orderId);

      expect(delivery.status).to.equal(
        DELIVERY_STATUS.PENDING
      );
    });

    it("debe crear una entrega con conductor válido", async () => {
      const { orderId } = await createOrder();
      const driver = await createUser(USER_ROLES.DRIVER);

      const delivery = await createDelivery(
        orderId,
        driver._id.toString()
      );

      expect(String(delivery.driver)).to.equal(
        driver._id.toString()
      );
    });

    it("debe rechazar un pedido en PENDING", async () => {
      const { orderId } = await createOrder(
        ORDER_STATUS.PENDING
      );

      const response = await request(app)
        .post("/api/deliveries")
        .send({
          order: orderId,
          deliveryAddress: "Av. Principal 1234",
        });

      assertError(
        response,
        "DELIVERY_ORDER_NOT_ELIGIBLE"
      );
    });

    it("debe rechazar un pedido inexistente", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/deliveries")
        .send({
          order: id.toString(),
          deliveryAddress: "Av. Principal 1234",
        });

      assertError(response, "ORDER_NOT_FOUND", 404);
    });

    it("debe impedir crear dos entregas para el mismo pedido", async () => {
      const { orderId } = await createOrder();

      await createDelivery(orderId);

      const response = await request(app)
        .post("/api/deliveries")
        .send({
          order: orderId,
          deliveryAddress: "Otra dirección 456",
        });

      assertError(response, "DELIVERY_ALREADY_EXISTS");

      const count = await Delivery.countDocuments({
        order: orderId,
      });

      expect(count).to.equal(1);
    });

    it("debe rechazar un conductor inexistente", async () => {
      const { orderId } = await createOrder();
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/deliveries")
        .send({
          order: orderId,
          driver: id.toString(),
          deliveryAddress: "Av. Principal 1234",
        });

      assertError(response, "DELIVERY_DRIVER_NOT_FOUND");
    });

    it("debe rechazar un usuario sin rol DRIVER", async () => {
      const { orderId } = await createOrder();
      const user = await createUser(USER_ROLES.USER);

      const response = await request(app)
        .post("/api/deliveries")
        .send({
          order: orderId,
          driver: user._id.toString(),
          deliveryAddress: "Av. Principal 1234",
        });

      assertError(response, "DELIVERY_INVALID_DRIVER");
    });

    it("debe rechazar una dirección demasiado corta", async () => {
      const { orderId } = await createOrder();

      const response = await request(app)
        .post("/api/deliveries")
        .send({
          order: orderId,
          deliveryAddress: "ABC",
        });

      assertError(response, "VALIDATION_ERROR", 400);
    });

    it("debe rechazar propiedades desconocidas", async () => {
      const { orderId } = await createOrder();

      const response = await request(app)
        .post("/api/deliveries")
        .send({
          order: orderId,
          deliveryAddress: "Av. Principal 1234",
          extra: true,
        });

      assertError(response, "VALIDATION_ERROR", 400);
    });
  });

  describe("PATCH /api/deliveries/:id", () => {
    it("debe actualizar la dirección", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await updateDelivery(delivery._id, {
        deliveryAddress: "Nueva dirección 987",
      });

      assertSuccess(response, 200);
      expect(response.body.payload.deliveryAddress).to.equal(
        "Nueva dirección 987"
      );
    });

    it("debe asignar un conductor válido", async () => {
      const { orderId } = await createOrder();
      const driver = await createUser(USER_ROLES.DRIVER);
      const delivery = await createDelivery(orderId);

      const response = await updateDelivery(delivery._id, {
        driver: driver._id.toString(),
      });

      assertSuccess(response, 200);

      const stored = await Delivery.findById(delivery._id);

      expect(stored.driver.toString()).to.equal(
        driver._id.toString()
      );
    });

    it("debe pasar de PENDING a ASSIGNED con conductor", async () => {
      const { orderId } = await createOrder();
      const driver = await createUser(USER_ROLES.DRIVER);
      const delivery = await createDelivery(orderId);

      const response = await updateDelivery(delivery._id, {
        driver: driver._id.toString(),
        status: DELIVERY_STATUS.ASSIGNED,
      });

      assertSuccess(response, 200);
      expect(response.body.payload.status).to.equal(
        DELIVERY_STATUS.ASSIGNED
      );
    });

    it("debe impedir asignar una entrega sin conductor", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await updateDelivery(delivery._id, {
        status: DELIVERY_STATUS.ASSIGNED,
      });

      assertError(response, "DELIVERY_INVALID_DRIVER");

      const stored = await Delivery.findById(delivery._id);

      expect(stored.status).to.equal(
        DELIVERY_STATUS.PENDING
      );
    });

    it("debe impedir IN_TRANSIT si el pedido está en PROCESSING", async () => {
      const { deliveryId } = await createAssignedDelivery();

      const response = await updateDelivery(deliveryId, {
        status: DELIVERY_STATUS.IN_TRANSIT,
      });

      assertError(
        response,
        "DELIVERY_ORDER_NOT_ELIGIBLE"
      );
    });

    it("debe pasar a IN_TRANSIT cuando el pedido está SHIPPED", async () => {
      const { deliveryId } = await createAssignedDelivery(
        ORDER_STATUS.SHIPPED
      );

      const response = await updateDelivery(deliveryId, {
        status: DELIVERY_STATUS.IN_TRANSIT,
      });

      assertSuccess(response, 200);
      expect(response.body.payload.status).to.equal(
        DELIVERY_STATUS.IN_TRANSIT
      );
    });

    it("debe impedir modificar la dirección en IN_TRANSIT", async () => {
      const { deliveryId } = await createAssignedDelivery(
        ORDER_STATUS.SHIPPED
      );

      const transit = await updateDelivery(deliveryId, {
        status: DELIVERY_STATUS.IN_TRANSIT,
      });

      assertSuccess(transit, 200);

      const response = await updateDelivery(deliveryId, {
        deliveryAddress: "Otra dirección 123",
      });

      assertError(
        response,
        "DELIVERY_INVALID_STATUS_TRANSITION"
      );
    });

    it("debe finalizar la entrega y actualizar el pedido", async () => {
      const { orderId, deliveryId } =
        await createAssignedDelivery(
          ORDER_STATUS.SHIPPED
        );

      const transit = await updateDelivery(deliveryId, {
        status: DELIVERY_STATUS.IN_TRANSIT,
      });

      assertSuccess(transit, 200);

      const response = await updateDelivery(deliveryId, {
        status: DELIVERY_STATUS.DELIVERED,
      });

      assertSuccess(response, 200);

      expect(response.body.payload.status).to.equal(
        DELIVERY_STATUS.DELIVERED
      );

      const storedOrder = await Order.findById(orderId);
      const storedDelivery = await Delivery.findById(
        deliveryId
      );

      expect(storedOrder.status).to.equal(
        ORDER_STATUS.DELIVERED
      );

      expect(storedDelivery.status).to.equal(
        DELIVERY_STATUS.DELIVERED
      );
    });

    it("debe rechazar una transición inválida", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await updateDelivery(delivery._id, {
        status: DELIVERY_STATUS.DELIVERED,
      });

      assertError(
        response,
        "DELIVERY_INVALID_STATUS_TRANSITION"
      );
    });

    it("debe rechazar una actualización vacía", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await updateDelivery(
        delivery._id,
        {}
      );

      assertError(response, "VALIDATION_ERROR", 400);
    });

    it("debe devolver 404 al actualizar una entrega inexistente", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await updateDelivery(id.toString(), {
        deliveryAddress: "Nueva dirección 123",
      });

      assertError(response, "DELIVERY_NOT_FOUND", 404);
    });
  });

  describe("PATCH /api/deliveries/:id/cancel", () => {
    it("debe cancelar una entrega pendiente", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await request(app)
        .patch(`/api/deliveries/${delivery._id}/cancel`);

      assertSuccess(response, 200);

      expect(response.body.payload.status).to.equal(
        DELIVERY_STATUS.CANCELLED
      );
    });

    it("debe cancelar una entrega asignada", async () => {
      const { deliveryId } = await createAssignedDelivery();

      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/cancel`);

      assertSuccess(response, 200);
      expect(response.body.payload.status).to.equal(
        DELIVERY_STATUS.CANCELLED
      );
    });

    it("debe impedir cancelar dos veces", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const firstResponse = await request(app)
        .patch(`/api/deliveries/${delivery._id}/cancel`);

      assertSuccess(firstResponse, 200);

      const response = await request(app)
        .patch(`/api/deliveries/${delivery._id}/cancel`);

      assertError(
        response,
        "DELIVERY_INVALID_STATUS_TRANSITION"
      );
    });

    it("debe impedir cancelar una entrega en tránsito", async () => {
      const { deliveryId } = await createAssignedDelivery(
        ORDER_STATUS.SHIPPED
      );

      const transit = await updateDelivery(deliveryId, {
        status: DELIVERY_STATUS.IN_TRANSIT,
      });

      assertSuccess(transit, 200);

      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/cancel`);

      assertError(
        response,
        "DELIVERY_INVALID_STATUS_TRANSITION"
      );
    });

    it("debe devolver 404 para una entrega inexistente", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/deliveries/${id}/cancel`);

      assertError(response, "DELIVERY_NOT_FOUND", 404);
    });
  });

  describe("DELETE /api/deliveries/:id", () => {
    it("debe impedir eliminar una entrega existente", async () => {
      const { orderId } = await createOrder();
      const delivery = await createDelivery(orderId);

      const response = await request(app)
        .delete(`/api/deliveries/${delivery._id}`);

      assertError(response, "DELIVERY_CANNOT_BE_DELETED");

      const stored = await Delivery.findById(delivery._id);

      expect(stored).to.exist;
    });

    it("debe devolver 404 para una entrega inexistente", async () => {
      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/deliveries/${id}`);

      assertError(response, "DELIVERY_NOT_FOUND", 404);
    });

    it("debe rechazar un ObjectId inválido", async () => {
      const response = await request(app)
        .delete("/api/deliveries/id-invalido");

      assertError(response, "INVALID_OBJECT_ID", 400);
    });
  });
});
