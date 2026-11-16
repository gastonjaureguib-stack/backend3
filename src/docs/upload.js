import { DOCUMENT_TYPES } from "../constants/index.js";
import errorDictionary from "../utils/errorDictionary.js";

export const uploadOperation = (tag, field, entityError) => {
  const document = field === "document";
  const response = (description, codes) => ({
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        examples: Object.fromEntries(codes.map((code) => [code, {
          value: {
            status: "error",
            code,
            message: errorDictionary[code].statusCode >= 500
              ? errorDictionary.INTERNAL_SERVER_ERROR.message
              : errorDictionary[code].message,
          },
        }])),
      },
    },
  });

  return {
    post: {
      tags: [tag],
      summary: document ? "Adjuntar documento de usuario" : "Adjuntar comprobante de entrega",
      description: "Un archivo PDF, JPG, JPEG o PNG de hasta 5 MiB (5242880 bytes). Se validan extensión, MIME y firma básica. " +
        (document
          ? "documentType es obligatorio: identification, proof_of_address u other."
          : "Solo disponible para entregas delivered; no modifica estados. Sin campos de texto."),
      parameters: [{
        name: "id", in: "path", required: true,
        schema: { $ref: "#/components/schemas/ObjectId" },
      }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              additionalProperties: false,
              required: document ? [field, "documentType"] : [field],
              properties: {
                [field]: {
                  type: "string", format: "binary",
                  description: "PDF/JPEG/PNG; máximo 5 MiB",
                },
                ...(document ? {
                  documentType: { type: "string", enum: DOCUMENT_TYPES },
                } : {}),
              },
            },
            encoding: {
              [field]: { contentType: "application/pdf, image/jpeg, image/png" },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Archivo almacenado y metadatos asociados",
          content: {
            "application/json": {
              schema: {
                type: "object", required: ["status", "message", "payload"],
                properties: {
                  status: { type: "string", enum: ["success"] },
                  message: {
                    type: "string",
                    example: document
                      ? "Documento cargado correctamente"
                      : "Comprobante cargado correctamente",
                  },
                  payload: { $ref: `#/components/schemas/${document ? "UserDocument" : "FileMetadata"}` },
                },
              },
            },
          },
        },
        400: response("Solicitud o archivo inválido", [
          "INVALID_OBJECT_ID", "FILE_REQUIRED", "INVALID_FILE_TYPE",
          "UNEXPECTED_FILE", "INVALID_UPLOAD",
          ...(document ? ["INVALID_DOCUMENT_TYPE"] : []),
        ]),
        404: response("Entidad inexistente", [entityError]),
        ...(!document ? {
          409: response("Estado de entrega incompatible", ["DELIVERY_RECEIPT_NOT_ALLOWED"]),
        } : {}),
        413: response("Archivo mayor a 5 MiB", ["FILE_TOO_LARGE"]),
        500: response("Error de almacenamiento o persistencia", [
          "FILE_STORAGE_ERROR", "INTERNAL_SERVER_ERROR",
        ]),
      },
    },
  };
};
