
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";

import productService from "../src/services/product.service.js";
import orderService from "../src/services/order.service.js";

import User from "../src/models/user.model.js";
import Product from "../src/models/product.model.js";
import Order from "../src/models/order.model.js";
import Delivery from "../src/models/delivery.model.js";

import { PRODUCT_STATUS } from "../src/constants/index.js";

const TEST_DATABASE = "shipnow_test";

const TEST_MONGODB_URI =
  `mongodb://127.0.0.1:27017/${TEST_DATABASE}?replicaSet=rs0`;

let user;
let product;

function createProductData(overrides = {}) {
  return {
    name: "Producto de prueba",
    description: "Producto para pruebas de integración",
    category: "Testing",
    price: 100,
    stock: 10,
    ...overrides,
  };
}

async function getStoredProduct(id) {
  return Product.findById(id).lean();
}

before(async () => {
  assert.equal(
    new URL(TEST_MONGODB_URI).pathname,
    `/${TEST_DATABASE}`,
    "La conexión debe utilizar exclusivamente la base de pruebas."
  );

  await mongoose.connect(TEST_MONGODB_URI);

  assert.equal(
    mongoose.connection.name,
    TEST_DATABASE,
    "La base de datos conectada no es la esperada."
  );

  await Promise.all([
    User.init(),
    Product.init(),
    Order.init(),
    Delivery.init(),
  ]);
});

beforeEach(async () => {
  // Limpieza exclusiva de la base de pruebas.
  await Delivery.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});

  user = await User.create({
    firstName: "Usuario",
    lastName: "Testing",
    email: `shipnow-product-${randomUUID()}@example.com`,
    password: "password-de-prueba",
  });

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
// CONSULTAS
// ============================================

test("Obtiene todos los productos", async () => {
  const products = await productService.getAllProducts();

  assert.equal(products.length, 1);
  assert.equal(
    String(products[0]._id),
    String(product._id)
  );
});

test("Filtra productos por categoría", async () => {
  await productService.createProduct(
    createProductData({
      name: "Producto de jardinería",
      category: "Jardinería",
    })
  );

  const products = await productService.getAllProducts({
    category: "Jardinería",
  });

  assert.equal(products.length, 1);
  assert.equal(products[0].category, "Jardinería");
});

test("Filtra productos por estado", async () => {
  await productService.createProduct(
    createProductData({
      name: "Producto agotado",
      stock: 0,
    })
  );

  const products = await productService.getAllProducts({
    status: PRODUCT_STATUS.OUT_OF_STOCK,
  });

  assert.equal(products.length, 1);
  assert.equal(products[0].stock, 0);
});

test("Rechaza un estado de producto inválido", async () => {
  await assert.rejects(
    () =>
      productService.getAllProducts({
        status: "invalid",
      }),
    {
      code: "INVALID_PRODUCT_STATUS",
    }
  );
});

test("Obtiene un producto por ID", async () => {
  const result = await productService.getProductById(
    product._id
  );

  assert.equal(
    String(result._id),
    String(product._id)
  );

  assert.equal(result.name, product.name);
});

test("Rechaza consultar un producto inexistente", async () => {
  await assert.rejects(
    () =>
      productService.getProductById(
        new mongoose.Types.ObjectId()
      ),
    {
      code: "PRODUCT_NOT_FOUND",
    }
  );
});

// ============================================
// CREACIÓN
// ============================================

test("Crea un producto disponible", async () => {
  const created = await productService.createProduct(
    createProductData({
      name: "Nuevo producto",
      stock: 5,
    })
  );

  assert.ok(created._id);
  assert.equal(created.stock, 5);
  assert.equal(
    created.status,
    PRODUCT_STATUS.AVAILABLE
  );
});

test("Crea un producto agotado cuando el stock es cero", async () => {
  const created = await productService.createProduct(
    createProductData({
      name: "Producto sin existencias",
      stock: 0,
    })
  );

  assert.equal(created.stock, 0);

  assert.equal(
    created.status,
    PRODUCT_STATUS.OUT_OF_STOCK
  );
});

