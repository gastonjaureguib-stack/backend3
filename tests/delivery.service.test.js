
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";

import deliveryService from "../src/services/delivery.service.js";
import orderService from "../src/services/order.service.js";

import User from "../src/models/user.model.js";
import Product from "../src/models/product.model.js";
import Order from "../src/models/order.model.js";
import Delivery from "../src/models/delivery.model.js";

import {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  DELIVERY_STATUS,
} from "../src/constants/index.js";

const TEST_DATABASE = "shipnow_test";

const TEST_MONGODB_URI =
  `mongodb://127.0.0.1:27017/${TEST_DATABASE}?replicaSet=rs0`;

let user;
let driver;
let product;

function createUserData(role = USER_ROLES.USER) {
  return {
    firstName: "Usuario",
    lastName: "Testing",
    email: `delivery-test-${randomUUID()}@example.com`,
    password: "password-de-prueba",
    role,
  };
}

function createProductData() {
  return {
    name: "Producto de prueba",
    description: "Producto para pruebas de entregas",
    category: "Testing",
    price: 100,
    stock: 20,
    status: PRODUCT_STATUS.AVAILABLE,
  };
}

async function createOrder(status = ORDER_STATUS.PROCESSING) {
  const order = await orderService.createOrder({
    user: user._id,
    products: [
      {
        product: product._id,
        quantity: 2,
      },
    ],
  });

  if (status === ORDER_STATUS.PROCESSING) {
    await orderService.updateOrder(order._id, {
      status: ORDER_STATUS.PROCESSING,
    });
  }

  if (status === ORDER_STATUS.SHIPPED) {
    await orderService.updateOrder(order._id, {
      status: ORDER_STATUS.PROCESSING,
    });

    await orderService.updateOrder(order._id, {
      status: ORDER_STATUS.SHIPPED,
    });
  }

  return order;
}

async function createDelivery(
  orderId,
  driverId = driver._id
) {
  return deliveryService.createDelivery({
    order: orderId,
    driver: driverId,
    deliveryAddress: "Av. Principal 1234",
  });
}

async function createAssignedDelivery() {
  const order = await createOrder();
  const delivery = await createDelivery(order._id);

  await deliveryService.updateDelivery(delivery._id, {
    status: DELIVERY_STATUS.ASSIGNED,
  });

  return { order, delivery };
}

async function createInTransitDelivery() {
  const order = await createOrder(ORDER_STATUS.SHIPPED);
  const delivery = await createDelivery(order._id);

  await deliveryService.updateDelivery(delivery._id, {
    status: DELIVERY_STATUS.ASSIGNED,
  });

  await deliveryService.updateDelivery(delivery._id, {
    status: DELIVERY_STATUS.IN_TRANSIT,
  });

  return { order, delivery };
}

before(async () => {
  assert.equal(
    new URL(TEST_MONGODB_URI).pathname,
    `/${TEST_DATABASE}`,
    "Las pruebas deben utilizar shipnow_test."
  );

  await mongoose.connect(TEST_MONGODB_URI);

  assert.equal(
    mongoose.connection.name,
    TEST_DATABASE
  );

  await Promise.all([
    User.init(),
    Product.init(),
    Order.init(),
    Delivery.init(),
  ]);
});

beforeEach(async () => {
  await Delivery.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});

  user = await User.create(
    createUserData(USER_ROLES.USER)
  );

  driver = await User.create(
    createUserData(USER_ROLES.DRIVER)
  );

  product = await Product.create(
    createProductData()
  );
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
// CREACIÓN DE ENTREGAS
// ============================================

test("Crea una entrega para un pedido elegible", async () => {
  const order = await createOrder();

  const delivery = await createDelivery(order._id);

  assert.ok(delivery._id);
  assert.equal(
    delivery.status,
    DELIVERY_STATUS.PENDING
  );

  assert.equal(
    String(delivery.order),
    String(order._id)
  );

  assert.equal(
    String(delivery.driver),
    String(driver._id)
  );
});

