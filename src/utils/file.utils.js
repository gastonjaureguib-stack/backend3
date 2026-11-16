import { open, unlink } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep, win32, basename } from "node:path";
import mongoose from "mongoose";
import { uploadRoot } from "../config/multer.config.js";
import AppError from "./AppError.js";
import logger from "../config/logger.config.js";

export const resolveUploadPath = (path) => {
  const absolute = resolve(uploadRoot, path);
  const local = relative(uploadRoot, absolute);

  if (!local || local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) {
    throw new AppError("FILE_STORAGE_ERROR");
  }

  return absolute;
};

export const discardFiles = async (paths) => {
  for (const path of new Set(paths)) {
    try {
      await unlink(resolveUploadPath(path));
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.error("No se pudo limpiar un archivo de carga", {
          filename: basename(path),
          errorMessage: error.message,
        });
      }
    }
  }
};

export const validateFileSignature = async (file) => {
  const handle = await open(resolveUploadPath(file.path), "r");

  try {
    const bytes = Buffer.alloc(8);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    const matches = {
      "application/pdf": bytesRead >= 5 && bytes.subarray(0, 5).equals(Buffer.from("%PDF-")),
      "image/png": bytesRead >= 8 && bytes.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      "image/jpeg": bytesRead >= 3 && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])),
    };

    if (!matches[file.mimetype]) {
      throw new AppError("INVALID_FILE_TYPE");
    }
  } finally {
    await handle.close();
  }
};

export const createFileMetadata = (file, documentType) => {
  const absolute = resolveUploadPath(file.path);

  return {
    _id: new mongoose.Types.ObjectId(),
    originalName: basename(win32.basename(file.originalname))
      .replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 255),
    filename: file.filename,
    path: relative(uploadRoot, absolute).split(sep).join("/"),
    mimeType: file.mimetype,
    size: file.size,
    ...(documentType ? { documentType } : {}),
    uploadedAt: new Date(),
  };
};
