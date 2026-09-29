import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("ID inválido", 400));
  }

  next();
};

export default validateObjectId;