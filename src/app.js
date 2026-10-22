
import express from "express";

import productRouter from "./routes/product.routes.js";
import userRouter from "./routes/user.routes.js";
import mockRouter from "./routes/mock.routes.js";

import AppError from "./utils/AppError.js";
import errorHandler from "./middlewares/error.middleware.js";

import logger from "./config/logger.config.js";
import config from "./config/env.config.js";

const app = express();

// =========================================
// MIDDLEWARES GENERALES
// =========================================

app.use(express.json());

// =========================================
// RUTAS
// =========================================

app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/mocks", mockRouter);

// =========================================
// ENDPOINT DE PRUEBA DEL LOGGER
// SOLO DISPONIBLE EN DESARROLLO
// =========================================

if (config.nodeEnv === "development") {
  app.get("/api/logger/test", (req, res) => {
    logger.debug("Prueba del nivel DEBUG");
    logger.http("Prueba del nivel HTTP");
    logger.info("Prueba del nivel INFO");
    logger.warning("Prueba del nivel WARNING");
    logger.error("Prueba del nivel ERROR");
    logger.fatal("Prueba del nivel FATAL");

    return res.status(200).json({
      status: "success",
      message: "Prueba del logger ejecutada correctamente",
      levels: [
        "debug",
        "http",
        "info",
        "warning",
        "error",
        "fatal",
      ],
    });
  });
}

// =========================================
// RUTAS NO ENCONTRADAS
// =========================================

app.use((req, res, next) => {
  next(new AppError("ROUTE_NOT_FOUND"));
});

// =========================================
// MIDDLEWARE GLOBAL DE ERRORES
// =========================================

app.use(errorHandler);

export default app;
