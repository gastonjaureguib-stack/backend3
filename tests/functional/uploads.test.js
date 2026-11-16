import { describe, it, before, beforeEach, afterEach, after } from "mocha";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rmdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

import app from "../../src/app.js";
import config from "../../src/config/env.config.js";
import { MAX_FILE_SIZE, uploadRoot } from "../../src/config/multer.config.js";
import { discardFiles } from "../../src/utils/file.utils.js";
import User from "../../src/models/user.model.js";
import Product from "../../src/models/product.model.js";
import Order from "../../src/models/order.model.js";
import Delivery from "../../src/models/delivery.model.js";
import userRepository from "../../src/repositories/user.repository.js";
import deliveryRepository from "../../src/repositories/delivery.repository.js";
import swaggerConfig from "../../src/config/swagger.config.js";

describe("Uploads - Pruebas funcionales", () => {
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6V7sAAAAASUVORK5CYII=",
    "base64"
  );
  const jpeg = Buffer.from([255, 216, 255, 224, 0, 2, 255, 217]);
  const ids = new Map([
    [Delivery, new Set()], [Order, new Set()],
    [Product, new Set()], [User, new Set()],
  ]);
  let user;
  let password;

  const assertConnection = () => {
    if (config.nodeEnv !== "test" || mongoose.connection.name !== "shipnow_test" ||
        mongoose.connection.readyState !== 1) {
      throw new Error("Uploads requiere conexión exclusiva a shipnow_test");
    }
  };

  const assertTemporaryRoot = () => {
    if (dirname(resolve(uploadRoot)) !== resolve(tmpdir()) ||
        !basename(uploadRoot).startsWith(`shipnow-uploads-${process.pid}-`)) {
      throw new Error("Almacenamiento de pruebas no aislado");
    }
  };

  const files = async (directory = uploadRoot) => {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }

    const result = [];
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) result.push(...await files(path));
      else result.push(path);
    }
    return result;
  };

  const store = async (model, data) => {
    assertConnection();
    const id = new mongoose.Types.ObjectId();
    ids.get(model).add(String(id));
    return model.create({ ...data, _id: id });
  };

  const createDelivery = async (status = "delivered") => {
    const driver = await store(User, {
      firstName: "Driver", lastName: "Testing",
      email: `upload-driver-${randomUUID()}@example.com`, password, role: "driver",
    });
    const product = await store(Product, {
      name: "Producto upload", description: "Fixture de carga", category: "Testing",
      price: 100, stock: 10, status: "available",
    });
    const order = await store(Order, {
      user: user._id, products: [{ product: product._id, quantity: 1 }],
      total: 100, status: status === "delivered" ? "delivered" : "shipped",
    });
    const delivery = await store(Delivery, {
      order: order._id, driver: driver._id, status,
      deliveryAddress: "Dirección de pruebas 123",
    });
    return { delivery, order };
  };

  const errorResponse = (response, status, code) => {
    expect(response.status).to.equal(status);
    expect(response.headers["content-type"]).to.include("application/json");
    expect(response.body).to.have.all.keys("status", "code", "message");
    expect(response.body.status).to.equal("error");
    expect(response.body.code).to.equal(code);
    expect(response.body.message).to.be.a("string").and.not.be.empty;
  };

  const documentRequest = (id = user._id) => request(app)
    .post(`/api/users/${id}/documents`);

  before(async () => {
    const uri = new URL(config.mongodbUri);
    if (process.env.NODE_ENV !== "test" || config.nodeEnv !== "test" ||
        uri.protocol !== "mongodb:" || uri.hostname !== "127.0.0.1" ||
        uri.port !== "27017" || uri.pathname !== "/shipnow_test" ||
        uri.searchParams.get("replicaSet") !== "rs0" ||
        [...uri.searchParams.keys()].some((key) => key.toLowerCase() === "dbname")) {
      throw new Error("Configuración de uploads insegura");
    }

    assertTemporaryRoot();
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    assertConnection();
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (hello.setName !== "rs0" || !hello.isWritablePrimary) {
      throw new Error("rs0 requiere un primario disponible");
    }
    await Promise.all([...ids.keys()].map((model) => model.init()));
    password = await bcrypt.hash("ClaveSegura123", 10);
  });

  beforeEach(async () => {
    user = await store(User, {
      firstName: "Usuario", lastName: "Uploads",
      email: `upload-${randomUUID()}@example.com`, password,
    });
  });

  afterEach(async () => {
    const errors = [];
    try {
      assertTemporaryRoot();
      await discardFiles(await files());
      expect(await files()).to.deep.equal([]);
    } catch (error) {
      errors.push(error);
    }

    for (const [model, ownIds] of ids) {
      if (!ownIds.size) continue;
      try {
        assertConnection();
        await model.deleteMany({ _id: { $in: [...ownIds] } });
        ownIds.clear();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length) throw new AggregateError(errors, "Falló limpieza de uploads");
  });

  after(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      assertTemporaryRoot();
      await rm(uploadRoot, { recursive: true, force: true });
    }
  });

  it("debe persistir documentos PDF, JPG, JPEG y PNG con metadatos completos", async () => {
    const formats = [
      ["archivo.pdf", "application/pdf", pdf, "identification"],
      ["archivo.jpg", "image/jpeg", jpeg, "proof_of_address"],
      ["archivo.jpeg", "image/jpeg", jpeg, "other"],
      ["archivo.png", "image/png", png, "identification"],
    ];
    const filenames = new Set();

    for (const [filename, contentType, content, documentType] of formats) {
      const response = await documentRequest()
        .attach("document", content, { filename, contentType })
        .field("documentType", documentType);

      expect(response.status).to.equal(201);
      expect(response.body.status).to.equal("success");
      expect(response.body.message).to.equal("Documento cargado correctamente");
      const metadata = response.body.payload;
      expect(metadata.originalName).to.equal(filename);
      expect(metadata.filename).to.match(/^[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$/);
      expect(metadata.path).to.equal(`users/documents/${metadata.filename}`);
      expect(metadata.mimeType).to.equal(contentType);
      expect(metadata.documentType).to.equal(documentType);
      expect(metadata.size).to.equal(content.length);
      expect(Number.isNaN(Date.parse(metadata.uploadedAt))).to.equal(false);
      expect(await readFile(join(uploadRoot, metadata.path))).to.deep.equal(content);
      filenames.add(metadata.filename);

      const stored = await User.findById(user._id).lean();
      expect(stored.documents.find((file) => String(file._id) === metadata._id))
        .to.include({ filename: metadata.filename, documentType });
    }

    expect(filenames.size).to.equal(formats.length);
    expect((await User.findById(user._id)).documents).to.have.lengthOf(4);
  });

  it("debe asociar un comprobante sin alterar los estados de entrega y pedido", async () => {
    const { delivery, order } = await createDelivery();
    const response = await request(app)
      .post(`/api/deliveries/${delivery._id}/receipts`)
      .attach("receipt", pdf, { filename: "recibo.pdf", contentType: "application/pdf" });

    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal("success");
    expect(response.body.message).to.equal("Comprobante cargado correctamente");
    const metadata = response.body.payload;
    expect(metadata.path).to.equal(`deliveries/receipts/${metadata.filename}`);
    expect(metadata).not.to.have.property("documentType");
    expect(await readFile(join(uploadRoot, metadata.path))).to.deep.equal(pdf);
    const stored = await Delivery.findById(delivery._id).lean();
    expect(stored.receipts).to.have.lengthOf(1);
    expect(String(stored.receipts[0]._id)).to.equal(metadata._id);
    expect(stored.status).to.equal("delivered");
    expect((await Order.findById(order._id)).status).to.equal("delivered");
  });

  it("debe rechazar un archivo ausente", async () => {
    const response = await documentRequest().field("documentType", "other");
    errorResponse(response, 400, "FILE_REQUIRED");
    expect(await files()).to.deep.equal([]);
  });

  for (const documentType of [undefined, "invalid"]) {
    it(`debe limpiar el archivo con documentType ${documentType ?? "ausente"}`, async () => {
      let upload = documentRequest()
        .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
      if (documentType !== undefined) upload = upload.field("documentType", documentType);
      const response = await upload;
      errorResponse(response, 400, "INVALID_DOCUMENT_TYPE");
      expect(await files()).to.deep.equal([]);
      expect((await User.findById(user._id)).documents).to.have.lengthOf(0);
    });
  }

  it("debe rechazar IDs inválidos y entidades inexistentes antes de almacenar", async () => {
    for (const [id, status, code] of [
      ["invalid", 400, "INVALID_OBJECT_ID"],
      [new mongoose.Types.ObjectId(), 404, "USER_NOT_FOUND"],
    ]) {
      const response = await documentRequest(id).field("documentType", "other")
        .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
      errorResponse(response, status, code);
    }

    const response = await request(app)
      .post(`/api/deliveries/${new mongoose.Types.ObjectId()}/receipts`)
      .attach("receipt", pdf, { filename: "recibo.pdf", contentType: "application/pdf" });
    errorResponse(response, 404, "DELIVERY_NOT_FOUND");
    expect(await files()).to.deep.equal([]);
  });

  for (const [filename, contentType, content] of [
    ["doc.txt", "text/plain", Buffer.from("texto")],
    ["doc.pdf", "image/png", png],
    ["doc.pdf", "application/pdf", Buffer.from("contenido falso")],
  ]) {
    it(`debe rechazar extensión, MIME o firma incompatible: ${filename} ${contentType}`, async () => {
      const response = await documentRequest().field("documentType", "other")
        .attach("document", content, { filename, contentType });
      errorResponse(response, 400, "INVALID_FILE_TYPE");
      expect(await files()).to.deep.equal([]);
      expect((await User.findById(user._id)).documents).to.have.lengthOf(0);
    });
  }

  it("debe rechazar archivos mayores a 5 MiB sin dejar residuos", async () => {
    const large = Buffer.alloc(MAX_FILE_SIZE + 1);
    pdf.copy(large);
    const response = await documentRequest().field("documentType", "other")
      .attach("document", large, { filename: "large.pdf", contentType: "application/pdf" });
    errorResponse(response, 413, "FILE_TOO_LARGE");
    expect(await files()).to.deep.equal([]);
  });

  it("debe rechazar un campo de archivo incorrecto", async () => {
    const response = await documentRequest().field("documentType", "other")
      .attach("receipt", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
    errorResponse(response, 400, "UNEXPECTED_FILE");
    expect(await files()).to.deep.equal([]);
  });

  it("debe rechazar archivos adicionales y limpiar el primero", async () => {
    const response = await documentRequest().field("documentType", "other")
      .attach("document", pdf, { filename: "one.pdf", contentType: "application/pdf" })
      .attach("document", pdf, { filename: "two.pdf", contentType: "application/pdf" });
    errorResponse(response, 400, "UNEXPECTED_FILE");
    expect(await files()).to.deep.equal([]);
  });

  it("debe rechazar todos los estados de entrega distintos de delivered", async () => {
    for (const status of ["pending", "assigned", "in_transit", "cancelled"]) {
      const { delivery } = await createDelivery(status);
      const response = await request(app)
        .post(`/api/deliveries/${delivery._id}/receipts`)
        .attach("receipt", pdf, { filename: "recibo.pdf", contentType: "application/pdf" });
      errorResponse(response, 409, "DELIVERY_RECEIPT_NOT_ALLOWED");
      expect((await Delivery.findById(delivery._id)).status).to.equal(status);
    }
    expect(await files()).to.deep.equal([]);
  });

  it("debe limpiar el archivo ante un fallo de persistencia confirmado", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(userRepository, "addDocument");
    userRepository.addDocument = async () => {
      throw new mongoose.Error.ValidationError();
    };

    try {
      const response = await documentRequest().field("documentType", "other")
        .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
      errorResponse(response, 500, "INTERNAL_SERVER_ERROR");
      expect(await files()).to.deep.equal([]);
      expect((await User.findById(user._id)).documents).to.have.lengthOf(0);
    } finally {
      if (descriptor) Object.defineProperty(userRepository, "addDocument", descriptor);
      else delete userRepository.addDocument;
    }
  });

  it("debe conservar un archivo asociado si la escritura se confirma antes de fallar", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(userRepository, "addDocument");
    const original = userRepository.addDocument;
    userRepository.addDocument = async function (...args) {
      await Reflect.apply(original, this, args);
      throw new Error("Respuesta de escritura incierta");
    };

    try {
      const response = await documentRequest().field("documentType", "other")
        .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
      errorResponse(response, 500, "INTERNAL_SERVER_ERROR");
      const stored = await User.findById(user._id).lean();
      expect(stored.documents).to.have.lengthOf(1);
      expect(await readFile(join(uploadRoot, stored.documents[0].path))).to.deep.equal(pdf);
    } finally {
      if (descriptor) Object.defineProperty(userRepository, "addDocument", descriptor);
      else delete userRepository.addDocument;
    }
  });

  it("debe conservar el archivo si no puede verificarse una escritura incierta", async () => {
    const descriptors = ["addDocument", "hasDocument"].map((key) => [
      key, Object.getOwnPropertyDescriptor(userRepository, key),
    ]);
    userRepository.addDocument = async () => { throw new Error("Sin respuesta de escritura"); };
    userRepository.hasDocument = async () => { throw new Error("Verificación no disponible"); };

    try {
      const response = await documentRequest().field("documentType", "other")
        .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
      errorResponse(response, 500, "INTERNAL_SERVER_ERROR");
      expect(await files()).to.have.lengthOf(1);
    } finally {
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(userRepository, key, descriptor);
        else delete userRepository[key];
      }
    }
  });

  it("debe conservar el archivo cuando una lectura vacía no resuelve la escritura incierta", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(userRepository, "addDocument");
    userRepository.addDocument = async () => { throw new Error("Resultado de escritura desconocido"); };

    try {
      const response = await documentRequest().field("documentType", "other")
        .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
      errorResponse(response, 500, "INTERNAL_SERVER_ERROR");
      expect((await User.findById(user._id)).documents).to.have.lengthOf(0);
      expect(await files()).to.have.lengthOf(1);
    } finally {
      if (descriptor) Object.defineProperty(userRepository, "addDocument", descriptor);
      else delete userRepository.addDocument;
    }
  });

  it("debe centralizar un error de almacenamiento sin asociar metadatos", async () => {
    assertTemporaryRoot();
    await mkdir(join(uploadRoot, "users"), { recursive: true });
    const destination = join(uploadRoot, "users", "documents");

    try {
      await rmdir(destination);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    await writeFile(destination, "obstáculo de almacenamiento del propio test");
    const response = await documentRequest().field("documentType", "other")
      .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
    errorResponse(response, 500, "FILE_STORAGE_ERROR");
    expect(response.body.message).to.equal("Error interno del servidor");
    expect((await User.findById(user._id)).documents).to.have.lengthOf(0);
  });

  it("debe limpiar un comprobante si cambia el estado antes de asociarlo", async () => {
    const { delivery } = await createDelivery();
    const descriptor = Object.getOwnPropertyDescriptor(deliveryRepository, "addReceipt");
    const original = deliveryRepository.addReceipt;
    deliveryRepository.addReceipt = async function (...args) {
      await Delivery.updateOne({ _id: delivery._id }, { $set: { status: "cancelled" } });
      return Reflect.apply(original, this, args);
    };

    try {
      const response = await request(app)
        .post(`/api/deliveries/${delivery._id}/receipts`)
        .attach("receipt", pdf, { filename: "recibo.pdf", contentType: "application/pdf" });
      errorResponse(response, 409, "DELIVERY_RECEIPT_NOT_ALLOWED");
      expect(await files()).to.deep.equal([]);
      expect((await Delivery.findById(delivery._id)).receipts).to.have.lengthOf(0);
    } finally {
      if (descriptor) Object.defineProperty(deliveryRepository, "addReceipt", descriptor);
      else delete deliveryRepository.addReceipt;
    }
  });

  it("debe eliminar los archivos propios cuando se elimina el usuario", async () => {
    const upload = await documentRequest().field("documentType", "identification")
      .attach("document", pdf, { filename: "doc.pdf", contentType: "application/pdf" });
    expect(upload.status).to.equal(201);
    const response = await request(app).delete(`/api/users/${user._id}`);
    expect(response.status).to.equal(200);
    expect(await User.findById(user._id)).to.equal(null);
    expect(await files()).to.deep.equal([]);
  });

  it("debe documentar ambos campos multipart y el enum documentType", () => {
    for (const [path, field] of [
      ["/api/users/{id}/documents", "document"],
      ["/api/deliveries/{id}/receipts", "receipt"],
    ]) {
      const operation = swaggerConfig.paths[path].post;
      const schema = operation.requestBody.content["multipart/form-data"].schema;
      expect(schema.required).to.include(field);
      expect(schema.properties[field].format).to.equal("binary");
      expect(operation.responses).to.include.all.keys("201", "400", "404", "413", "500");
      if (field === "document") {
        expect(schema.required).to.include("documentType");
        expect(schema.properties.documentType.enum).to.deep.equal([
          "identification", "proof_of_address", "other",
        ]);
      } else {
        expect(operation.responses).to.have.property("409");
      }
    }
  });
});
