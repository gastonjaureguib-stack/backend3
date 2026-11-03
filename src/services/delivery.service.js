
import mongoose from "mongoose";

import deliveryRepository from "../repositories/delivery.repository.js";
import orderRepository from "../repositories/order.repository.js";
import userRepository from "../repositories/user.repository.js";

import {
  DELIVERY_STATUS,
  ORDER_STATUS,
  USER_ROLES,
} from "../constants/index.js";

import AppError from "../utils/AppError.js";

const ALLOWED_TRANSITIONS = Object.freeze({
  [DELIVERY_STATUS.PENDING]: [
    DELIVERY_STATUS.ASSIGNED,
    DELIVERY_STATUS.CANCELLED,
  ],
  [DELIVERY_STATUS.ASSIGNED]: [
    DELIVERY_STATUS.IN_TRANSIT,
    DELIVERY_STATUS.CANCELLED,
  ],
  [DELIVERY_STATUS.IN_TRANSIT]: [
    DELIVERY_STATUS.DELIVERED,
  ],
  [DELIVERY_STATUS.DELIVERED]: [],
  [DELIVERY_STATUS.CANCELLED]: [],
});

const ELIGIBLE_ORDER_STATUSES = [
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
];

class DeliveryService {
  async validateDriver(driverId, session) {
    if (!mongoose.isValidObjectId(driverId)) {
      throw new AppError("INVALID_OBJECT_ID");
    }

    const driver = await userRepository.getById(
      driverId,
      { session }
    );

    if (!driver) {
      throw new AppError("DELIVERY_DRIVER_NOT_FOUND");
    }

    if (driver.role !== USER_ROLES.DRIVER) {
      throw new AppError("DELIVERY_INVALID_DRIVER");
    }

    return driver;
  }

  async getAllDeliveries() {
    return deliveryRepository.getAll();
  }

  async getDeliveryById(id) {
    const delivery = await deliveryRepository.getById(id);

    if (!delivery) {
      throw new AppError("DELIVERY_NOT_FOUND");
    }

    return delivery;
  }

  async getDeliveryByOrderId(orderId) {
    const delivery = await deliveryRepository.getByOrderId(
      orderId
    );

    if (!delivery) {
      throw new AppError("DELIVERY_NOT_FOUND");
    }

    return delivery;
  }

