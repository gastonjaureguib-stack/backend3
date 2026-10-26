
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import config from "./env.config.js";

const { combine, timestamp, printf, errors, colorize } = winston.format;

// =========================================
// NIVELES PERSONALIZADOS
// =========================================

const levels = {
  fatal: 0,
  error: 1,
  warning: 2,
  info: 3,
  http: 4,
  debug: 5,
};

// =========================================
// COLORES DE CONSOLA
// =========================================

const colors = {
  fatal: "red bold",
  error: "red",
  warning: "yellow",
  info: "green",
  http: "cyan",
  debug: "magenta",
};

winston.addColors(colors);

// =========================================
// FORMATO DE LOS MENSAJES
// =========================================

const logFormat = printf((info) => {
  const { timestamp, level, message, stack, ...metadata } = info;

  const details = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) => key !== "splat"
    )
  );

  const metadataText =
    Object.keys(details).length > 0
      ? ` ${JSON.stringify(details)}`
      : "";

  return `${timestamp} [${level}] ${stack || message}${metadataText}`;
});

// =========================================
// FORMATO PARA ARCHIVOS
// =========================================

const fileFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  logFormat
);

// =========================================
// FORMATO PARA CONSOLA
// =========================================

const consoleFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  colorize({ level: true }),
  logFormat
);

// =========================================
// ENTORNO DE EJECUCIÓN
// =========================================

const isProduction = config.nodeEnv === "production";

// =========================================
// TRANSPORTE DE CONSOLA
// =========================================

const consoleTransport = new winston.transports.Console({
  level: isProduction ? "info" : "debug",
  format: consoleFormat,
});

// =========================================
// TRANSPORTE DE ARCHIVOS
// =========================================

const errorFileTransport = new DailyRotateFile({
  dirname: "logs",
  filename: "error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxSize: "10m",
  maxFiles: "14d",
  zippedArchive: true,
  format: fileFormat,
});

// =========================================
// LOGGER CENTRALIZADO
// =========================================

const logger = winston.createLogger({
  levels,
  level: isProduction ? "info" : "debug",
  transports: [
    consoleTransport,
    errorFileTransport,
  ],
});

export default logger;
