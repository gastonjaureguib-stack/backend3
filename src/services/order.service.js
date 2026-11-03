
import mongoose from "mongoose";

import orderRepository from "../repositories/order.repository.js";
import productRepository from "../repositories/product.repository.js";
import userRepository from "../repositories/user.repository.js";
import deliveryRepository from "../repositories/delivery.repository.js";

import { ORDER_STATUS } from "../constants/index.js";
import AppError from "../utils/AppError.js";

const ALLOWED_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.PROCESSING]: [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.DELIVERED,
  ],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

class OrderService {
  async getAllOrders() {
    return orderRepository.getAll();
  }

  async getOrderById(id) {
    const order = await orderRepository.getById(id);

    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    return order;
  }

  async createOrder(orderData) {
    const { user, products, priority } = orderData;

    if (!Array.isArray(products) || products.length === 0) {
      throw new AppError("VALIDATION_ERROR");
    }

    const productIds = new Set();

    for (const item of products) {
      if (
        !item ||
        !mongoose.isValidObjectId(item.product) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new AppError("VALIDATION_ERROR");
      }

      const productId = String(item.product);

      if (productIds.has(productId)) {
        throw new AppError("VALIDATION_ERROR");
      }

      productIds.add(productId);
    }

    return mongoose.connection.transaction(async (session) => {
      const existingUser = await userRepository.getById(
        user,
        { session }
      );

      if (!existingUser) {
        throw new AppError("USER_NOT_FOUND");
      }

      const orderProducts = [];
      let total = 0;

      for (const item of products) {
        const product = await productRepository.getById(
          item.product,
          { session }
        );

        if (!product) {
          throw new AppError("PRODUCT_NOT_FOUND");
        }

        if (
          !Number.isFinite(product.price) ||
          product.price < 0
        ) {
          throw new AppError("VALIDATION_ERROR");
        }

        const reservedProduct =
          await productRepository.reserveStock(
            item.product,
            item.quantity,
            { session }
          );

        if (!reservedProduct) {
          throw new AppError(
            "ORDER_INSUFFICIENT_STOCK",
            `Stock insuficiente para el producto ${product.name}.`
          );
        }

        orderProducts.push({
          product: product._id,
          quantity: item.quantity,
        });

        total += product.price * item.quantity;
      }

      if (!Number.isFinite(total)) {
        throw new AppError("VALIDATION_ERROR");
      }

      return orderRepository.create(
        {
          user,
          products: orderProducts,
          total:
            Math.round((total + Number.EPSILON) * 100) / 100,
          priority,
          status: ORDER_STATUS.PENDING,
        },
        { session }
      );
    });
  }

  async updateOrder(id, orderData) {
    if (
      !orderData ||
      typeof orderData !== "object" ||
      Array.isArray(orderData)
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    const { status, priority } = orderData;

    const allowedFields = ["status", "priority"];

    const fields = Object.keys(orderData);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    if (status === ORDER_STATUS.CANCELLED) {
      if (priority !== undefined) {
        throw new AppError("VALIDATION_ERROR");
      }

      return this.cancelOrder(id);
    }

    return mongoose.connection.transaction(async (session) => {
      const order = await orderRepository.getById(
        id,
        { session }
      );

      if (!order) {
        throw new AppError("ORDER_NOT_FOUND");
      }

      const changes = {};

      if (priority !== undefined) {
        changes.priority = priority;
      }

      if (status !== undefined) {
        const allowedStatuses =
          ALLOWED_TRANSITIONS[order.status] ?? [];

        if (!allowedStatuses.includes(status)) {
          throw new AppError(
            "ORDER_INVALID_STATUS_TRANSITION"
          );
        }

        // Cuando existe una entrega, su finalización
        // debe gestionarse desde DeliveryService.
        // Así ambos documentos se actualizan dentro
        // de la misma transacción.
        if (status === ORDER_STATUS.DELIVERED) {
          const delivery =
            await deliveryRepository.getByOrderId(
              id,
              { session }
            );

          if (delivery) {
            throw new AppError(
              "ORDER_DELIVERY_CONFLICT"
            );
          }
        }

        changes.status = status;
      }

      if (Object.keys(changes).length === 0) {
        throw new AppError("VALIDATION_ERROR");
      }

      const updatedOrder =
        await orderRepository.updateIfStatus(
          id,
          order.status,
          changes,
          { session }
        );

      if (!updatedOrder) {
        throw new AppError(
          "ORDER_INVALID_STATUS_TRANSITION"
        );
      }

      return updatedOrder;
    });
  }

  async cancelOrder(id) {
    return mongoose.connection.transaction(async (session) => {
      const order = await orderRepository.getById(
        id,
        { session }
      );

      if (!order) {
        throw new AppError("ORDER_NOT_FOUND");
      }

      if (order.status === ORDER_STATUS.CANCELLED) {
        throw new AppError("ORDER_ALREADY_CANCELLED");
      }

      if (
        ![
          ORDER_STATUS.PENDING,
          ORDER_STATUS.PROCESSING,
        ].includes(order.status)
      ) {
        throw new AppError("ORDER_CANNOT_BE_CANCELLED");
      }

      const delivery = await deliveryRepository.getByOrderId(
        id,
        { session }
      );

      if (delivery) {
        throw new AppError("ORDER_DELIVERY_CONFLICT");
      }

      const updatedOrder =
        await orderRepository.updateIfStatus(
          id,
          order.status,
          { status: ORDER_STATUS.CANCELLED },
          { session }
        );

      if (!updatedOrder) {
        throw new AppError(
          "ORDER_INVALID_STATUS_TRANSITION"
        );
      }

      for (const item of order.products) {
        const productId =
          item.product?._id ?? item.product;

        const releasedProduct =
          await productRepository.releaseStock(
            productId,
            item.quantity,
            { session }
          );

        if (!releasedProduct) {
          throw new AppError("PRODUCT_NOT_FOUND");
        }
      }

      return updatedOrder;
    });
  }

  async deleteOrder(id) {
    return mongoose.connection.transaction(async (session) => {
      const order = await orderRepository.getById(
        id,
        { session }
      );

      if (!order) {
        throw new AppError("ORDER_NOT_FOUND");
      }

      if (order.status !== ORDER_STATUS.CANCELLED) {
        throw new AppError("ORDER_CANNOT_BE_DELETED");
      }

      const delivery = await deliveryRepository.getByOrderId(
        id,
        { session }
      );

      if (delivery) {
        throw new AppError("ORDER_DELIVERY_CONFLICT");
      }

      return orderRepository.delete(id, { session });
    });
  }
}

const orderService = new OrderService();

export default orderService;
