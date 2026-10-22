
import AppError from "../utils/AppError.js";
import errorDictionary from "../utils/errorDictionary.js";
import logger from "../config/logger.config.js";

const errorHandler = (error, req, res, next) => {
  const isAppError = error instanceof AppError;

  const internalError = errorDictionary.INTERNAL_SERVER_ERROR;

  const statusCode = isAppError
    ? error.statusCode
    : internalError.statusCode;

  const code = isAppError
    ? error.code
    : internalError.code;

  const message = isAppError
    ? error.message
    : internalError.message;

  // Información contextual para investigar el error
  const errorContext = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
  };

  if (isAppError && statusCode < 500) {
    // Errores esperados de validación o negocio
    logger.warning(
      `${code}: ${message}`,
      errorContext
    );
  } else {
    // Errores del servidor o fallas inesperadas
    logger.error(
      `${code}: ${message}`,
      {
        ...errorContext,
        errorMessage: error.message,
        stack: error.stack,
      }
    );
  }

  // Mantener el contrato HTTP de la API
  return res.status(statusCode).json({
    status: "error",
    code,
    message,
  });
};

export default errorHandler;
