import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import app from "../../src/app.js";
import config from "../../src/config/env.config.js";
import logger from "../../src/config/logger.config.js";

const execFileAsync = promisify(execFile);

describe("Logger - Pruebas funcionales", () => {
  it("debe responder con los seis niveles y sus prioridades en test", async () => {
    expect(config.nodeEnv).to.equal("test");

    const response = await request(app).get("/api/logger/test");

    expect(response.status).to.equal(200);
    expect(response.headers["content-type"]).to.include("application/json");
    expect(response.body).to.deep.equal({
      status: "success",
      message: "Prueba del logger ejecutada correctamente",
      levels: ["debug", "http", "info", "warning", "error", "fatal"],
    });
    expect(logger.levels).to.deep.equal({
      fatal: 0,
      error: 1,
      warning: 2,
      info: 3,
      http: 4,
      debug: 5,
    });
  });

  it("debe devolver ROUTE_NOT_FOUND en production sin conectar MongoDB", async () => {
    const directory = await mkdtemp(join(tmpdir(), "shipnow-logger-"));
    const helper = fileURLToPath(
      new URL("../setup/logger-production.js", import.meta.url)
    );

    try {
      const { stdout } = await execFileAsync(process.execPath, [helper], {
        cwd: directory,
        env: {
          ...process.env,
          NODE_ENV: "production",
          NODE_OPTIONS: "",
          PORT: "3001",
          MONGODB_URI:
            "mongodb://127.0.0.1:27017/shipnow_test?replicaSet=rs0",
        },
        timeout: 10000,
        windowsHide: true,
      });

      const prefix = "SHIPNOW_LOGGER_RESULT=";
      const line = stdout.split(/\r?\n/).find((item) => item.startsWith(prefix));

      expect(line).to.be.a("string");

      const result = JSON.parse(line.slice(prefix.length));

      expect(result.nodeEnv).to.equal("production");
      expect(result.connectionState).to.equal(0);
      expect(result.status).to.equal(404);
      expect(result.body).to.deep.equal({
        status: "error",
        code: "ROUTE_NOT_FOUND",
        message: "Ruta no encontrada",
      });
      expect(config.nodeEnv).to.equal("test");
      expect(process.env.NODE_ENV).to.equal("test");
    } finally {
      if (
        dirname(resolve(directory)) !== resolve(tmpdir()) ||
        !basename(directory).startsWith("shipnow-logger-")
      ) {
        throw new Error("Directorio temporal de Logger inesperado");
      }

      await rm(directory, { recursive: true, force: true });
    }
  });
});
