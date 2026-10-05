import {
  getMockUsers,
  getMockDrivers,
  getMockProducts,
  getMockOrders,
  getMockDeliveries,
  seedMockData,
} from "../services/mock.service.js";

import { RESPONSE_STATUS } from "../constants/index.js";

export const getUsersMock = (req, res, next) => {
  try {
    const users = getMockUsers(req.query.qty);

    res.status(200).json({
      status: RESPONSE_STATUS.SUCCESS,
      quantity: users.length,
      payload: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getDriversMock = (req, res, next) => {
  try {
    const drivers = getMockDrivers(req.query.qty);

    res.status(200).json({
      status: RESPONSE_STATUS.SUCCESS,
      quantity: drivers.length,
      payload: drivers,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsMock = (req, res, next) => {
  try {
    const products = getMockProducts(req.query.qty);

    res.status(200).json({
      status: RESPONSE_STATUS.SUCCESS,
      quantity: products.length,
      payload: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersMock = (req, res, next) => {
  try {
    const orders = getMockOrders(req.query.qty);

    res.status(200).json({
      status: RESPONSE_STATUS.SUCCESS,
      quantity: orders.length,
      payload: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveriesMock = (req, res, next) => {
  try {
    const deliveries = getMockDeliveries(req.query.qty);

    res.status(200).json({
      status: RESPONSE_STATUS.SUCCESS,
      quantity: deliveries.length,
      payload: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

export const seedMocks = async (req, res, next) => {
  try {
    const result = await seedMockData(req.query.qty);

    res.status(201).json({
      status: RESPONSE_STATUS.SUCCESS,
      message: "Datos de prueba insertados correctamente",
      payload: result,
    });
  } catch (error) {
    next(error);
  }
};