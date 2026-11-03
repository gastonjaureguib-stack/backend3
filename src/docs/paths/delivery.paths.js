
import { DELIVERY_STATUS } from "../../constants/index.js";

// ============================================
// REFERENCIAS OPENAPI
// ============================================

const schemaRef = (name) => ({
  $ref: `#/components/schemas/${name}`,
});

const jsonContent = (schema) => ({
  "application/json": {
    schema,
  },
});

// ============================================
// RESPUESTAS EXITOSAS
// ============================================

const successResponse = (
  payloadSchema = null,
  message = null
) => {
  const properties = {
    status: {
      type: "string",
      enum: ["success"],
    },
  };

  const required = ["status"];

  if (message !== null) {
    properties.message = {
      type: "string",
      example: message,
    };

    required.push("message");
  }

  if (payloadSchema !== null) {
    properties.payload = payloadSchema;
    required.push("payload");
  }

  return {
    content: jsonContent({
      type: "object",
      required,
      properties,
    }),
  };
};

// ============================================
// RESPUESTAS DE ERROR
// ============================================

const errorResponse = (description, errors) => ({
  description,
  content: {
    "application/json": {
      schema: schemaRef("Error"),
      examples: Object.fromEntries(
        errors.map(({ code, message }) => [
          code,
          {
            summary: code,
            value: {
              status: "error",
              code,
              message,
            },
          },
        ])
      ),
    },
  },
});

const errors = {
  invalidObjectId: {
    code: "INVALID_OBJECT_ID",
    message: "El identificador proporcionado no es válido",
  },

  validation: {
    code: "VALIDATION_ERROR",
    message: "Los datos proporcionados no son válidos",
  },

  notFound: {
    code: "DELIVERY_NOT_FOUND",
    message: "Entrega no encontrada",
  },

  alreadyExists: {
    code: "DELIVERY_ALREADY_EXISTS",
    message: "Ya existe una entrega asociada a este pedido",
  },

  invalidTransition: {
    code: "DELIVERY_INVALID_STATUS_TRANSITION",
    message: "Transición de estado de entrega no permitida",
  },

  invalidDriver: {
    code: "DELIVERY_INVALID_DRIVER",
    message: "El usuario indicado no es un repartidor válido",
  },

  driverNotFound: {
    code: "DELIVERY_DRIVER_NOT_FOUND",
    message: "Repartidor no encontrado",
  },

  orderNotEligible: {
    code: "DELIVERY_ORDER_NOT_ELIGIBLE",
    message: "El pedido no está habilitado para una entrega",
  },

  cannotDelete: {
    code: "DELIVERY_CANNOT_BE_DELETED",
    message: "La entrega no puede eliminarse",
  },

  orderNotFound: {
    code: "ORDER_NOT_FOUND",
    message: "Pedido no encontrado",
  },

  internal: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Error interno del servidor",
  },
};

const internalError = errorResponse(
  "Error interno del servidor.",
  [errors.internal]
);

// ============================================
// PARÁMETROS DE RUTA
// ============================================

const deliveryIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description:
    "Identificador MongoDB de la entrega.",
  schema: schemaRef("ObjectId"),
};

const orderIdParameter = {
  name: "orderId",
  in: "path",
  required: true,
  description:
    "Identificador MongoDB del pedido asociado a la entrega.",
  schema: schemaRef("ObjectId"),
};

// ============================================
// ENDPOINTS DE DELIVERIES
// ============================================

