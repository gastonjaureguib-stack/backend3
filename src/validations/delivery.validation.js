
import { z } from "zod";

import { DELIVERY_STATUS } from "../constants/index.js";

const objectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Debe ser un ObjectId válido de MongoDB."
  );

const deliveryAddressSchema = z
  .string()
  .trim()
  .min(5, "La dirección debe tener al menos 5 caracteres.")
  .max(250, "La dirección no puede superar los 250 caracteres.");

const deliveryStatusSchema = z.enum(
  Object.values(DELIVERY_STATUS)
);

export const createDeliverySchema = z
  .object({
    order: objectIdSchema,

    driver: objectIdSchema.nullable().optional(),

    deliveryAddress: deliveryAddressSchema,
  })
  .strict();

export const updateDeliverySchema = z
  .object({
    driver: objectIdSchema.nullable().optional(),

    status: deliveryStatusSchema.optional(),

    deliveryAddress: deliveryAddressSchema.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debe proporcionar al menos un campo para actualizar.",
    }
  );
