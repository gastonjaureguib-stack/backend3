
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
import logger from "../config/logger.config.js";

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
    logger.warning("Cantidad inválida solicitada para mocks");

    throw new AppError("INVALID_MOCK_QUANTITY");
  }

  const parsedQuantity = Number(quantity);

  if (
    !Number.isSafeInteger(parsedQuantity) ||
    parsedQuantity <= 0
  ) {
    logger.warning("Cantidad inválida solicitada para mocks");

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

  logger.debug(`Generando ${qty} usuarios simulados`);

  const users = generateMockUsers(qty);

  logger.info(`${users.length} usuarios simulados generados`);

  return users;
};

// =========================================
// MOCKS DE REPARTIDORES
// =========================================

export const getMockDrivers = (quantity) => {
  const qty = parseQuantity(quantity);

  logger.debug(`Generando ${qty} repartidores simulados`);

  const drivers = generateMockDrivers(qty);

  logger.info(`${drivers.length} repartidores simulados generados`);

  return drivers;
};

// =========================================
// MOCKS DE PRODUCTOS
// =========================================

export const getMockProducts = (quantity) => {
  const qty = parseQuantity(quantity);

  logger.debug(`Generando ${qty} productos simulados`);

  const products = generateMockProducts(qty);

  logger.info(`${products.length} productos simulados generados`);

  return products;
};

// =========================================
// MOCKS DE PEDIDOS
// =========================================

export const getMockOrders = (quantity) => {
  const qty = parseQuantity(quantity);

  logger.debug(`Iniciando generación de ${qty} pedidos simulados`);

  const users = generateMockUsers(qty);
  const products = generateMockProducts(qty);

  const orders = generateStandaloneMockOrders(
    qty,
    users,
    products
  );

  logger.info(`${orders.length} pedidos simulados generados`);

  return orders;
};

// =========================================
// MOCKS DE ENTREGAS
// =========================================

export const getMockDeliveries = (quantity) => {
  const qty = parseQuantity(quantity);

  logger.debug(`Iniciando generación de ${qty} entregas simuladas`);

  const users = generateMockUsers(qty);
  const products = generateMockProducts(qty);

  const orders = generateStandaloneMockOrders(
    qty,
    users,
    products
  );

  const drivers = generateMockDrivers(qty);

  const deliveries = generateStandaloneMockDeliveries(
    qty,
    orders,
    drivers
  );

  logger.info(`${deliveries.length} entregas simuladas generadas`);

  return deliveries;
};

// =========================================
// GUARDAR MOCKS EN MONGODB
// =========================================

export const seedMockData = async (quantity) => {
  // Validamos antes de comenzar cualquier operación.
  const qty = parseQuantity(quantity);

  logger.info(`Iniciando seed de ShipNow con cantidad ${qty}`);

  try {
    // 1. Generamos clientes y repartidores.
    logger.debug("Generando usuarios y repartidores");

    const mockUsers = generateMockUsers(qty);
    const mockDrivers = generateMockDrivers(qty);

    // 2. Hasheamos sus contraseñas.
    const usersWithHashedPasswords =
      await hashPasswords(mockUsers);

    const driversWithHashedPasswords =
      await hashPasswords(mockDrivers);

    logger.debug("Contraseñas procesadas correctamente");

    // 3. Guardamos usuarios y repartidores.
    const createdUsers = await userRepository.createMany(
      usersWithHashedPasswords
    );

    const createdDrivers = await userRepository.createMany(
      driversWithHashedPasswords
    );

    logger.debug(
      `${createdUsers.length} usuarios y ${createdDrivers.length} repartidores persistidos`
    );

    // 4. Generamos y guardamos plantas.
    const mockProducts = generateMockProducts(qty);

    const createdProducts = await productRepository.createMany(
      mockProducts
    );

    logger.debug(
      `${createdProducts.length} productos persistidos`
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

    logger.info(
      `${createdOrders.length} pedidos creados correctamente`
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

    logger.info(
      `${createdDeliveries.length} entregas creadas correctamente`
    );

    const result = {
      users: createdUsers.length,
      drivers: createdDrivers.length,
      products: createdProducts.length,
      orders: createdOrders.length,
      deliveries: createdDeliveries.length,
    };

    logger.info("Seed de ShipNow completado correctamente");

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      // El middleware global registra el error de dominio.
      throw error;
    }

    // Registramos el error técnico mediante Winston.
    logger.error(
      `Error al generar y guardar mocks: ${error.message}`,
      { stack: error.stack }
    );

    // Mantenemos el error controlado de la entrega 3.
    throw new AppError("MOCK_SEED_FAILED");
  }
};
