
import dotenv from "dotenv";

const isTestEnvironment = process.env.NODE_ENV === "test";

dotenv.config({
  path: isTestEnvironment ? ".env.test" : ".env",
  override: isTestEnvironment,
});

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

if (isTestEnvironment) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "El entorno de testing no está configurado correctamente"
    );
  }

  let mongoUrl;

  try {
    mongoUrl = new URL(process.env.MONGODB_URI);
  } catch {
    throw new Error(
      "La URI de MongoDB para testing no es válida"
    );
  }

  if (
    mongoUrl.protocol !== "mongodb:" ||
    mongoUrl.hostname !== "127.0.0.1" ||
    mongoUrl.port !== "27017" ||
    mongoUrl.pathname !== "/shipnow_test"
  ) {
    throw new Error(
      "Las pruebas deben utilizar MongoDB local y la base shipnow_test"
    );
  }

  if (mongoUrl.searchParams.get("replicaSet") !== "rs0") {
    throw new Error(
      "Las pruebas requieren el replica set rs0"
    );
  }
}

const config = Object.freeze({
  port,
  mongodbUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
});

export default config;