const deliveryPaths = {
  // ==========================================
  // /api/deliveries
  // ==========================================

  "/api/deliveries": {
    get: {
      tags: ["Deliveries"],
      summary: "Listar entregas",
      description:
        "Obtiene las entregas registradas, incluyendo los datos poblados del pedido y del repartidor cuando corresponda.",
      operationId: "getAllDeliveries",

      responses: {
        200: {
          description: "Entregas obtenidas correctamente.",
          ...successResponse({
            type: "array",
            items: schemaRef("DeliveryPopulated"),
          }),
        },

        500: internalError,
      },
    },

    post: {
      tags: ["Deliveries"],
      summary: "Crear entrega",
      description: `
        Crea una entrega asociada a un pedido.

        Reglas principales:
        - El pedido debe existir.
        - Cada pedido puede tener una sola entrega.
        - El pedido debe cumplir las condiciones
          necesarias para generar una entrega.
        - El repartidor es opcional.
        - Si se indica un repartidor, debe existir
          y tener un rol válido.
        - El estado inicial es pending.
        - La dirección de entrega es obligatoria.
      `,
      operationId: "createDelivery",

      requestBody: {
        required: true,
        description:
          "Pedido, dirección de entrega y repartidor opcional.",
        content: {
          "application/json": {
            schema: schemaRef("CreateDeliveryRequest"),
            example: {
              order: "507f1f77bcf86cd799439011",
              driver: "507f1f77bcf86cd799439012",
              deliveryAddress:
                "Av. Principal 123, Montevideo",
            },
          },
        },
      },

      responses: {
        201: {
          description: "Entrega creada correctamente.",
          ...successResponse(
            schemaRef("Delivery"),
            "Entrega creada correctamente"
          ),
        },

        400: errorResponse(
          "Datos de entrada o repartidor inválido.",
          [
            errors.validation,
            errors.invalidObjectId,
            errors.invalidDriver,
          ]
        ),

        404: errorResponse(
          "Pedido o repartidor no encontrado.",
          [
            errors.orderNotFound,
            errors.driverNotFound,
          ]
        ),

        409: errorResponse(
          "El pedido ya tiene una entrega o no cumple las condiciones necesarias.",
          [
            errors.alreadyExists,
            errors.orderNotEligible,
          ]
        ),

        500: internalError,
      },
    },
  },

  // ==========================================
  // GET /api/deliveries/order/{orderId}
  // ==========================================

  "/api/deliveries/order/{orderId}": {
    parameters: [orderIdParameter],

    get: {
      tags: ["Deliveries"],
      summary: "Obtener entrega por pedido",
      description:
        "Consulta la entrega asociada a un pedido mediante el identificador del pedido.",
      operationId: "getDeliveryByOrderId",

      responses: {
        200: {
          description: "Entrega encontrada.",
          ...successResponse(
            schemaRef("DeliveryPopulated")
          ),
        },

        400: errorResponse(
          "Identificador del pedido inválido.",
          [errors.invalidObjectId]
        ),

        404: errorResponse(
          "No existe una entrega asociada al pedido.",
          [errors.notFound]
        ),

        500: internalError,
      },
    },
  },

  // ==========================================
  // /api/deliveries/{id}
  // ==========================================

  "/api/deliveries/{id}": {
    parameters: [deliveryIdParameter],

    get: {
      tags: ["Deliveries"],
      summary: "Obtener entrega por ID",
      description:
        "Consulta una entrega mediante su identificador, incluyendo las relaciones pobladas.",
      operationId: "getDeliveryById",

      responses: {
        200: {
          description: "Entrega encontrada.",
          ...successResponse(
            schemaRef("DeliveryPopulated")
          ),
        },

        400: errorResponse(
          "Identificador inválido.",
          [errors.invalidObjectId]
        ),

        404: errorResponse(
          "Entrega no encontrada.",
          [errors.notFound]
        ),

        500: internalError,
      },
    },

    patch: {
      tags: ["Deliveries"],
      summary: "Actualizar entrega",
      description: `
        Actualiza los datos permitidos de una entrega.

        Puede modificar:
        - Repartidor asignado.
        - Dirección de entrega.
        - Estado de la entrega.

        Estados disponibles:
        ${Object.values(DELIVERY_STATUS).join(", ")}.

        Las transiciones de estado y la asignación
        de repartidores están sujetas a las
        reglas del servicio.
      `,
      operationId: "updateDelivery",

      requestBody: {
        required: true,
        description:
          "Campos de la entrega que se desean actualizar.",
        content: {
          "application/json": {
            schema: schemaRef("UpdateDeliveryRequest"),
            example: {
              status: DELIVERY_STATUS.ASSIGNED,
              driver: "507f1f77bcf86cd799439012",
            },
          },
        },
      },

      responses: {
        200: {
          description: "Entrega actualizada correctamente.",
          ...successResponse(
            schemaRef("Delivery"),
            "Entrega actualizada correctamente"
          ),
        },

        400: errorResponse(
          "Identificador, datos o repartidor inválidos.",
          [
            errors.invalidObjectId,
            errors.validation,
            errors.invalidDriver,
          ]
        ),

        404: errorResponse(
          "Entrega o repartidor no encontrado.",
          [
            errors.notFound,
            errors.driverNotFound,
          ]
        ),

        409: errorResponse(
          "Transición de estado o condiciones de la entrega incompatibles.",
          [
            errors.invalidTransition,
            errors.orderNotEligible,
          ]
        ),

        500: internalError,
      },
    },

    delete: {
      tags: ["Deliveries"],
      summary: "Eliminar entrega",
      description:
        "Solicita la eliminación de una entrega. El servicio puede rechazar la operación para conservar el historial logístico.",
      operationId: "deleteDelivery",

      responses: {
        200: {
          description:
            "Entrega eliminada si las reglas de negocio lo permiten.",
          ...successResponse(
            null,
            "Entrega eliminada correctamente"
          ),
        },

        400: errorResponse(
          "Identificador inválido.",
          [errors.invalidObjectId]
        ),

        404: errorResponse(
          "Entrega no encontrada.",
          [errors.notFound]
        ),

        409: errorResponse(
          "La entrega no puede eliminarse.",
          [errors.cannotDelete]
        ),

        500: internalError,
      },
    },
  },

  // ==========================================
  // PATCH /api/deliveries/{id}/cancel
  // ==========================================

  "/api/deliveries/{id}/cancel": {
    parameters: [deliveryIdParameter],

    patch: {
      tags: ["Deliveries"],
      summary: "Cancelar entrega",
      description:
        "Solicita la cancelación de una entrega existente. La operación está sujeta a las transiciones de estado permitidas y a las reglas de consistencia con el pedido.",
      operationId: "cancelDelivery",

      responses: {
        200: {
          description: "Entrega cancelada correctamente.",
          ...successResponse(
            schemaRef("Delivery"),
            "Entrega cancelada correctamente"
          ),
        },

        400: errorResponse(
          "Identificador inválido.",
          [errors.invalidObjectId]
        ),

        404: errorResponse(
          "Entrega no encontrada.",
          [errors.notFound]
        ),

        409: errorResponse(
          "La entrega no puede cancelarse desde su estado actual.",
          [errors.invalidTransition]
        ),

        500: internalError,
      },
    },
  },
};

export default deliveryPaths;
