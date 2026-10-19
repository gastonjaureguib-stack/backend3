
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("INVALID_OBJECT_ID"));
  }

  next();
};

export default validateObjectId;
