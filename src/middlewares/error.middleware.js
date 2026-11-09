
import AppError from "../utils/AppError.js";
import errorDictionary from "../utils/errorDictionary.js";
import logger from "../config/logger.config.js";

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isAppError = error instanceof AppError;

  const internalError = errorDictionary.INTERNAL_SERVER_ERROR;

  const statusCode = isAppError
    ? error.statusCode
    : internalError.statusCode;

  const code = isAppError
    ? error.code
    : internalError.code;

  const message = statusCode >= 500
    ? internalError.message
    : error.message;

  const errorContext = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
  };

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

  return res.status(statusCode).json({
    status: "error",
    code,
    message,
  });
};

export default errorHandler;
