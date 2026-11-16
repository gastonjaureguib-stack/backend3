import multer from "multer";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import config from "./env.config.js";
import AppError from "../utils/AppError.js";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const uploadRoot = config.nodeEnv === "test"
  ? join(tmpdir(), `shipnow-uploads-${process.pid}-${randomUUID()}`)
  : fileURLToPath(new URL("../../uploads/", import.meta.url));

const fileTypes = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export const buildStorage = (subfolder) => {
  if (!["users/documents", "deliveries/receipts"].includes(subfolder)) {
    throw new Error("Destino de archivos no permitido");
  }

  const directory = join(uploadRoot, subfolder);

  return multer.diskStorage({
    destination: async (req, file, callback) => {
      try {
        await mkdir(directory, { recursive: true });
        callback(null, directory);
      } catch (cause) {
        const error = new AppError("FILE_STORAGE_ERROR");
        error.cause = cause;
        callback(error);
      }
    },
    filename: (req, file, callback) => {
      const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
      req.uploadPaths ??= [];
      req.uploadPaths.push(join(directory, filename));
      callback(null, filename);
    },
  });
};

export const createUploader = (subfolder, fields) => multer({
  storage: buildStorage(subfolder),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields,
    parts: fields + 2,
    fieldSize: 100,
  },
  fileFilter: (req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();

    if (!Object.hasOwn(fileTypes, extension) || fileTypes[extension] !== file.mimetype) {
      return callback(new AppError("INVALID_FILE_TYPE"));
    }

    callback(null, true);
  },
});
