
import AppError from "../utils/AppError.js";

// =========================================
// MIDDLEWARE DE VALIDACIÓN CON ZOD
// =========================================

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return next(
        new AppError("VALIDATION_ERROR", message)
      );
    }

    req.body = result.data;

    next();
  };
};

export default validate;
