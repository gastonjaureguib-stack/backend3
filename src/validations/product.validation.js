
import { z } from "zod";

// ============================================
// CAMPOS GENERALES DEL PRODUCTO
// ============================================

const productFields = {
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
    .finite("El precio debe ser un número finito")
    .min(0, "El precio no puede ser negativo"),
};

// ============================================
// CREACIÓN DE PRODUCTOS
// ============================================

export const createProductSchema = z
  .object({
    ...productFields,

    stock: z
      .number()
      .int("El stock debe ser un número entero")
      .nonnegative("El stock no puede ser negativo")
      .safe("El stock supera el rango seguro permitido"),
  })
  .strict();

// ============================================
// ACTUALIZACIÓN DE DATOS GENERALES
// ============================================

export const updateProductSchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debes enviar al menos un campo para actualizar",
    }
  );

// ============================================
// AJUSTES DE INVENTARIO
// ============================================

export const adjustProductStockSchema = z
  .object({
    adjustment: z
      .number()
      .int("El ajuste debe ser un número entero")
      .safe("El ajuste supera el rango seguro permitido")
      .refine(
        (value) => value !== 0,
        {
          message: "El ajuste debe ser distinto de cero",
        }
      ),
  })
  .strict();
