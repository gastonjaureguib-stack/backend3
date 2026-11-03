
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";

import orderService from "../src/services/order.service.js";
import deliveryService from "../src/services/delivery.service.js";

import User from "../src/models/user.model.js";
import Product from "../src/models/product.model.js";
import Order from "../src/models/order.model.js";
import Delivery from "../src/models/delivery.model.js";

import {
  ORDER_STATUS,
  PRODUCT_STATUS,
  DELIVERY_STATUS,
} from "../src/constants/index.js";

const TEST_DATABASE = "shipnow_test";

const TEST_MONGODB_URI =
  `mongodb://127.0.0.1:27017/${TEST_DATABASE}?replicaSet=rs0`;

const TEST_PREFIX = "shipnow-order-test";

let user;
let product;

function createProductData(overrides = {}) {
  return {
    name: "Producto de prueba",
    description: "Producto para pruebas de integración",
    category: "Testing",
    price: 100,
    stock: 10,
    status: PRODUCT_STATUS.AVAILABLE,
    ...overrides,
  };
}

async function getStock(productId) {
  const currentProduct = await Product.findById(productId);

  assert.ok(currentProduct, "El producto debe existir");

  return currentProduct.stock;
}

async function createTestOrder(quantity, productId = product._id) {
  return orderService.createOrder({
    user: user._id,
    products: [
      {
        product: productId,
        quantity,
      },
    ],
  });
}

async function advanceOrderToShipped(orderId) {
  await orderService.updateOrder(orderId, {
    status: ORDER_STATUS.PROCESSING,
  });

  return orderService.updateOrder(orderId, {
    status: ORDER_STATUS.SHIPPED,
  });
}

async function createTestDelivery(orderId) {
  return deliveryService.createDelivery({
    order: orderId,
    deliveryAddress: "Av. Principal 1234",
  });
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
  // Base exclusiva para pruebas automatizadas.
  await Delivery.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});

  user = await User.create({
    firstName: "Usuario",
    lastName: "Testing",
    email: `${TEST_PREFIX}-${randomUUID()}@example.com`,
    password: "password-de-prueba",
  });

  product = await Product.create(createProductData());
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
// CREACIÓN Y STOCK
// ============================================

test("Crea un pedido y descuenta el stock", async () => {
  const order = await createTestOrder(3);

  assert.ok(order._id);
  assert.equal(order.status, ORDER_STATUS.PENDING);
  assert.equal(order.total, 300);
  assert.equal(await getStock(product._id), 7);
});

test("Calcula correctamente el total de varios productos", async () => {
  const secondProduct = await Product.create(
    createProductData({
      name: "Segundo producto",
      price: 50,
      stock: 20,
    })
  );

  const order = await orderService.createOrder({
    user: user._id,
    products: [
      {
        product: product._id,
        quantity: 2,
      },
      {
        product: secondProduct._id,
        quantity: 4,
      },
    ],
  });

  assert.equal(order.total, 400);
  assert.equal(await getStock(product._id), 8);
  assert.equal(await getStock(secondProduct._id), 16);
});

test("Rechaza un pedido con stock insuficiente", async () => {
  await assert.rejects(
    () => createTestOrder(50),
    {
      code: "ORDER_INSUFFICIENT_STOCK",
    }
  );

  assert.equal(await getStock(product._id), 10);
  assert.equal(await Order.countDocuments(), 0);
});

test("Revierte el stock si falla otro producto", async () => {
  const secondProduct = await Product.create(
    createProductData({
      name: "Producto sin stock suficiente",
      stock: 1,
    })
  );

  await assert.rejects(
    () =>
      orderService.createOrder({
        user: user._id,
        products: [
          {
            product: product._id,
            quantity: 5,
          },
          {
            product: secondProduct._id,
            quantity: 10,
          },
        ],
      }),
    {
      code: "ORDER_INSUFFICIENT_STOCK",
    }
  );

  assert.equal(await getStock(product._id), 10);
  assert.equal(await getStock(secondProduct._id), 1);
  assert.equal(await Order.countDocuments(), 0);
});

// ============================================
// CANCELACIÓN
// ============================================

test("Cancelar un pedido devuelve el stock", async () => {
  const order = await createTestOrder(4);

  assert.equal(await getStock(product._id), 6);

  const cancelledOrder =
    await orderService.cancelOrder(order._id);

  assert.equal(
    cancelledOrder.status,
    ORDER_STATUS.CANCELLED
  );

  assert.equal(await getStock(product._id), 10);
});

test("No permite cancelar dos veces el mismo pedido", async () => {
  const order = await createTestOrder(2);

  await orderService.cancelOrder(order._id);

  await assert.rejects(
    () => orderService.cancelOrder(order._id),
    {
      code: "ORDER_ALREADY_CANCELLED",
    }
  );

  assert.equal(await getStock(product._id), 10);
});

// ============================================
// ESTADOS
// ============================================

test("Rechaza transiciones de estado inválidas", async () => {
  const order = await createTestOrder(1);

  await assert.rejects(
    () =>
      orderService.updateOrder(order._id, {
        status: ORDER_STATUS.DELIVERED,
      }),
    {
      code: "ORDER_INVALID_STATUS_TRANSITION",
    }
  );

  const storedOrder = await Order.findById(order._id);

  assert.equal(
    storedOrder.status,
    ORDER_STATUS.PENDING
  );
});

// ============================================
// CONCURRENCIA DE STOCK
// ============================================

