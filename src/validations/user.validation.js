import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres"),

  lastName: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede superar los 50 caracteres"),

  email: z
    .string()
    .trim()
    .email("El email no tiene un formato válido")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede superar los 100 caracteres"),
});

export const updateUserSchema = createUserSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debes enviar al menos un campo para actualizar",
    }
  );