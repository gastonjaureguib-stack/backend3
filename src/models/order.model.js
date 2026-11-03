
import mongoose from "mongoose";
import {
  ORDER_STATUS,
  ORDER_PRIORITY,
} from "../constants/index.js";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "La cantidad debe ser un número entero seguro",
      },
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: {
      type: [orderItemSchema],
      required: true,
      validate: [
        {
          validator: (products) =>
            Array.isArray(products) && products.length > 0,
          message: "El pedido debe contener al menos un producto",
        },
        {
          validator: (products) => {
            if (!Array.isArray(products)) {
              return false;
            }

            const productIds = products.map((item) =>
              String(item.product)
            );

            return new Set(productIds).size === productIds.length;
          },
          message: "No se permiten productos duplicados en el pedido",
        },
      ],
    },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      required: true,
    },

    priority: {
      type: String,
      enum: Object.values(ORDER_PRIORITY),
      default: ORDER_PRIORITY.MEDIUM,
      required: true,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "El total debe ser un número válido",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