test("Dos pedidos simultáneos no pueden vender más stock del disponible", async () => {
  await Product.findByIdAndUpdate(product._id, {
    stock: 5,
    status: PRODUCT_STATUS.AVAILABLE,
  });

  const results = await Promise.allSettled([
    createTestOrder(4),
    createTestOrder(4),
  ]);

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  );

  const rejected = results.filter(
    (result) => result.status === "rejected"
  );

  assert.equal(
    successful.length,
    1,
    "Solamente un pedido debe completarse."
  );

  assert.equal(
    rejected.length,
    1,
    "El segundo pedido debe ser rechazado."
  );

  assert.equal(
    await getStock(product._id),
    1,
    "El stock final debe ser una unidad."
  );

  assert.equal(
    await Order.countDocuments(),
    1,
    "Debe existir solamente un pedido."
  );

  assert.equal(
    successful[0].value.total,
    400
  );
});

test("Dos cancelaciones simultáneas no duplican la devolución de stock", async () => {
  const order = await createTestOrder(4);

  assert.equal(await getStock(product._id), 6);

  const results = await Promise.allSettled([
    orderService.cancelOrder(order._id),
    orderService.cancelOrder(order._id),
  ]);

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  );

  const rejected = results.filter(
    (result) => result.status === "rejected"
  );

  assert.equal(
    successful.length,
    1,
    "Solamente una cancelación debe completarse."
  );

  assert.equal(
    rejected.length,
    1,
    "La segunda cancelación debe rechazarse."
  );

  const storedOrder = await Order.findById(order._id);

  assert.equal(
    storedOrder.status,
    ORDER_STATUS.CANCELLED
  );

  assert.equal(
    await getStock(product._id),
    10,
    "El stock debe restaurarse una sola vez."
  );
});

test("Dos pedidos simultáneos pueden completarse si existe stock suficiente", async () => {
  const results = await Promise.allSettled([
    createTestOrder(3),
    createTestOrder(3),
  ]);

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  );

  const rejected = results.filter(
    (result) => result.status === "rejected"
  );

  assert.equal(
    rejected.length,
    0,
    `No debería rechazarse ningún pedido: ${
      rejected.map((result) => result.reason?.message).join("; ")
    }`
  );

  assert.equal(
    successful.length,
    2,
    "Ambos pedidos deben completarse."
  );

  assert.equal(await getStock(product._id), 4);
  assert.equal(await Order.countDocuments(), 2);
});

// ============================================
// INTEGRACIÓN ORDERS + DELIVERIES
// ============================================

test("Impide finalizar directamente un pedido con entrega asociada", async () => {
  const order = await createTestOrder(2);

  await advanceOrderToShipped(order._id);

  const delivery = await createTestDelivery(order._id);

  await assert.rejects(
    () =>
      orderService.updateOrder(order._id, {
        status: ORDER_STATUS.DELIVERED,
      }),
    {
      code: "ORDER_DELIVERY_CONFLICT",
    }
  );

  const storedOrder = await Order.findById(order._id);
  const storedDelivery = await Delivery.findById(delivery._id);

  assert.equal(storedOrder.status, ORDER_STATUS.SHIPPED);
  assert.equal(storedDelivery.status, DELIVERY_STATUS.PENDING);
});

test("Permite finalizar directamente un pedido sin entrega asociada", async () => {
  const order = await createTestOrder(2);

  await advanceOrderToShipped(order._id);

  const updatedOrder = await orderService.updateOrder(
    order._id,
    {
      status: ORDER_STATUS.DELIVERED,
    }
  );

  assert.equal(
    updatedOrder.status,
    ORDER_STATUS.DELIVERED
  );

  const storedOrder = await Order.findById(order._id);

  assert.equal(
    storedOrder.status,
    ORDER_STATUS.DELIVERED
  );

  assert.equal(
    await Delivery.countDocuments({ order: order._id }),
    0
  );
});

test("Impide cancelar un pedido que tiene una entrega asociada", async () => {
  const order = await createTestOrder(3);

  await orderService.updateOrder(order._id, {
    status: ORDER_STATUS.PROCESSING,
  });

  const delivery = await createTestDelivery(order._id);

  await assert.rejects(
    () => orderService.cancelOrder(order._id),
    {
      code: "ORDER_DELIVERY_CONFLICT",
    }
  );

  const storedOrder = await Order.findById(order._id);
  const storedDelivery = await Delivery.findById(delivery._id);

  assert.equal(storedOrder.status, ORDER_STATUS.PROCESSING);
  assert.equal(storedDelivery.status, DELIVERY_STATUS.PENDING);
  assert.equal(await getStock(product._id), 7);
});

test("Crear una entrega y cancelar el pedido simultáneamente conserva la integridad", async () => {
  const order = await createTestOrder(3);

  await orderService.updateOrder(order._id, {
    status: ORDER_STATUS.PROCESSING,
  });

  const results = await Promise.allSettled([
    createTestDelivery(order._id),
    orderService.cancelOrder(order._id),
  ]);

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  );

  assert.equal(
    successful.length,
    1,
    "Solamente una de las operaciones debe completarse."
  );

  const storedOrder = await Order.findById(order._id);
  const storedDelivery = await Delivery.findOne({
    order: order._id,
  });

  const stock = await getStock(product._id);

  if (storedDelivery) {
    assert.equal(
      storedOrder.status,
      ORDER_STATUS.PROCESSING
    );

    assert.equal(
      storedDelivery.status,
      DELIVERY_STATUS.PENDING
    );

    assert.equal(stock, 7);
  } else {
    assert.equal(
      storedOrder.status,
      ORDER_STATUS.CANCELLED
    );

    assert.equal(stock, 10);
  }
});