  async createDelivery(deliveryData) {
    if (
      !deliveryData ||
      typeof deliveryData !== "object" ||
      Array.isArray(deliveryData)
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    const {
      order: orderId,
      driver: driverId,
      deliveryAddress,
    } = deliveryData;

    if (!mongoose.isValidObjectId(orderId)) {
      throw new AppError("INVALID_OBJECT_ID");
    }

    if (
      typeof deliveryAddress !== "string" ||
      deliveryAddress.trim().length < 5 ||
      deliveryAddress.trim().length > 250
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    try {
      return await mongoose.connection.transaction(
        async (session) => {
          const order = await orderRepository.getById(
            orderId,
            { session }
          );

          if (!order) {
            throw new AppError("ORDER_NOT_FOUND");
          }

          if (
            !ELIGIBLE_ORDER_STATUSES.includes(order.status)
          ) {
            throw new AppError(
              "DELIVERY_ORDER_NOT_ELIGIBLE"
            );
          }

          const existingDelivery =
            await deliveryRepository.getByOrderId(
              orderId,
              { session }
            );

          if (existingDelivery) {
            throw new AppError(
              "DELIVERY_ALREADY_EXISTS"
            );
          }

          if (driverId != null) {
            await this.validateDriver(driverId, session);
          }

          // Escritura condicionada sobre el pedido.
          // Coordina esta transacción con operaciones
          // concurrentes que cambian su estado.
          const lockedOrder =
            await orderRepository.touchIfStatus(
              orderId,
              order.status,
              { session }
            );

          if (!lockedOrder) {
            throw new AppError(
              "DELIVERY_ORDER_NOT_ELIGIBLE"
            );
          }

          return deliveryRepository.create(
            {
              order: orderId,
              driver: driverId ?? null,
              deliveryAddress: deliveryAddress.trim(),
              status: DELIVERY_STATUS.PENDING,
            },
            { session }
          );
        }
      );
    } catch (error) {
      if (
        error.code === 11000 &&
        (error.keyPattern?.order ||
          error.keyValue?.order)
      ) {
        throw new AppError("DELIVERY_ALREADY_EXISTS");
      }

      throw error;
    }
  }

  async updateDelivery(id, deliveryData) {
    if (
      !deliveryData ||
      typeof deliveryData !== "object" ||
      Array.isArray(deliveryData)
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    const allowedFields = [
      "driver",
      "status",
      "deliveryAddress",
    ];

    const fields = Object.keys(deliveryData);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    return mongoose.connection.transaction(
      async (session) => {
        const delivery = await deliveryRepository.getById(
          id,
          { session }
        );

        if (!delivery) {
          throw new AppError("DELIVERY_NOT_FOUND");
        }

        if (
          [
            DELIVERY_STATUS.DELIVERED,
            DELIVERY_STATUS.CANCELLED,
          ].includes(delivery.status)
        ) {
          throw new AppError(
            "DELIVERY_INVALID_STATUS_TRANSITION"
          );
        }

        const orderId =
          delivery.order?._id ?? delivery.order;

        const order = await orderRepository.getById(
          orderId,
          { session }
        );

        if (!order) {
          throw new AppError("ORDER_NOT_FOUND");
        }

        if (
          !ELIGIBLE_ORDER_STATUSES.includes(order.status)
        ) {
          throw new AppError(
            "DELIVERY_ORDER_NOT_ELIGIBLE"
          );
        }

        const changes = {};

        if (deliveryData.driver !== undefined) {
          if (
            deliveryData.driver === null &&
            delivery.status !== DELIVERY_STATUS.PENDING
          ) {
            throw new AppError("DELIVERY_INVALID_DRIVER");
          }

          if (deliveryData.driver !== null) {
            await this.validateDriver(
              deliveryData.driver,
              session
            );
          }

          changes.driver = deliveryData.driver;
        }

        if (deliveryData.deliveryAddress !== undefined) {
          const address = deliveryData.deliveryAddress;

          if (
            typeof address !== "string" ||
            address.trim().length < 5 ||
            address.trim().length > 250
          ) {
            throw new AppError("VALIDATION_ERROR");
          }

          if (
            delivery.status === DELIVERY_STATUS.IN_TRANSIT
          ) {
            throw new AppError(
              "DELIVERY_INVALID_STATUS_TRANSITION"
            );
          }

          changes.deliveryAddress = address.trim();
        }

        if (deliveryData.status !== undefined) {
          const allowedStatuses =
            ALLOWED_TRANSITIONS[delivery.status] ?? [];

          if (
            !allowedStatuses.includes(deliveryData.status)
          ) {
            throw new AppError(
              "DELIVERY_INVALID_STATUS_TRANSITION"
            );
          }

          changes.status = deliveryData.status;
        }

        const nextStatus =
          changes.status ?? delivery.status;

        const nextDriver =
          changes.driver !== undefined
            ? changes.driver
            : delivery.driver?._id ?? delivery.driver;

        if (
          [
            DELIVERY_STATUS.ASSIGNED,
            DELIVERY_STATUS.IN_TRANSIT,
            DELIVERY_STATUS.DELIVERED,
          ].includes(nextStatus) &&
          !nextDriver
        ) {
          throw new AppError("DELIVERY_INVALID_DRIVER");
        }

        if (
          nextStatus === DELIVERY_STATUS.IN_TRANSIT &&
          order.status !== ORDER_STATUS.SHIPPED
        ) {
          throw new AppError(
            "DELIVERY_ORDER_NOT_ELIGIBLE"
          );
        }

        if (
          nextStatus === DELIVERY_STATUS.DELIVERED &&
          order.status !== ORDER_STATUS.SHIPPED
        ) {
          throw new AppError(
            "DELIVERY_ORDER_NOT_ELIGIBLE"
          );
        }

        if (
          nextStatus === DELIVERY_STATUS.DELIVERED
        ) {
          const updatedOrder =
            await orderRepository.updateIfStatus(
              orderId,
              ORDER_STATUS.SHIPPED,
              { status: ORDER_STATUS.DELIVERED },
              { session }
            );

          if (!updatedOrder) {
            throw new AppError(
              "ORDER_DELIVERY_CONFLICT"
            );
          }
        }

        const updatedDelivery =
          await deliveryRepository.updateIfStatus(
            id,
            delivery.status,
            changes,
            { session }
          );

        if (!updatedDelivery) {
          throw new AppError(
            "DELIVERY_INVALID_STATUS_TRANSITION"
          );
        }

        return updatedDelivery;
      }
    );
  }

  async cancelDelivery(id) {
    return this.updateDelivery(id, {
      status: DELIVERY_STATUS.CANCELLED,
    });
  }

  async deleteDelivery(id) {
    const delivery = await deliveryRepository.getById(id);

    if (!delivery) {
      throw new AppError("DELIVERY_NOT_FOUND");
    }

    throw new AppError("DELIVERY_CANNOT_BE_DELETED");
  }
}

const deliveryService = new DeliveryService();

export default deliveryService;
