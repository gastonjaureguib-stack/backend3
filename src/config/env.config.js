
import dotenv from "dotenv";

dotenv.config();

// ============================================
// VARIABLES DE ENTORNO OBLIGATORIAS
// ============================================

const requiredEnvVars = [
  "PORT",
  "MONGODB_URI",
  "NODE_ENV",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]?.trim()) {
    throw new Error(
      `Falta la variable de entorno requerida: ${envVar}`
    );
  }
}

// ============================================
// VALIDAR PUERTO
// ============================================

const port = Number(process.env.PORT);

if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error(
    "La variable PORT debe ser un número entero entre 1 y 65535"
  );
}

// ============================================
// CONFIGURACIÓN CENTRALIZADA
// ============================================

const config = Object.freeze({
  port,
  mongodbUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
});

export default config;