test("Rechaza entregas duplicadas", async () => {
  const order = await createOrder();

  await createDelivery(order._id);

  await assert.rejects(
    () => createDelivery(order._id),
    {
      code: "DELIVERY_ALREADY_EXISTS",
    }
  );

  assert.equal(
    await Delivery.countDocuments(),
    1
  );
});

test("Rechaza crear una entrega para un pedido pendiente", async () => {
  const order = await createOrder(
    ORDER_STATUS.PENDING
  );

  await assert.rejects(
    () => createDelivery(order._id),
    {
      code: "DELIVERY_ORDER_NOT_ELIGIBLE",
    }
  );

  assert.equal(
    await Delivery.countDocuments(),
    0
  );
});

test("Rechaza crear una entrega para un pedido inexistente", async () => {
  await assert.rejects(
    () => createDelivery(new mongoose.Types.ObjectId()),
    {
      code: "ORDER_NOT_FOUND",
    }
  );
});

// ============================================
// VALIDACIÓN DE REPARTIDORES
// ============================================

test("Rechaza asignar un usuario que no es repartidor", async () => {
  const order = await createOrder();

  await assert.rejects(
    () => createDelivery(order._id, user._id),
    {
      code: "DELIVERY_INVALID_DRIVER",
    }
  );

  assert.equal(
    await Delivery.countDocuments(),
    0
  );
});

test("Rechaza un repartidor inexistente", async () => {
  const order = await createOrder();

  await assert.rejects(
    () =>
      createDelivery(
        order._id,
        new mongoose.Types.ObjectId()
      ),
    {
      code: "DELIVERY_DRIVER_NOT_FOUND",
    }
  );
});

test("Permite crear una entrega sin repartidor", async () => {
  const order = await createOrder();

  const delivery = await createDelivery(
    order._id,
    null
  );

  assert.equal(delivery.driver, null);
  assert.equal(
    delivery.status,
    DELIVERY_STATUS.PENDING
  );
});

test("No permite asignar una entrega sin repartidor", async () => {
  const order = await createOrder();

  const delivery = await createDelivery(
    order._id,
    null
  );

  await assert.rejects(
    () =>
      deliveryService.updateDelivery(delivery._id, {
        status: DELIVERY_STATUS.ASSIGNED,
      }),
    {
      code: "DELIVERY_INVALID_DRIVER",
    }
  );
});

// ============================================
// TRANSICIONES DE ESTADO
// ============================================

test("Permite pasar una entrega de pending a assigned", async () => {
  const order = await createOrder();

  const delivery = await createDelivery(order._id);

  const updated = await deliveryService.updateDelivery(
    delivery._id,
    {
      status: DELIVERY_STATUS.ASSIGNED,
    }
  );

  assert.equal(
    updated.status,
    DELIVERY_STATUS.ASSIGNED
  );
});

test("Rechaza pasar directamente de pending a delivered", async () => {
  const order = await createOrder(
    ORDER_STATUS.SHIPPED
  );

  const delivery = await createDelivery(order._id);

  await assert.rejects(
    () =>
      deliveryService.updateDelivery(delivery._id, {
        status: DELIVERY_STATUS.DELIVERED,
      }),
    {
      code: "DELIVERY_INVALID_STATUS_TRANSITION",
    }
  );
});

test("Permite pasar de assigned a in_transit", async () => {
  const { delivery } = await createInTransitDelivery();

  const stored = await Delivery.findById(
    delivery._id
  );

  assert.equal(
    stored.status,
    DELIVERY_STATUS.IN_TRANSIT
  );
});

test("Impide iniciar tránsito si el pedido no está shipped", async () => {
  const { delivery } = await createAssignedDelivery();

  await assert.rejects(
    () =>
      deliveryService.updateDelivery(delivery._id, {
        status: DELIVERY_STATUS.IN_TRANSIT,
      }),
    {
      code: "DELIVERY_ORDER_NOT_ELIGIBLE",
    }
  );
});

