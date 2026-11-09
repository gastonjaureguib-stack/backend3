
import { describe, it, before, after, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

import app from "../../src/app.js";
import config from "../../src/config/env.config.js";

import Product from "../../src/models/product.model.js";
import User from "../../src/models/user.model.js";
import Order from "../../src/models/order.model.js";

import { PRODUCT_STATUS } from "../../src/constants/index.js";

describe("Products - Pruebas funcionales", () => {
  const productIds = new Set();
  const userIds = new Set();
  const orderIds = new Set();

  const createProductData = (overrides = {}) => ({
    name: "Monitor LED",
    description: "Monitor de alta resolución",
    category: "Electrónica",
    price: 250,
    stock: 10,
    ...overrides,
  });

  const createStoredProduct = async (overrides = {}) => {
    const data = createProductData(overrides);

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

  const createStoredUser = async () => {
    const password = await bcrypt.hash("ClaveSegura123", 10);

    const user = await User.create({
      firstName: "Usuario",
      lastName: "Testing",
      email: `products-${randomUUID()}@example.com`,
      password,
    });

    userIds.add(user._id.toString());

    return user;
  };

  const createStoredOrder = async (product, user) => {
    const order = await Order.create({
      user: user._id,
      products: [
        {
          product: product._id,
          quantity: 1,
        },
      ],
      total: product.price,
    });

    orderIds.add(order._id.toString());

    return order;
  };

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
      Product.init(),
      User.init(),
      Order.init(),
    ]);
  });

  afterEach(async () => {
    if (
      mongoose.connection.readyState !== 1 ||
      mongoose.connection.name !== "shipnow_test"
    ) {
      return;
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

  describe("GET /api/products", () => {
    it("debe devolver un listado de productos", async () => {
      const response = await request(app)
        .get("/api/products");

      assertSuccess(response, 200);
      expect(response.body.payload).to.be.an("array");
    });

    it("debe devolver los datos de un producto existente", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .get("/api/products");

      assertSuccess(response, 200);

      const returnedProduct = response.body.payload.find(
        (item) => item._id === product._id.toString()
      );

      expect(returnedProduct).to.exist;
      expect(returnedProduct.name).to.equal(product.name);
      expect(returnedProduct.price).to.equal(product.price);
      expect(returnedProduct).to.not.have.property("__v");
    });

    it("debe filtrar productos por categoría", async () => {
      const product = await createStoredProduct({
        category: `Categoria-${randomUUID()}`,
      });

      const response = await request(app)
        .get("/api/products")
        .query({ category: product.category });

      assertSuccess(response, 200);
      expect(response.body.payload).to.have.lengthOf(1);
      expect(response.body.payload[0]._id).to.equal(
        product._id.toString()
      );
    });

    it("debe filtrar productos por estado", async () => {
      const product = await createStoredProduct({
        stock: 0,
      });

      const response = await request(app)
        .get("/api/products")
        .query({
          status: PRODUCT_STATUS.OUT_OF_STOCK,
        });

      assertSuccess(response, 200);

      const returnedProduct = response.body.payload.find(
        (item) => item._id === product._id.toString()
      );

      expect(returnedProduct).to.exist;
      expect(returnedProduct.status).to.equal(
        PRODUCT_STATUS.OUT_OF_STOCK
      );
    });

    it("debe rechazar un estado inválido", async () => {
      const response = await request(app)
        .get("/api/products")
        .query({ status: "invalid-status" });

      assertError(response, 400, "INVALID_PRODUCT_STATUS");
    });
  });

  describe("GET /api/products/:id", () => {
    it("debe obtener un producto existente", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .get(`/api/products/${product._id}`);

      assertSuccess(response, 200);
      expect(response.body.payload._id).to.equal(
        product._id.toString()
      );
      expect(response.body.payload.name).to.equal(
        product.name
      );
    });

    it("debe rechazar un ObjectId inválido", async () => {
      const response = await request(app)
        .get("/api/products/id-invalido");

      assertError(response, 400, "INVALID_OBJECT_ID");
    });

    it("debe devolver 404 si el producto no existe", async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/products/${missingId}`);

      assertError(response, 404, "PRODUCT_NOT_FOUND");
    });
  });

  describe("POST /api/products", () => {
    it("debe crear un producto con stock disponible", async () => {
      const data = createProductData();

      const response = await request(app)
        .post("/api/products")
        .send(data);

      assertSuccess(response, 201);

      expect(response.body.message).to.equal(
        "Producto creado correctamente"
      );

      expect(response.body.payload.status).to.equal(
        PRODUCT_STATUS.AVAILABLE
      );

      const storedProduct = await Product.findById(
        response.body.payload._id
      );

      expect(storedProduct).to.exist;

      productIds.add(storedProduct._id.toString());
    });

    it("debe crear un producto sin stock", async () => {
      const data = createProductData({
        stock: 0,
      });

      const response = await request(app)
        .post("/api/products")
        .send(data);

      assertSuccess(response, 201);

      expect(response.body.payload.stock).to.equal(0);
      expect(response.body.payload.status).to.equal(
        PRODUCT_STATUS.OUT_OF_STOCK
      );

      productIds.add(response.body.payload._id);
    });

    it("debe rechazar campos obligatorios faltantes", async () => {
      const response = await request(app)
        .post("/api/products")
        .send({
          name: "Monitor LED",
        });

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar precios negativos", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(createProductData({
          price: -100,
        }));

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar stock negativo", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(createProductData({
          stock: -1,
        }));

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar stock decimal", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(createProductData({
          stock: 2.5,
        }));

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar campos adicionales", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(createProductData({
          status: PRODUCT_STATUS.AVAILABLE,
        }));

      assertError(response, 400, "VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/products/:id", () => {
    it("debe actualizar los datos generales", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .patch(`/api/products/${product._id}`)
        .send({
          name: "Monitor Profesional",
          price: 350,
        });

      assertSuccess(response, 200);

      expect(response.body.message).to.equal(
        "Producto actualizado correctamente"
      );

      expect(response.body.payload.name).to.equal(
        "Monitor Profesional"
      );

      expect(response.body.payload.price).to.equal(350);

      const storedProduct = await Product.findById(
        product._id
      );

      expect(storedProduct.name).to.equal(
        "Monitor Profesional"
      );
    });

    it("debe rechazar una actualización vacía", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .patch(`/api/products/${product._id}`)
        .send({});

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe impedir modificar el stock desde la actualización general", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .patch(`/api/products/${product._id}`)
        .send({
          stock: 100,
        });

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe devolver 404 al actualizar un producto inexistente", async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/products/${missingId}`)
        .send({
          name: "Producto Nuevo",
        });

      assertError(response, 404, "PRODUCT_NOT_FOUND");
    });
  });

  describe("PATCH /api/products/:id/stock", () => {
    it("debe incrementar el stock", async () => {
      const product = await createStoredProduct({
        stock: 10,
      });

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .send({
          adjustment: 5,
        });

      assertSuccess(response, 200);

      expect(response.body.payload.stock).to.equal(15);
      expect(response.body.payload.status).to.equal(
        PRODUCT_STATUS.AVAILABLE
      );
    });

    it("debe reducir el stock", async () => {
      const product = await createStoredProduct({
        stock: 10,
      });

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .send({
          adjustment: -4,
        });

      assertSuccess(response, 200);
      expect(response.body.payload.stock).to.equal(6);
    });

    it("debe cambiar el estado al agotar el stock", async () => {
      const product = await createStoredProduct({
        stock: 5,
      });

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .send({
          adjustment: -5,
        });

      assertSuccess(response, 200);

      expect(response.body.payload.stock).to.equal(0);
      expect(response.body.payload.status).to.equal(
        PRODUCT_STATUS.OUT_OF_STOCK
      );
    });

    it("debe rechazar un ajuste que produzca stock negativo", async () => {
      const product = await createStoredProduct({
        stock: 3,
      });

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .send({
          adjustment: -5,
        });

      assertError(
        response,
        409,
        "PRODUCT_INSUFFICIENT_STOCK"
      );

      const storedProduct = await Product.findById(
        product._id
      );

      expect(storedProduct.stock).to.equal(3);
    });

    it("debe rechazar un ajuste igual a cero", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .send({
          adjustment: 0,
        });

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar un ajuste decimal", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .patch(`/api/products/${product._id}/stock`)
        .send({
          adjustment: 1.5,
        });

      assertError(response, 400, "VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("debe eliminar un producto sin pedidos asociados", async () => {
      const product = await createStoredProduct();

      const response = await request(app)
        .delete(`/api/products/${product._id}`);

      assertSuccess(response, 200);

      expect(response.body.message).to.equal(
        "Producto eliminado correctamente"
      );

      const storedProduct = await Product.findById(
        product._id
      );

      expect(storedProduct).to.equal(null);
    });

    it("debe impedir eliminar un producto asociado a un pedido", async () => {
      const product = await createStoredProduct();
      const user = await createStoredUser();

      await createStoredOrder(product, user);

      const response = await request(app)
        .delete(`/api/products/${product._id}`);

      assertError(response, 409, "PRODUCT_IN_USE");

      const storedProduct = await Product.findById(
        product._id
      );

      expect(storedProduct).to.exist;
    });

    it("debe devolver 404 al eliminar un producto inexistente", async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/products/${missingId}`);

      assertError(response, 404, "PRODUCT_NOT_FOUND");
    });
  });
});
