
import express from "express";
import swaggerUi from "swagger-ui-express";

import productRouter from "./routes/product.routes.js";
import userRouter from "./routes/user.routes.js";
import mockRouter from "./routes/mock.routes.js";
import orderRouter from "./routes/order.routes.js";
import deliveryRouter from "./routes/delivery.routes.js";

import swaggerConfig from "./config/swagger.config.js";

import AppError from "./utils/AppError.js";
import errorHandler from "./middlewares/error.middleware.js";

import logger from "./config/logger.config.js";
import config from "./config/env.config.js";

const app = express();

app.use(express.json());

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerConfig, {
    explorer: true,
    customSiteTitle: "ShipNow API Documentation",
  })
);

app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/deliveries", deliveryRouter);
app.use("/api/mocks", mockRouter);

if (
  config.nodeEnv === "development" ||
  config.nodeEnv === "test"
) {
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

app.use((req, res, next) => {
  next(new AppError("ROUTE_NOT_FOUND"));
});

app.use(errorHandler);

export default app;
