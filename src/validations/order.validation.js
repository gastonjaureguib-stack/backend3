
import { z } from "zod";
import { ORDER_PRIORITY, ORDER_STATUS } from "../constants/index.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "El ID proporcionado no es válido");

const orderItemSchema = z
  .object({
    product: objectIdSchema,

    quantity: z
      .number()
      .int("La cantidad debe ser un número entero")
      .positive("La cantidad debe ser mayor a cero"),
  })
  .strict();

export const createOrderSchema = z
  .object({
    user: objectIdSchema,

    products: z
      .array(orderItemSchema)
      .min(1, "El pedido debe contener al menos un producto")
      .superRefine((products, ctx) => {
        const productIds = new Set();

        products.forEach((item, index) => {
          if (productIds.has(item.product)) {
            ctx.addIssue({
              code: "custom",
              path: [index, "product"],
              message: "No se permiten productos duplicados en el pedido",
            });
          }

          productIds.add(item.product);
        });
      }),

    priority: z
      .enum(Object.values(ORDER_PRIORITY))
      .default(ORDER_PRIORITY.MEDIUM),
  })
  .strict();

export const updateOrderSchema = z
  .object({
    status: z.enum(Object.values(ORDER_STATUS)).optional(),

    priority: z.enum(Object.values(ORDER_PRIORITY)).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });
