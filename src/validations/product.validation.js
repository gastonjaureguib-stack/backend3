import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),

  description: z
    .string()
    .trim()
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(500, "La descripción no puede superar los 500 caracteres"),

  category: z
    .string()
    .trim()
    .min(2, "La categoría debe tener al menos 2 caracteres")
    .max(50, "La categoría no puede superar los 50 caracteres"),

  price: z
    .number()
    .min(0, "El precio no puede ser negativo"),

  stock: z
    .number()
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debes enviar al menos un campo para actualizar",
    }
  );