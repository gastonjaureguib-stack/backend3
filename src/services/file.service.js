import { createFileMetadata, discardFiles } from "../utils/file.utils.js";
import logger from "../config/logger.config.js";
import mongoose from "mongoose";

export const persistFile = async ({
  file, documentType, entityId, entityType, append, isAssociated, missingError,
}) => {
  let metadata;
  let uncertain = false;
  let acknowledged = false;

  try {
    metadata = createFileMetadata(file, documentType);
    uncertain = true;
    const entity = await append(metadata);

    if (!entity) {
      uncertain = false;
      throw await missingError();
    }

    acknowledged = true;
    logger.info("Archivo asociado correctamente", {
      entityType,
      entityId,
      fileId: String(metadata._id),
      mimeType: metadata.mimeType,
      size: metadata.size,
    });
    return metadata;
  } catch (error) {
    let canDiscard = !uncertain && !acknowledged;

    if (uncertain && !acknowledged) {
      try {
        const associated = await isAssociated(metadata._id);
        const rejected = error instanceof mongoose.Error.ValidationError ||
          error instanceof mongoose.Error.CastError ||
          (error instanceof mongoose.mongo.MongoServerError &&
            [11000, 121].includes(error.code) && !error.writeConcernError &&
            !error.hasErrorLabel("RetryableWriteError"));
        canDiscard = !associated && rejected;

        if (!canDiscard) {
          logger.warning("Se conserva el archivo tras un error de escritura", {
            entityType, entityId, fileId: String(metadata._id),
            associationConfirmed: Boolean(associated),
          });
        }
      } catch (verificationError) {
        logger.error("No se pudo confirmar la asociación; se conserva el archivo", {
          entityType,
          entityId,
          fileId: String(metadata._id),
          errorMessage: verificationError.message,
        });
      }
    }

    if (canDiscard) {
      await discardFiles([file.path]);
    }

    throw error;
  }
};
