
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

import AppError from "../utils/AppError.js";

// =========================================
// VALIDAR CANTIDAD DE MOCKS
// =========================================

const parseQuantity = (quantity, defaultValue = 10) => {
  if (quantity === undefined) {
    return defaultValue;
  }

  if (
    typeof quantity === "boolean" ||
    quantity === null ||
    (typeof quantity === "string" && quantity.trim() === "")
  ) {
    throw new AppError("INVALID_MOCK_QUANTITY");
  }

  const parsedQuantity = Number(quantity);

  if (
    !Number.isSafeInteger(parsedQuantity) ||
    parsedQuantity <= 0
  ) {
    throw new AppError("INVALID_MOCK_QUANTITY");
  }

  return parsedQuantity;
};

// =========================================
// HASHEAR CONTRASEÑAS
// =========================================

const hashPasswords = async (users) => {
  return Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    }))
  );
};

// =========================================
// MOCKS DE USUARIOS
// =========================================

export const getMockUsers = (quantity) => {
  const qty = parseQuantity(quantity);

  return generateMockUsers(qty);
};

// =========================================
// MOCKS DE REPARTIDORES
// =========================================

export const getMockDrivers = (quantity) => {
  const qty = parseQuantity(quantity);

  return generateMockDrivers(qty);
};

// =========================================
// MOCKS DE PRODUCTOS
// =========================================

export const getMockProducts = (quantity) => {
  const qty = parseQuantity(quantity);

  return generateMockProducts(qty);
};

// =========================================
// MOCKS DE PEDIDOS
// =========================================

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

// =========================================
// MOCKS DE ENTREGAS
// =========================================

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

// =========================================
// GUARDAR MOCKS EN MONGODB
// =========================================

export const seedMockData = async (quantity) => {
  // Validamos antes de comenzar cualquier operación.
  const qty = parseQuantity(quantity);

  try {
    // 1. Generamos clientes y repartidores.
    const mockUsers = generateMockUsers(qty);
    const mockDrivers = generateMockDrivers(qty);

    // 2. Hasheamos sus contraseñas.
    const usersWithHashedPasswords =
      await hashPasswords(mockUsers);

    const driversWithHashedPasswords =
      await hashPasswords(mockDrivers);

    // 3. Guardamos usuarios y repartidores.
    const createdUsers = await userRepository.createMany(
      usersWithHashedPasswords
    );

    const createdDrivers = await userRepository.createMany(
      driversWithHashedPasswords
    );

    // 4. Generamos y guardamos plantas.
    const mockProducts = generateMockProducts(qty);

    const createdProducts = await productRepository.createMany(
      mockProducts
    );

    // 5. Generamos y guardamos pedidos.
    const mockOrders = generateMockOrders(
      qty,
      createdUsers,
      createdProducts
    );

    const createdOrders = await orderRepository.createMany(
      mockOrders
    );

    // 6. Generamos y guardamos entregas.
    const mockDeliveries = generateMockDeliveries(
      qty,
      createdOrders,
      createdDrivers
    );

    const createdDeliveries =
      await deliveryRepository.createMany(
        mockDeliveries
      );

    return {
      users: createdUsers.length,
      drivers: createdDrivers.length,
      products: createdProducts.length,
      orders: createdOrders.length,
      deliveries: createdDeliveries.length,
    };
  } catch (error) {
    // Conservamos los errores de dominio.
    if (error instanceof AppError) {
      throw error;
    }

    // Registramos el error técnico para depuración.
    console.error("Error al generar y guardar mocks:", error);

    // Enviamos un error controlado al middleware global.
    throw new AppError("MOCK_SEED_FAILED");
  }
};
