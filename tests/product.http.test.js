
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";

// ============================================
// CONFIGURACIÓN SEGURA DEL ENTORNO
// ============================================

const TEST_DATABASE = "shipnow_test";

const TEST_MONGODB_URI =
  `mongodb://127.0.0.1:27017/${TEST_DATABASE}?replicaSet=rs0`;

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.MONGODB_URI = TEST_MONGODB_URI;

// Importaciones dinámicas: la configuración del
// entorno debe existir antes de cargar Express.
const { default: app } = await import("../src/app.js");

const { default: User } =
  await import("../src/models/user.model.js");

const { default: Product } =
  await import("../src/models/product.model.js");

const { default: Order } =
  await import("../src/models/order.model.js");

const { default: Delivery } =
  await import("../src/models/delivery.model.js");

const { PRODUCT_STATUS } =
  await import("../src/constants/index.js");

let product;

// ============================================
// DATOS DE PRUEBA
// ============================================

function createProductData(overrides = {}) {
  return {
    name: "Producto HTTP",
    description: "Producto utilizado en pruebas HTTP",
    category: "Testing",
    price: 100,
    stock: 10,
    ...overrides,
  };
}

async function getStoredProduct(id) {
  return Product.findById(id).lean();
}

// ============================================
// CONFIGURACIÓN Y LIMPIEZA
// ============================================

before(async () => {
  assert.equal(
    new URL(TEST_MONGODB_URI).pathname,
    `/${TEST_DATABASE}`,
    "La URI debe apuntar a shipnow_test."
  );

  await mongoose.connect(TEST_MONGODB_URI);

  assert.equal(
    mongoose.connection.name,
    TEST_DATABASE,
    "La conexión no utiliza la base de pruebas."
  );

  await Promise.all([
    User.init(),
    Product.init(),
    Order.init(),
    Delivery.init(),
  ]);
});

beforeEach(async () => {
  assert.equal(
    mongoose.connection.name,
    TEST_DATABASE
  );

  await Delivery.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});

  product = await Product.create({
    ...createProductData(),
    status: PRODUCT_STATUS.AVAILABLE,
  });
});

after(async () => {
  if (
    mongoose.connection.readyState === 1 &&
    mongoose.connection.name === TEST_DATABASE
  ) {
    await Delivery.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  }

  await mongoose.disconnect();
});

// ============================================
// GET /api/products
// ============================================

test("GET /api/products devuelve productos", async () => {
  const response = await request(app)
    .get("/api/products");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");
  assert.ok(Array.isArray(response.body.payload));

  assert.equal(response.body.payload.length, 1);
  assert.equal(
    response.body.payload[0]._id,
    String(product._id)
  );
});

test("GET /api/products filtra por categoría", async () => {
  await Product.create({
    ...createProductData({
      name: "Producto de jardinería",
      category: "Jardinería",
    }),
    status: PRODUCT_STATUS.AVAILABLE,
  });

  const response = await request(app)
    .get("/api/products")
    .query({ category: "Jardinería" });

  assert.equal(response.status, 200);
  assert.equal(response.body.payload.length, 1);
  assert.equal(
    response.body.payload[0].category,
    "Jardinería"
  );
});

test("GET /api/products rechaza un estado inválido", async () => {
  const response = await request(app)
    .get("/api/products")
    .query({ status: "invalid" });

  assert.equal(response.status, 400);
  assert.equal(response.body.status, "error");
  assert.equal(
    response.body.code,
    "INVALID_PRODUCT_STATUS"
  );
});

// ============================================
// GET /api/products/:id
// ============================================

test("GET /api/products/:id obtiene un producto", async () => {
  const response = await request(app)
    .get(`/api/products/${product._id}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.payload._id,
    String(product._id)
  );
});

test("GET /api/products/:id rechaza un ObjectId inválido", async () => {
  const response = await request(app)
    .get("/api/products/identificador-invalido");

  assert.equal(response.status, 400);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.code, "INVALID_OBJECT_ID");
});

test("GET /api/products/:id devuelve 404 si no existe", async () => {
  const missingId = new mongoose.Types.ObjectId();

  const response = await request(app)
    .get(`/api/products/${missingId}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.code, "PRODUCT_NOT_FOUND");
});

// ============================================
// POST /api/products
// ============================================

