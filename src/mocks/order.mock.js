
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";

import {
  ORDER_STATUS,
  ORDER_PRIORITY,
} from "../constants/index.js";

import AppError from "../utils/AppError.js";

// =========================================
// GENERAR UN PEDIDO
// =========================================

export const generateMockOrder = (users = [], products = []) => {
  if (users.length === 0 || products.length === 0) {
    throw new AppError("MOCK_DATA_REQUIRED");
  }

  const user = faker.helpers.arrayElement(users);

  const availableProducts = products.filter(
    (product) => product.stock > 0
  );

  if (availableProducts.length === 0) {
    throw new AppError("MOCK_PRODUCT_OUT_OF_STOCK");
  }

  const product = faker.helpers.arrayElement(availableProducts);

  const quantity = faker.number.int({
    min: 1,
    max: Math.min(product.stock, 3),
  });

  return {
    user: user._id,
    products: [
      {
        product: product._id,
        quantity,
      },
    ],
    status: faker.helpers.arrayElement(
      Object.values(ORDER_STATUS)
    ),
    priority: faker.helpers.arrayElement(
      Object.values(ORDER_PRIORITY)
    ),
    total: product.price * quantity,
  };
};

// =========================================
// GENERAR VARIOS PEDIDOS
// =========================================

export const generateMockOrders = (
  quantity = 10,
  users = [],
  products = []
) => {
  return Array.from({ length: quantity }, () =>
    generateMockOrder(users, products)
  );
};

// =========================================
// GENERAR PEDIDOS SIN PERSISTENCIA
// =========================================

export const generateStandaloneMockOrders = (
  quantity = 10,
  users = [],
  products = []
) => {
  const usersWithIds = users.map((user) => ({
    ...user,
    _id: new mongoose.Types.ObjectId(),
  }));

  const productsWithIds = products.map((product) => ({
    ...product,
    _id: new mongoose.Types.ObjectId(),
  }));

  return generateMockOrders(
    quantity,
    usersWithIds,
    productsWithIds
  );
};
