import request from "supertest";
import mongoose from "mongoose";

import app from "../../src/app.js";
import config from "../../src/config/env.config.js";
import logger from "../../src/config/logger.config.js";

try {
  if (config.nodeEnv !== "production" || mongoose.connection.readyState !== 0) {
    throw new Error("El proceso de Logger no está aislado correctamente");
  }

  const response = await request(app).get("/api/logger/test");

  process.stdout.write(
    "SHIPNOW_LOGGER_RESULT=" + JSON.stringify({
      nodeEnv: config.nodeEnv,
      connectionState: mongoose.connection.readyState,
      status: response.status,
      body: response.body,
    }) + "\n"
  );
} finally {
  await new Promise((resolve, reject) => {
    logger.once("error", reject);
    logger.end(resolve);
  });
  logger.close();
}
