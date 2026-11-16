import multer from "multer";
import { createUploader } from "../config/multer.config.js";
import { discardFiles, validateFileSignature } from "../utils/file.utils.js";
import AppError from "../utils/AppError.js";
import { documentUploadSchema } from "../validations/user.validation.js";
import { receiptUploadSchema } from "../validations/delivery.validation.js";

const receive = (upload, schema, validationCode) => (req, res, next) => {
  upload(req, res, async (error) => {
    try {
      if (error) {
        if (error instanceof multer.MulterError || error instanceof AppError) {
          throw error;
        }

        const code = error.code?.startsWith("E")
          ? "FILE_STORAGE_ERROR"
          : "INVALID_UPLOAD";
        const uploadError = new AppError(code);
        uploadError.cause = error;
        throw uploadError;
      }

      if (!req.file) {
        throw new AppError("FILE_REQUIRED");
      }

      const result = schema.safeParse(req.body);

      if (!result.success) {
        throw new AppError(validationCode);
      }

      req.body = result.data;
      await validateFileSignature(req.file);
    } catch (uploadError) {
      await discardFiles(req.uploadPaths ?? []);

      if (!(uploadError instanceof AppError) && !(uploadError instanceof multer.MulterError)) {
        const storageError = new AppError("FILE_STORAGE_ERROR");
        storageError.cause = uploadError;
        return next(storageError);
      }

      return next(uploadError);
    }

    return next();
  });
};

export const uploadDocument = receive(
  createUploader("users/documents", 1).single("document"),
  documentUploadSchema,
  "INVALID_DOCUMENT_TYPE"
);

export const uploadReceipt = receive(
  createUploader("deliveries/receipts", 0).single("receipt"),
  receiptUploadSchema,
  "INVALID_UPLOAD"
);