// ============================================
// SINCRONIZACIÓN CON ORDERS
// ============================================

test("Completar una entrega actualiza también el pedido", async () => {
  const { order, delivery } =
    await createInTransitDelivery();

  const completed =
    await deliveryService.updateDelivery(
      delivery._id,
      {
        status: DELIVERY_STATUS.DELIVERED,
      }
    );

  const storedOrder = await Order.findById(
    order._id
  );

  assert.equal(
    completed.status,
    DELIVERY_STATUS.DELIVERED
  );

  assert.equal(
    storedOrder.status,
    ORDER_STATUS.DELIVERED
  );
});

test("Rechaza completar una entrega dos veces", async () => {
  const { delivery } =
    await createInTransitDelivery();

  await deliveryService.updateDelivery(
    delivery._id,
    {
      status: DELIVERY_STATUS.DELIVERED,
    }
  );

  await assert.rejects(
    () =>
      deliveryService.updateDelivery(delivery._id, {
        status: DELIVERY_STATUS.DELIVERED,
      }),
    {
      code: "DELIVERY_INVALID_STATUS_TRANSITION",
    }
  );
});

// ============================================
// CANCELACIÓN E HISTORIAL
// ============================================

test("Permite cancelar una entrega pendiente", async () => {
  const order = await createOrder();
  const delivery = await createDelivery(order._id);

  const cancelled =
    await deliveryService.cancelDelivery(
      delivery._id
    );

  assert.equal(
    cancelled.status,
    DELIVERY_STATUS.CANCELLED
  );
});

test("Impide cancelar una entrega en tránsito", async () => {
  const { delivery } =
    await createInTransitDelivery();

  await assert.rejects(
    () => deliveryService.cancelDelivery(delivery._id),
    {
      code: "DELIVERY_INVALID_STATUS_TRANSITION",
    }
  );
});

test("Impide eliminar una entrega existente", async () => {
  const order = await createOrder();
  const delivery = await createDelivery(order._id);

  await assert.rejects(
    () => deliveryService.deleteDelivery(delivery._id),
    {
      code: "DELIVERY_CANNOT_BE_DELETED",
    }
  );

  assert.equal(
    await Delivery.countDocuments(),
    1
  );
});

// ============================================
// CONCURRENCIA
// ============================================

test("Dos creaciones simultáneas no duplican entregas", async () => {
  const order = await createOrder();

  const results = await Promise.allSettled([
    createDelivery(order._id),
    createDelivery(order._id),
  ]);

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  );

  const rejected = results.filter(
    (result) => result.status === "rejected"
  );

  assert.equal(successful.length, 1);
  assert.equal(rejected.length, 1);

  assert.equal(
    await Delivery.countDocuments({
      order: order._id,
    }),
    1
  );
});

test("Dos finalizaciones simultáneas no generan estados inconsistentes", async () => {
  const { order, delivery } =
    await createInTransitDelivery();

  const results = await Promise.allSettled([
    deliveryService.updateDelivery(delivery._id, {
      status: DELIVERY_STATUS.DELIVERED,
    }),
    deliveryService.updateDelivery(delivery._id, {
      status: DELIVERY_STATUS.DELIVERED,
    }),
  ]);

  const successful = results.filter(
    (result) => result.status === "fulfilled"
  );

  const rejected = results.filter(
    (result) => result.status === "rejected"
  );

  assert.equal(successful.length, 1);
  assert.equal(rejected.length, 1);

  const storedOrder = await Order.findById(
    order._id
  );

  const storedDelivery = await Delivery.findById(
    delivery._id
  );

  assert.equal(
    storedOrder.status,
    ORDER_STATUS.DELIVERED
  );

  assert.equal(
    storedDelivery.status,
    DELIVERY_STATUS.DELIVERED
  );
});
