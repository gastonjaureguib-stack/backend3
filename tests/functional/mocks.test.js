
import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import app from "../../src/app.js";
import config from "../../src/config/env.config.js";
import User from "../../src/models/user.model.js";
import Product from "../../src/models/product.model.js";
import Order from "../../src/models/order.model.js";
import Delivery from "../../src/models/delivery.model.js";
import userRepository from "../../src/repositories/user.repository.js";
import productRepository from "../../src/repositories/product.repository.js";
import orderRepository from "../../src/repositories/order.repository.js";
import deliveryRepository from "../../src/repositories/delivery.repository.js";
import {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
} from "../../src/constants/index.js";

describe("Mocks - Pruebas funcionales", () => {
  const assertSuccess = (response, quantity) => {
    expect(response.status).to.equal(200);
    expect(response.headers["content-type"]).to.include("application/json");
    expect(response.body.status).to.equal("success");
    expect(response.body.quantity).to.equal(quantity);
    expect(response.body.payload).to.be.an("array");
    expect(response.body.payload).to.have.lengthOf(quantity);
  };

  const assertError = (response, code) => {
    expect(response.status).to.equal(400);
    expect(response.headers["content-type"]).to.include("application/json");
    expect(response.body.status).to.equal("error");
    expect(response.body.code).to.equal(code);
    expect(response.body.message).to.be.a("string").and.not.be.empty;
  };

  const assertObjectId = (value) => {
    expect(String(value)).to.match(/^[a-fA-F0-9]{24}$/);
  };

  const assertUser = (user, role) => {
    expect(user).to.be.an("object");
    expect(user.firstName).to.be.a("string").and.not.be.empty;
    expect(user.lastName).to.be.a("string").and.not.be.empty;
    expect(user.email).to.be.a("string");
    expect(user.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(user.password).to.be.a("string").and.not.be.empty;
    expect(user.role).to.be.oneOf(Object.values(USER_ROLES));
    expect(user.role).to.equal(role);
  };

  const assertProduct = (product) => {
    expect(product).to.be.an("object");
    expect(product.name).to.be.a("string").and.not.be.empty;
    expect(product.description).to.be.a("string").and.not.be.empty;
    expect(product.category).to.be.a("string").and.not.be.empty;
    expect(product.price).to.be.a("number");
    expect(Number.isFinite(product.price)).to.equal(true);
    expect(product.price).to.be.at.least(0);
    expect(Number.isSafeInteger(product.stock)).to.equal(true);
    expect(product.stock).to.be.at.least(0);
    expect(product.status).to.be.oneOf(Object.values(PRODUCT_STATUS));
    expect(product.status).to.equal(
      product.stock > 0
        ? PRODUCT_STATUS.AVAILABLE
        : PRODUCT_STATUS.OUT_OF_STOCK
    );
  };

  const assertOrder = (order) => {
    expect(order).to.be.an("object");
    assertObjectId(order.user);
    expect(order.products).to.be.an("array").and.not.be.empty;

    for (const item of order.products) {
      assertObjectId(item.product);
      expect(Number.isSafeInteger(item.quantity)).to.equal(true);
      expect(item.quantity).to.be.greaterThan(0);
    }

    expect(order.total).to.be.a("number");
    expect(Number.isFinite(order.total)).to.equal(true);
    expect(order.total).to.be.at.least(0);
    expect(order.status).to.be.oneOf(Object.values(ORDER_STATUS));
    expect(order.priority).to.be.oneOf(Object.values(ORDER_PRIORITY));
  };

  const assertDelivery = (delivery) => {
    expect(delivery).to.be.an("object");
    assertObjectId(delivery.order);
    assertObjectId(delivery.driver);
    expect(delivery.deliveryAddress).to.be.a("string").and.not.be.empty;
    expect(delivery.status).to.be.oneOf(Object.values(DELIVERY_STATUS));
  };

  const validateTestEnvironment = () => {
    const uri = new URL(config.mongodbUri);

    if (
      process.env.NODE_ENV !== "test" ||
      config.nodeEnv !== "test" ||
      uri.protocol !== "mongodb:" ||
      uri.hostname !== "127.0.0.1" ||
      uri.port !== "27017" ||
      uri.pathname !== "/shipnow_test" ||
      uri.searchParams.getAll("replicaSet").length !== 1 ||
      uri.searchParams.get("replicaSet") !== "rs0" ||
      [...uri.searchParams.keys()].some(
        (key) => key.toLowerCase() === "dbname"
      )
    ) {
      throw new Error(
        "Las pruebas deben utilizar MongoDB local, shipnow_test y rs0"
      );
    }
  };

  const validateTestConnection = () => {
    validateTestEnvironment();

    if (
      mongoose.connection.readyState !== 1 ||
      mongoose.connection.name !== "shipnow_test"
    ) {
      throw new Error("La conexión activa no utiliza shipnow_test");
    }
  };

  const installTracking = (entry) => {
    const { repository, model, ids, original, descriptor } = entry;

    const wrapper = async function (documents, ...args) {
      validateTestConnection();

      const preparedDocuments = [];

      for (const document of documents) {
        let id = new mongoose.Types.ObjectId();

        while (await model.exists({ _id: id })) {
          id = new mongoose.Types.ObjectId();
        }

        preparedDocuments.push({ ...document, _id: id });
      }

      for (const document of preparedDocuments) {
        ids.add(document._id.toString());
      }

      return Reflect.apply(original, this, [preparedDocuments, ...args]);
    };

    Object.defineProperty(repository, "createMany", {
      configurable: true,
      enumerable: descriptor?.enumerable ?? false,
      writable: true,
      value: wrapper,
    });
  };

  const cleanTrackedDocuments = async (entries) => {
    const errors = [];

    for (const { model, ids } of entries) {
      if (ids.size === 0) {
        continue;
      }

      try {
        validateTestConnection();

        const filter = { _id: { $in: [...ids] } };

        await model.deleteMany(filter);

        const remaining = await model.countDocuments(filter);

        if (remaining !== 0) {
          throw new Error(`Quedaron ${remaining} documentos propios`);
        }

        ids.clear();
      } catch (error) {
        errors.push(
          new Error(
            `No se pudo completar la limpieza de ${model.modelName}`,
            { cause: error }
          )
        );
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, "Falló la limpieza selectiva del seed");
    }
  };

  describe("GET /api/mocks/users", () => {
    it("debe generar la cantidad solicitada de usuarios", async () => {
      const response = await request(app)
        .get("/api/mocks/users?qty=2");

      assertSuccess(response, 2);

      for (const user of response.body.payload) {
        assertUser(user, USER_ROLES.USER);
      }
    });

    it("debe generar diez usuarios por defecto", async () => {
      const response = await request(app)
        .get("/api/mocks/users");

      assertSuccess(response, 10);

      for (const user of response.body.payload) {
        assertUser(user, USER_ROLES.USER);
      }
    });

    it("debe rechazar cantidades inválidas", async () => {
      for (const quantity of [
        "0", "-1", "1.5", "abc", "", "9007199254740992",
      ]) {
        const response = await request(app)
          .get("/api/mocks/users")
          .query({ qty: quantity });

        assertError(response, "INVALID_MOCK_QUANTITY");
      }
    });
  });

  describe("GET /api/mocks/drivers", () => {
    it("debe generar repartidores", async () => {
      const response = await request(app)
        .get("/api/mocks/drivers?qty=2");

      assertSuccess(response, 2);

      for (const driver of response.body.payload) {
        assertUser(driver, USER_ROLES.DRIVER);
      }
    });

    it("debe rechazar qty=0", async () => {
      const response = await request(app)
        .get("/api/mocks/drivers?qty=0");

      assertError(response, "INVALID_MOCK_QUANTITY");
    });
  });

  describe("GET /api/mocks/products", () => {
    it("debe generar productos", async () => {
      const response = await request(app)
        .get("/api/mocks/products?qty=2");

      assertSuccess(response, 2);

      for (const product of response.body.payload) {
        assertProduct(product);
      }
    });

    it("debe rechazar qty=0", async () => {
      const response = await request(app)
        .get("/api/mocks/products?qty=0");

      assertError(response, "INVALID_MOCK_QUANTITY");
    });
  });

  describe("GET /api/mocks/orders", () => {
    it("debe generar pedidos", async () => {
      const response = await request(app)
        .get("/api/mocks/orders?qty=2");

      assertSuccess(response, 2);

      for (const order of response.body.payload) {
        assertOrder(order);
      }
    });

    it("debe rechazar qty=0", async () => {
      const response = await request(app)
        .get("/api/mocks/orders?qty=0");

      assertError(response, "INVALID_MOCK_QUANTITY");
    });
  });

  describe("GET /api/mocks/deliveries", () => {
    it("debe generar entregas", async () => {
      const response = await request(app)
        .get("/api/mocks/deliveries?qty=2");

      assertSuccess(response, 2);

      for (const delivery of response.body.payload) {
        assertDelivery(delivery);
      }
    });

    it("debe rechazar qty=0", async () => {
      const response = await request(app)
        .get("/api/mocks/deliveries?qty=0");

      assertError(response, "INVALID_MOCK_QUANTITY");
    });
  });

  describe("POST /api/mocks/seed", () => {
    it("debe rechazar una cantidad inválida", async () => {
      const response = await request(app)
        .post("/api/mocks/seed?qty=0");

      assertError(response, "INVALID_MOCK_QUANTITY");
    });

    it("debe persistir los datos y limpiar solo sus documentos", async () => {
      validateTestEnvironment();

      if (mongoose.connection.readyState !== 0) {
        throw new Error(
          "El test de seed requiere comenzar sin una conexión MongoDB activa"
        );
      }

      const entries = [
        { repository: userRepository, model: User, ids: new Set() },
        { repository: productRepository, model: Product, ids: new Set() },
        { repository: orderRepository, model: Order, ids: new Set() },
        { repository: deliveryRepository, model: Delivery, ids: new Set() },
      ].map((entry) => ({
        ...entry,
        original: entry.repository.createMany,
        descriptor: Object.getOwnPropertyDescriptor(
          entry.repository,
          "createMany"
        ),
      }));

      const [usersEntry, productsEntry, ordersEntry, deliveriesEntry] = entries;
      const errors = [];

      try {
        await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 5000,
        });

        validateTestConnection();

        const hello = await mongoose.connection.db.admin().command({ hello: 1 });

        if (hello.setName !== "rs0" || !hello.isWritablePrimary) {
          throw new Error("rs0 no tiene un primario disponible");
        }

        await Promise.all([
          User.init(), Product.init(), Order.init(), Delivery.init(),
        ]);

        for (const entry of entries) {
          installTracking(entry);
        }

        const response = await request(app)
          .post("/api/mocks/seed?qty=1");

        expect(response.status).to.equal(201);
        expect(response.headers["content-type"]).to.include("application/json");
        expect(response.body.status).to.equal("success");
        expect(response.body.message).to.equal(
          "Datos de prueba insertados correctamente"
        );
        expect(response.body.payload).to.deep.equal({
          users: 1,
          drivers: 1,
          products: 1,
          orders: 1,
          deliveries: 1,
        });

        expect(usersEntry.ids.size).to.equal(2);
        expect(productsEntry.ids.size).to.equal(1);
        expect(ordersEntry.ids.size).to.equal(1);
        expect(deliveriesEntry.ids.size).to.equal(1);

        const [users, products, orders, deliveries] = await Promise.all([
          User.find({ _id: { $in: [...usersEntry.ids] } }).lean(),
          Product.find({ _id: { $in: [...productsEntry.ids] } }).lean(),
          Order.find({ _id: { $in: [...ordersEntry.ids] } }).lean(),
          Delivery.find({ _id: { $in: [...deliveriesEntry.ids] } }).lean(),
        ]);

        expect(users).to.have.lengthOf(2);
        expect(products).to.have.lengthOf(1);
        expect(orders).to.have.lengthOf(1);
        expect(deliveries).to.have.lengthOf(1);

        const user = users.find((item) => item.role === USER_ROLES.USER);
        const driver = users.find((item) => item.role === USER_ROLES.DRIVER);
        const [product] = products;
        const [order] = orders;
        const [delivery] = deliveries;

        expect(user).to.exist;
        expect(driver).to.exist;
        assertUser(user, USER_ROLES.USER);
        assertUser(driver, USER_ROLES.DRIVER);
        assertProduct(product);
        assertOrder(order);
        assertDelivery(delivery);

        for (const storedUser of users) {
          expect(storedUser.password).to.match(
            /^\$2[ab]\$10\$[./A-Za-z0-9]{53}$/
          );
          expect(bcrypt.getRounds(storedUser.password)).to.equal(10);
        }

        expect(String(order.user)).to.equal(String(user._id));
        expect(order.products).to.have.lengthOf(1);
        expect(String(order.products[0].product)).to.equal(String(product._id));
        expect(order.products[0].quantity).to.be.at.most(product.stock);
        expect(order.total).to.equal(
          product.price * order.products[0].quantity
        );
        expect(String(delivery.order)).to.equal(String(order._id));
        expect(String(delivery.driver)).to.equal(String(driver._id));
      } catch (error) {
        errors.push(error);
      } finally {
        for (const entry of entries) {
          try {
            const restored = entry.descriptor
              ? Reflect.defineProperty(
                  entry.repository, "createMany", entry.descriptor
                )
              : Reflect.deleteProperty(entry.repository, "createMany");

            if (!restored) {
              throw new Error("La restauración fue rechazada");
            }

            const hasOwnMethod = Object.prototype.hasOwnProperty.call(
              entry.repository, "createMany"
            );

            if (
              hasOwnMethod !== Boolean(entry.descriptor) ||
              entry.repository.createMany !== entry.original
            ) {
              throw new Error("createMany no coincide con su estado original");
            }
          } catch (error) {
            errors.push(
              new Error(
                `No se pudo restaurar ${entry.model.modelName}.createMany`,
                { cause: error }
              )
            );
          }
        }

        try {
          await cleanTrackedDocuments([
            deliveriesEntry, ordersEntry, productsEntry, usersEntry,
          ]);
        } catch (error) {
          errors.push(error);
        }

        try {
          await mongoose.disconnect();
        } catch (error) {
          errors.push(error);
        }
      }

      if (errors.length === 1) {
        throw errors[0];
      }

      if (errors.length > 1) {
        throw new AggregateError(
          errors,
          "Falló el test de seed o su limpieza",
          { cause: errors[0] }
        );
      }
    });
  });
});
