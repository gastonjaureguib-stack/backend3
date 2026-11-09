
import { RESPONSE_STATUS } from "../../constants/index.js";

const LOGGER_LEVELS = [
  "debug",
  "http",
  "info",
  "warning",
  "error",
  "fatal",
];

const loggerPaths = {
  "/api/logger/test": {
    get: {
      tags: ["Logger"],

      summary: "Probar los niveles del logger",

      description: `
        Ejecuta una prueba de los seis niveles
        configurados en Winston:

        - debug
        - http
        - info
        - warning
        - error
        - fatal

        Cada nivel genera un mensaje de prueba
        mediante la configuración de logging
        de ShipNow.

        Este endpoint se registra únicamente
        cuando NODE_ENV=development.

        En otros entornos, la ruta no existe
        y se procesa mediante el middleware
        global de rutas no encontradas.

        No recibe parámetros ni requiere
        un cuerpo de solicitud.
      `,

      operationId: "testLogger",

      responses: {
        200: {
          description:
            "Prueba de los niveles del logger ejecutada correctamente.",

          content: {
            "application/json": {
              schema: {
                type: "object",

                additionalProperties: false,

                required: [
                  "status",
                  "message",
                  "levels",
                ],

                properties: {
                  status: {
                    type: "string",
                    enum: [RESPONSE_STATUS.SUCCESS],
                    example: RESPONSE_STATUS.SUCCESS,
                  },

                  message: {
                    type: "string",
                    example:
                      "Prueba del logger ejecutada correctamente",
                  },

                  levels: {
                    type: "array",

                    description:
                      "Niveles de logging ejecutados durante la prueba.",

                    minItems: 6,
                    maxItems: 6,

                    items: {
                      type: "string",
                      enum: LOGGER_LEVELS,
                    },

                    example: LOGGER_LEVELS,
                  },
                },
              },

              example: {
                status: RESPONSE_STATUS.SUCCESS,

                message:
                  "Prueba del logger ejecutada correctamente",

                levels: LOGGER_LEVELS,
              },
            },
          },
        },

        404: {
          description:
            "Endpoint no disponible fuera del entorno de desarrollo.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        500: {
          description:
            "Error interno del servidor.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
};

export default loggerPaths;
