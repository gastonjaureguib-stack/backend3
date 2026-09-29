import mongoose from "mongoose";
import app from "./app.js";
import config from "./config/env.config.js";

const startServer = async () => {
  try {
    await mongoose.connect(config.mongodbUri);

    console.log("MongoDB conectado correctamente");

    app.listen(config.port, () => {
      console.log(`Servidor activo en el puerto ${config.port}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
};

startServer();