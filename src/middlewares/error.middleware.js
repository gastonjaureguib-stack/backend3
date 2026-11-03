
import AppError from "../utils/AppError.js";
import errorDictionary from "../utils/errorDictionary.js";
import logger from "../config/logger.config.js";

// ============================================
// MIDDLEWARE CENTRALIZADO DE ERRORES
// ============================================

const errorHandler = (error, req, res, next) => {
  // Si la respuesta ya comenzó, delegar a Express.
  if (res.headersSent) {
    return next(error);
  }

  const isAppError = error instanceof AppError;

  const internalError = errorDictionary.INTERNAL_SERVER_ERROR;

  // ============================================
  // IDENTIFICACIÓN DEL ERROR
  // ============================================

  const statusCode = isAppError
    ? error.statusCode
    : internalError.statusCode;

  const code = isAppError
    ? error.code
    : internalError.code;

  // No exponer detalles internos de errores 5xx.
  const message = statusCode >= 500
    ? internalError.message
    : error.message;

  // ============================================
  // CONTEXTO PARA LOGGING
  // ============================================

  const errorContext = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
  };

  // ============================================
  // REGISTRO DEL ERROR
  // ============================================

  if (isAppError && statusCode < 500) {
    logger.warning(
      `${code}: ${message}`,
      errorContext
    );
  } else {
    logger.error(
      `${code}: ${message}`,
      {
        ...errorContext,
        errorMessage: error.message,
        stack: error.stack,
      }
    );
  }

  // ============================================
  // RESPUESTA HTTP ESTANDARIZADA
  // ============================================

  return res.status(statusCode).json({
    status: "error",
    code,
    message,
  });
};

export default errorHandler;
