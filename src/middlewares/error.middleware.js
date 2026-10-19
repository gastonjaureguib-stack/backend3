
import AppError from "../utils/AppError.js";
import errorDictionary from "../utils/errorDictionary.js";

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

  if (!isAppError) {
    console.error("Error inesperado:", error);
  }

  return res.status(statusCode).json({
    status: "error",
    code,
    message,
  });
};

export default errorHandler;
