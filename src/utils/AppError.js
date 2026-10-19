
import errorDictionary from "./errorDictionary.js";

class AppError extends Error {
  constructor(code, customMessage = null) {
    const error =
      errorDictionary[code] ||
      errorDictionary.INTERNAL_SERVER_ERROR;

    super(customMessage ?? error.message);

    this.name = "AppError";
    this.statusCode = error.statusCode;
    this.code = error.code;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default AppError;
