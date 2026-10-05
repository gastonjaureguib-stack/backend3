import mongoose from "mongoose";
import { faker } from "@faker-js/faker";

import {
  DELIVERY_STATUS,
  USER_ROLES,
} from "../constants/index.js";

export const generateMockDelivery = (orders = [], drivers = []) => {
  if (orders.length === 0) {
    throw new Error(
      "Se necesitan pedidos para generar entregas simuladas."
    );
  }

  const validDrivers = drivers.filter(
    (driver) => driver.role === USER_ROLES.DRIVER
  );

  if (validDrivers.length === 0) {
    throw new Error(
      "Se necesita al menos un repartidor para generar entregas simuladas."
    );
  }

  const order = faker.helpers.arrayElement(orders);
  const driver = faker.helpers.arrayElement(validDrivers);

  return {
    order: order._id,
    driver: driver._id,
    status: faker.helpers.arrayElement(
      Object.values(DELIVERY_STATUS)
    ),
    deliveryAddress: faker.location.streetAddress(),
  };
};

export const generateMockDeliveries = (
  quantity = 10,
  orders = [],
  drivers = []
) => {
  if (quantity > orders.length) {
    throw new Error(
      "No se pueden generar más entregas que pedidos disponibles."
    );
  }

  const selectedOrders = faker.helpers.arrayElements(
    orders,
    quantity
  );

  return selectedOrders.map((order) =>
    generateMockDelivery([order], drivers)
  );
};

export const generateStandaloneMockDeliveries = (
  quantity = 10,
  orders = [],
  drivers = []
) => {
  const ordersWithIds = orders.map((order) => ({
    ...order,
    _id: new mongoose.Types.ObjectId(),
  }));

  const driversWithIds = drivers.map((driver) => ({
    ...driver,
    _id: new mongoose.Types.ObjectId(),
  }));

  return generateMockDeliveries(
    quantity,
    ordersWithIds,
    driversWithIds
  );
};