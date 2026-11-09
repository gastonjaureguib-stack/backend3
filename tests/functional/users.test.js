
import { describe, it, before, after, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

import app from "../../src/app.js";
import config from "../../src/config/env.config.js";
import User from "../../src/models/user.model.js";

describe("Users - Pruebas funcionales", () => {
  const createdUserIds = new Set();
  let testUser;

  const createUserData = (overrides = {}) => ({
    firstName: "Ana",
    lastName: "Pérez",
    email: `testing-${randomUUID()}@example.com`,
    password: "ClaveSegura123",
    ...overrides,
  });

  const createStoredUser = async (overrides = {}) => {
    const data = createUserData(overrides);

    const password = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      ...data,
      password,
    });

    createdUserIds.add(user._id.toString());

    return user;
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

    await User.init();
  });

  beforeEach(async () => {
    testUser = null;
  });

  afterEach(async () => {
    if (
      mongoose.connection.readyState !== 1 ||
      mongoose.connection.name !== "shipnow_test"
    ) {
      return;
    }

    if (createdUserIds.size > 0) {
      await User.deleteMany({
        _id: {
          $in: [...createdUserIds],
        },
      });

      createdUserIds.clear();
    }
  });

  after(async () => {
    await mongoose.disconnect();
  });

  describe("GET /api/users", () => {
    it("debe devolver un listado de usuarios", async () => {
      const response = await request(app)
        .get("/api/users");

      assertSuccess(response, 200);
      expect(response.body.payload).to.be.an("array");
    });

    it("debe devolver usuarios sin exponer contraseñas", async () => {
      const user = await createStoredUser();

      const response = await request(app)
        .get("/api/users");

      assertSuccess(response, 200);

      const returnedUser = response.body.payload.find(
        (item) => item._id === user._id.toString()
      );

      expect(returnedUser).to.exist;
      expect(returnedUser.firstName).to.equal("Ana");
      expect(returnedUser.lastName).to.equal("Pérez");
      expect(returnedUser.email).to.equal(user.email);
      expect(returnedUser).to.not.have.property("password");
      expect(returnedUser).to.not.have.property("__v");
    });
  });

  describe("GET /api/users/:id", () => {
    it("debe obtener un usuario existente", async () => {
      const user = await createStoredUser();

      const response = await request(app)
        .get(`/api/users/${user._id}`);

      assertSuccess(response, 200);
      expect(response.body.payload._id).to.equal(
        user._id.toString()
      );
      expect(response.body.payload.email).to.equal(user.email);
      expect(response.body.payload).to.not.have.property(
        "password"
      );
    });

    it("debe rechazar un ObjectId inválido", async () => {
      const response = await request(app)
        .get("/api/users/id-invalido");

      assertError(response, 400, "INVALID_OBJECT_ID");
    });

    it("debe devolver 404 si el usuario no existe", async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/users/${missingId}`);

      assertError(response, 404, "USER_NOT_FOUND");
    });
  });

  describe("POST /api/users", () => {
    it("debe crear un usuario con contraseña cifrada", async () => {
      const data = createUserData();

      const response = await request(app)
        .post("/api/users")
        .send(data);

      assertSuccess(response, 201);

      expect(response.body.message).to.equal(
        "Usuario creado correctamente"
      );

      expect(response.body.payload.email).to.equal(data.email);
      expect(response.body.payload).to.not.have.property(
        "password"
      );

      const storedUser = await User.findOne({
        email: data.email,
      });

      expect(storedUser).to.exist;

      createdUserIds.add(storedUser._id.toString());

      expect(storedUser.password).to.not.equal(data.password);

      const validPassword = await bcrypt.compare(
        data.password,
        storedUser.password
      );

      expect(validPassword).to.equal(true);
    });

    it("debe rechazar datos inválidos", async () => {
      const response = await request(app)
        .post("/api/users")
        .send({
          firstName: "A",
          lastName: "P",
          email: "correo-invalido",
          password: "123",
        });

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar un correo duplicado", async () => {
      const user = await createStoredUser();

      const response = await request(app)
        .post("/api/users")
        .send(createUserData({ email: user.email }));

      assertError(response, 409, "EMAIL_ALREADY_EXISTS");
    });
  });

  describe("PATCH /api/users/:id", () => {
    it("debe actualizar los datos de un usuario", async () => {
      const user = await createStoredUser();

      const response = await request(app)
        .patch(`/api/users/${user._id}`)
        .send({
          firstName: "María",
        });

      assertSuccess(response, 200);

      expect(response.body.message).to.equal(
        "Usuario actualizado correctamente"
      );

      expect(response.body.payload.firstName).to.equal(
        "María"
      );

      expect(response.body.payload).to.not.have.property(
        "password"
      );

      const storedUser = await User.findById(user._id);

      expect(storedUser.firstName).to.equal("María");
    });

    it("debe rechazar una actualización vacía", async () => {
      const user = await createStoredUser();

      const response = await request(app)
        .patch(`/api/users/${user._id}`)
        .send({});

      assertError(response, 400, "VALIDATION_ERROR");
    });

    it("debe rechazar un correo utilizado por otro usuario", async () => {
      const firstUser = await createStoredUser();
      const secondUser = await createStoredUser();

      const response = await request(app)
        .patch(`/api/users/${secondUser._id}`)
        .send({
          email: firstUser.email,
        });

      assertError(response, 409, "EMAIL_ALREADY_EXISTS");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("debe eliminar un usuario existente", async () => {
      const user = await createStoredUser();

      const response = await request(app)
        .delete(`/api/users/${user._id}`);

      assertSuccess(response, 200);

      expect(response.body.message).to.equal(
        "Usuario eliminado correctamente"
      );

      const storedUser = await User.findById(user._id);

      expect(storedUser).to.equal(null);
    });

    it("debe devolver 404 al eliminar un usuario inexistente", async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/users/${missingId}`);

      assertError(response, 404, "USER_NOT_FOUND");
    });
  });

  describe("Rutas inexistentes", () => {
    it("debe devolver ROUTE_NOT_FOUND", async () => {
      const response = await request(app)
        .get("/api/users/ruta/no/existente");

      assertError(response, 404, "ROUTE_NOT_FOUND");
    });
  });
});