test("Rechaza crear un producto con stock negativo", async () => {
  await assert.rejects(
    () =>
      productService.createProduct(
        createProductData({
          stock: -1,
        })
      ),
    {
      code: "VALIDATION_ERROR",
    }
  );
});

test("Rechaza crear un producto con stock decimal", async () => {
  await assert.rejects(
    () =>
      productService.createProduct(
        createProductData({
          stock: 2.5,
        })
      ),
    {
      code: "VALIDATION_ERROR",
    }
  );
});

// ============================================
// ACTUALIZACIÓN
// ============================================

test("Actualiza los datos generales de un producto", async () => {
  const updated = await productService.updateProduct(
    product._id,
    {
      name: "Producto actualizado",
      price: 250,
    }
  );

  assert.equal(
    updated.name,
    "Producto actualizado"
  );

  assert.equal(updated.price, 250);
  assert.equal(updated.stock, 10);
});

test("Impide modificar directamente el stock", async () => {
  await assert.rejects(
    () =>
      productService.updateProduct(
        product._id,
        {
          stock: 50,
        }
      ),
    {
      code: "VALIDATION_ERROR",
    }
  );

  const stored = await getStoredProduct(product._id);

  assert.equal(stored.stock, 10);
});

test("Rechaza actualizar un producto inexistente", async () => {
  await assert.rejects(
    () =>
      productService.updateProduct(
        new mongoose.Types.ObjectId(),
        {
          name: "Otro nombre",
        }
      ),
    {
      code: "PRODUCT_NOT_FOUND",
    }
  );
});

// ============================================
// AJUSTES DE INVENTARIO
// ============================================

test("Incrementa correctamente el stock", async () => {
  const updated = await productService.adjustProductStock(
    product._id,
    5
  );

  assert.equal(updated.stock, 15);

  const stored = await getStoredProduct(product._id);

  assert.equal(stored.stock, 15);
});

test("Descuenta stock correctamente", async () => {
  const updated = await productService.adjustProductStock(
    product._id,
    -4
  );

  assert.equal(updated.stock, 6);

  assert.equal(
    updated.status,
    PRODUCT_STATUS.AVAILABLE
  );
});

test("Marca como agotado cuando el stock llega a cero", async () => {
  const updated = await productService.adjustProductStock(
    product._id,
    -10
  );

  assert.equal(updated.stock, 0);

  assert.equal(
    updated.status,
    PRODUCT_STATUS.OUT_OF_STOCK
  );

  const stored = await getStoredProduct(product._id);

  assert.equal(stored.stock, 0);

  assert.equal(
    stored.status,
    PRODUCT_STATUS.OUT_OF_STOCK
  );
});

test("Impide descontar más stock del disponible", async () => {
  await assert.rejects(
    () =>
      productService.adjustProductStock(
        product._id,
        -20
      ),
    {
      code: "PRODUCT_INSUFFICIENT_STOCK",
    }
  );

  const stored = await getStoredProduct(product._id);

  assert.equal(
    stored.stock,
    10,
    "El stock debe mantenerse sin cambios."
  );
});

test("Rechaza un ajuste igual a cero", async () => {
  await assert.rejects(
    () =>
      productService.adjustProductStock(
        product._id,
        0
      ),
    {
      code: "VALIDATION_ERROR",
    }
  );
});

// ============================================
// ELIMINACIÓN
// ============================================

test("Elimina un producto sin pedidos asociados", async () => {
  await productService.deleteProduct(product._id);

  const stored = await getStoredProduct(product._id);

  assert.equal(stored, null);
});

test("Impide eliminar un producto asociado a pedidos", async () => {
  await orderService.createOrder({
    user: user._id,
    products: [
      {
        product: product._id,
        quantity: 2,
      },
    ],
  });

  await assert.rejects(
    () =>
      productService.deleteProduct(
        product._id
      ),
    {
      code: "PRODUCT_IN_USE",
    }
  );

  const stored = await getStoredProduct(product._id);

  assert.ok(
    stored,
    "El producto debe conservarse."
  );

  assert.equal(
    await Order.countDocuments(),
    1,
    "El pedido asociado debe conservarse."
  );
});
