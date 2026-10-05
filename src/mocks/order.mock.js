import mongoose from "mongoose";
import { faker } from "@faker-js/faker";

import {
  ORDER_STATUS,
  ORDER_PRIORITY,
} from "../constants/index.js";

export const generateMockOrder = (users = [], products = []) => {
  if (users.length === 0 || products.length === 0) {
    throw new Error(
      "Se necesitan usuarios y productos para generar pedidos simulados."
    );
  }

  const user = faker.helpers.arrayElement(users);

  const availableProducts = products.filter(
    (product) => product.stock > 0
  );

  if (availableProducts.length === 0) {
    throw new Error(
      "Se necesita al menos un producto con stock para generar pedidos."
    );
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

export const generateMockOrders = (
  quantity = 10,
  users = [],
  products = []
) => {
  return Array.from({ length: quantity }, () =>
    generateMockOrder(users, products)
  );
};

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