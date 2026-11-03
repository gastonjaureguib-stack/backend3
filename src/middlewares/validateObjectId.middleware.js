
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!mongoose.isValidObjectId(value)) {
      return next(
        new AppError("INVALID_OBJECT_ID")
      );
    }

    next();
  };
};

export default validateObjectId;
