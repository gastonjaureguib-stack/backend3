
import mongoose from "mongoose";
import app from "./app.js";
import config from "./config/env.config.js";
import logger from "./config/logger.config.js";

const startServer = async () => {
  try {
    // Conexión a MongoDB
    await mongoose.connect(config.mongodbUri);

    logger.info("Conexión a MongoDB establecida correctamente");

    // Inicio del servidor HTTP
    const server = app.listen(config.port);

    server.on("listening", () => {
      logger.info(
        `Servidor ShipNow escuchando en el puerto ${config.port}`
      );

      logger.debug(
        `Entorno de ejecución: ${config.nodeEnv}`
      );
    });

    server.on("error", (error) => {
      logger.fatal(
        `Error crítico al iniciar el servidor HTTP: ${error.message}`
      );

      process.exitCode = 1;
    });
  } catch (error) {
    logger.fatal(
      `Error crítico al conectar con MongoDB: ${error.message}`
    );

    process.exitCode = 1;
  }
};

startServer();
