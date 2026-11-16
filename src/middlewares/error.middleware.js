
import AppError from "../utils/AppError.js";
import errorDictionary from "../utils/errorDictionary.js";
import logger from "../config/logger.config.js";
import multer from "multer";

const errorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const code = error.code === "LIMIT_FILE_SIZE"
      ? "FILE_TOO_LARGE"
      : ["LIMIT_UNEXPECTED_FILE", "LIMIT_FILE_COUNT"].includes(error.code)
        ? "UNEXPECTED_FILE"
        : "INVALID_UPLOAD";
    error = new AppError(code);
  }

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
        cause: error.cause?.message,
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
