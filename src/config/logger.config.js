
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import config from "./env.config.js";

const { combine, timestamp, printf, errors, colorize } = winston.format;

// Niveles personalizados de logging
const levels = {
  fatal: 0,
  error: 1,
  warning: 2,
  info: 3,
  http: 4,
  debug: 5,
};

// Colores para la consola
const colors = {
  fatal: "red bold",
  error: "red",
  warning: "yellow",
  info: "green",
  http: "cyan",
  debug: "magenta",
};

winston.addColors(colors);

// Formato de los mensajes
const logFormat = printf(({ timestamp, level, message, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`;
});

// Formato para archivos
const fileFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  logFormat
);

// Formato para consola
const consoleFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  colorize({ level: true }),
  logFormat
);

// Entorno de ejecución
const isProduction = config.nodeEnv === "production";

// Transporte de consola
const consoleTransport = new winston.transports.Console({
  level: isProduction ? "info" : "debug",
  format: consoleFormat,
});

// Transporte de archivos con rotación
// Guarda exclusivamente error y fatal
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

// Logger centralizado
const logger = winston.createLogger({
  levels,
  level: isProduction ? "info" : "debug",
  transports: [
    consoleTransport,
    errorFileTransport,
  ],
});

export default logger;
