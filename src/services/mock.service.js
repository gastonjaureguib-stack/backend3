import bcrypt from "bcrypt";

import {
  generateMockUsers,
  generateMockDrivers,
} from "../mocks/user.mock.js";

import { generateMockProducts } from "../mocks/product.mock.js";

import {
  generateMockOrders,
  generateStandaloneMockOrders,
} from "../mocks/order.mock.js";

import {
  generateMockDeliveries,
  generateStandaloneMockDeliveries,
} from "../mocks/delivery.mock.js";

import userRepository from "../repositories/user.repository.js";
import productRepository from "../repositories/product.repository.js";
import orderRepository from "../repositories/order.repository.js";
import deliveryRepository from "../repositories/delivery.repository.js";

const parseQuantity = (quantity, defaultValue = 10) => {
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return defaultValue;
  }

  return parsedQuantity;
};

const hashPasswords = async (users) => {
  return Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    }))
  );
};

export const getMockUsers = (quantity) => {
  const qty = parseQuantity(quantity);

  return generateMockUsers(qty);
};

export const getMockDrivers = (quantity) => {
  const qty = parseQuantity(quantity);

  return generateMockDrivers(qty);
};

export const getMockProducts = (quantity) => {
  const qty = parseQuantity(quantity);

  return generateMockProducts(qty);
};

export const getMockOrders = (quantity) => {
  const qty = parseQuantity(quantity);

  const users = generateMockUsers(qty);
  const products = generateMockProducts(qty);

  return generateStandaloneMockOrders(
    qty,
    users,
    products
  );
};

export const getMockDeliveries = (quantity) => {
  const qty = parseQuantity(quantity);

  const users = generateMockUsers(qty);
  const products = generateMockProducts(qty);

  const orders = generateStandaloneMockOrders(
    qty,
    users,
    products
  );

  const drivers = generateMockDrivers(qty);

  return generateStandaloneMockDeliveries(
    qty,
    orders,
    drivers
  );
};

export const seedMockData = async (quantity) => {
  const qty = parseQuantity(quantity);

  // 1. Generamos clientes y repartidores
  const mockUsers = generateMockUsers(qty);
  const mockDrivers = generateMockDrivers(qty);

  // 2. Hasheamos sus contraseñas
  const usersWithHashedPasswords = await hashPasswords(mockUsers);
  const driversWithHashedPasswords = await hashPasswords(mockDrivers);

  // 3. Guardamos usuarios y repartidores
  const createdUsers = await userRepository.createMany(
    usersWithHashedPasswords
  );

  const createdDrivers = await userRepository.createMany(
    driversWithHashedPasswords
  );

  // 4. Generamos y guardamos plantas
  const mockProducts = generateMockProducts(qty);

  const createdProducts = await productRepository.createMany(
    mockProducts
  );

  // 5. Generamos y guardamos pedidos
  const mockOrders = generateMockOrders(
    qty,
    createdUsers,
    createdProducts
  );

  const createdOrders = await orderRepository.createMany(
    mockOrders
  );

  // 6. Generamos y guardamos entregas
  const mockDeliveries = generateMockDeliveries(
    qty,
    createdOrders,
    createdDrivers
  );

  const createdDeliveries = await deliveryRepository.createMany(
    mockDeliveries
  );

  return {
    users: createdUsers.length,
    drivers: createdDrivers.length,
    products: createdProducts.length,
    orders: createdOrders.length,
    deliveries: createdDeliveries.length,
  };
};