test("POST /api/products crea un producto", async () => {
  const response = await request(app)
    .post("/api/products")
    .send(
      createProductData({
        name: "Producto creado por HTTP",
        stock: 5,
      })
    );

  assert.equal(response.status, 201);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.message,
    "Producto creado correctamente"
  );

  assert.ok(response.body.payload._id);
  assert.equal(response.body.payload.stock, 5);
  assert.equal(
    response.body.payload.status,
    PRODUCT_STATUS.AVAILABLE
  );

  const stored = await getStoredProduct(
    response.body.payload._id
  );

  assert.ok(stored);
});

test("POST /api/products rechaza stock negativo", async () => {
  const response = await request(app)
    .post("/api/products")
    .send(createProductData({ stock: -5 }));

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");

  assert.equal(
    await Product.countDocuments(),
    1
  );
});

test("POST /api/products rechaza campos desconocidos", async () => {
  const response = await request(app)
    .post("/api/products")
    .send({
      ...createProductData(),
      campoDesconocido: true,
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");
});

// ============================================
// PATCH /api/products/:id
// ============================================

test("PATCH /api/products/:id actualiza datos generales", async () => {
  const response = await request(app)
    .patch(`/api/products/${product._id}`)
    .send({
      name: "Producto actualizado",
      price: 250,
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.message,
    "Producto actualizado correctamente"
  );

  assert.equal(
    response.body.payload.name,
    "Producto actualizado"
  );

  assert.equal(response.body.payload.price, 250);

  const stored = await getStoredProduct(product._id);

  assert.equal(stored.name, "Producto actualizado");
  assert.equal(stored.stock, 10);
});

test("PATCH /api/products/:id impide modificar stock directamente", async () => {
  const response = await request(app)
    .patch(`/api/products/${product._id}`)
    .send({ stock: 50 });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");

  const stored = await getStoredProduct(product._id);

  assert.equal(stored.stock, 10);
});

// ============================================
// PATCH /api/products/:id/stock
// ============================================

test("PATCH /api/products/:id/stock incrementa inventario", async () => {
  const response = await request(app)
    .patch(`/api/products/${product._id}/stock`)
    .send({ adjustment: 5 });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.message,
    "Inventario actualizado correctamente"
  );

  assert.equal(response.body.payload.stock, 15);

  const stored = await getStoredProduct(product._id);

  assert.equal(stored.stock, 15);
});

test("PATCH /api/products/:id/stock marca producto agotado", async () => {
  const response = await request(app)
    .patch(`/api/products/${product._id}/stock`)
    .send({ adjustment: -10 });

  assert.equal(response.status, 200);
  assert.equal(response.body.payload.stock, 0);
  assert.equal(
    response.body.payload.status,
    PRODUCT_STATUS.OUT_OF_STOCK
  );
});

test("PATCH /api/products/:id/stock rechaza stock insuficiente", async () => {
  const response = await request(app)
    .patch(`/api/products/${product._id}/stock`)
    .send({ adjustment: -20 });

  assert.equal(response.status, 409);
  assert.equal(
    response.body.code,
    "PRODUCT_INSUFFICIENT_STOCK"
  );

  const stored = await getStoredProduct(product._id);

  assert.equal(stored.stock, 10);
});

test("PATCH /api/products/:id/stock rechaza ajuste cero", async () => {
  const response = await request(app)
    .patch(`/api/products/${product._id}/stock`)
    .send({ adjustment: 0 });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");
});

// ============================================
// DELETE /api/products/:id
// ============================================

test("DELETE /api/products/:id elimina un producto libre", async () => {
  const response = await request(app)
    .delete(`/api/products/${product._id}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.message,
    "Producto eliminado correctamente"
  );

  const stored = await getStoredProduct(product._id);

  assert.equal(stored, null);
});

test("DELETE /api/products/:id devuelve 404 si no existe", async () => {
  const missingId = new mongoose.Types.ObjectId();

  const response = await request(app)
    .delete(`/api/products/${missingId}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.code, "PRODUCT_NOT_FOUND");
});

// ============================================
// RUTAS INEXISTENTES
// ============================================

test("Una ruta inexistente devuelve ROUTE_NOT_FOUND", async () => {
  const response = await request(app)
    .get("/api/products/ruta/no/existente");

  assert.equal(response.status, 404);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.code, "ROUTE_NOT_FOUND");
});
