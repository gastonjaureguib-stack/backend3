
import {
  ORDER_STATUS,
  ORDER_PRIORITY,
} from "../../constants/index.js";

const schemaRef = (name) => ({
  $ref: `#/components/schemas/${name}`,
});

const jsonContent = (schema) => ({
  "application/json": {
    schema,
  },
});

const successResponse = (payloadSchema = null, message = null) => {
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

  orderNotFound: {
    code: "ORDER_NOT_FOUND",
    message: "Pedido no encontrado",
  },

  insufficientStock: {
    code: "ORDER_INSUFFICIENT_STOCK",
    message: "Stock insuficiente para crear el pedido",
  },

  invalidTransition: {
    code: "ORDER_INVALID_STATUS_TRANSITION",
    message: "Transición de estado del pedido no permitida",
  },

  alreadyCancelled: {
    code: "ORDER_ALREADY_CANCELLED",
    message: "El pedido ya está cancelado",
  },

  cannotCancel: {
    code: "ORDER_CANNOT_BE_CANCELLED",
    message: "El pedido no puede cancelarse",
  },

  cannotDelete: {
    code: "ORDER_CANNOT_BE_DELETED",
    message: "El pedido no puede eliminarse",
  },

  deliveryConflict: {
    code: "ORDER_DELIVERY_CONFLICT",
    message: "El pedido tiene un conflicto con su entrega",
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

const orderIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description:
    "Identificador MongoDB del pedido, compuesto por 24 caracteres hexadecimales.",
  schema: schemaRef("ObjectId"),
};

const orderPaths = {
  "/api/orders": {
    get: {
      tags: ["Orders"],
      summary: "Listar pedidos",
      description:
        "Obtiene los pedidos registrados, incluyendo sus relaciones pobladas según la implementación del repositorio.",
      operationId: "getAllOrders",

      responses: {
        200: {
          description: "Pedidos obtenidos correctamente.",
          ...successResponse({
            type: "array",
            items: schemaRef("OrderPopulated"),
          }),
        },

        500: internalError,
      },
    },

    post: {
      tags: ["Orders"],
      summary: "Crear pedido",
      description: `
        Registra un pedido para un usuario existente.

        Reglas principales:
        - Debe incluir al menos un producto.
        - No se permiten productos duplicados.
        - Las cantidades deben ser enteros positivos.
        - El usuario y los productos deben existir.
        - Debe existir stock suficiente.
        - El total es calculado por el servidor.
        - El estado inicial es pending.
        - La prioridad predeterminada es medium.
        - La creación debe respetar las reglas de consistencia del inventario.
      `,
      operationId: "createOrder",

      requestBody: {
        required: true,
        description:
          "Usuario, productos, cantidades y prioridad opcional.",
        content: {
          "application/json": {
            schema: schemaRef("CreateOrderRequest"),
            example: {
              user: "507f1f77bcf86cd799439011",
              products: [
                {
                  product: "507f1f77bcf86cd799439012",
                  quantity: 2,
                },
              ],
              priority: ORDER_PRIORITY.MEDIUM,
            },
          },
        },
      },

      responses: {
        201: {
          description: "Pedido creado correctamente.",
          ...successResponse(
            schemaRef("Order"),
            "Pedido creado correctamente"
          ),
        },

        400: errorResponse(
          "Datos de entrada o identificadores inválidos.",
          [
            errors.validation,
            errors.invalidObjectId,
          ]
        ),

        404: errorResponse(
          "El usuario o alguno de los productos no existe.",
          [
            {
              code: "USER_NOT_FOUND",
              message: "Usuario no encontrado",
            },
            {
              code: "PRODUCT_NOT_FOUND",
              message: "Producto no encontrado",
            },
          ]
        ),

        409: errorResponse(
          "No existe stock suficiente para completar el pedido.",
          [errors.insufficientStock]
        ),

        500: internalError,
      },
    },
  },

  "/api/orders/{id}": {
    parameters: [orderIdParameter],

    get: {
      tags: ["Orders"],
      summary: "Obtener pedido por ID",
      description:
        "Consulta un pedido y sus relaciones pobladas mediante su identificador.",
      operationId: "getOrderById",

      responses: {
        200: {
          description: "Pedido encontrado.",
          ...successResponse(
            schemaRef("OrderPopulated")
          ),
        },

        400: errorResponse(
          "Identificador inválido.",
          [errors.invalidObjectId]
        ),

        404: errorResponse(
          "Pedido no encontrado.",
          [errors.orderNotFound]
        ),

        500: internalError,
      },
    },

    patch: {
      tags: ["Orders"],
      summary: "Actualizar pedido",
      description: `
        Actualiza el estado o la prioridad de un pedido.

        Estados posibles:
        ${Object.values(ORDER_STATUS).join(", ")}.

        Prioridades posibles:
        ${Object.values(ORDER_PRIORITY).join(", ")}.

        Las transiciones de estado están sujetas a
        las reglas del servicio.

        La cancelación puede implicar la restitución
        del inventario y debe respetar la relación
        existente con las entregas.
      `,
      operationId: "updateOrder",

      requestBody: {
        required: true,
        description:
          "Nuevo estado o prioridad del pedido.",
        content: {
          "application/json": {
            schema: schemaRef("UpdateOrderRequest"),
            example: {
              status: ORDER_STATUS.PROCESSING,
              priority: ORDER_PRIORITY.HIGH,
            },
          },
        },
      },

      responses: {
        200: {
          description: "Pedido actualizado correctamente.",
          ...successResponse(
            schemaRef("Order"),
            "Pedido actualizado correctamente"
          ),
        },

        400: errorResponse(
          "Identificador o datos de entrada inválidos.",
          [
            errors.invalidObjectId,
            errors.validation,
          ]
        ),

        404: errorResponse(
          "Pedido no encontrado.",
          [errors.orderNotFound]
        ),

        409: errorResponse(
          "La operación entra en conflicto con el estado del pedido o su entrega.",
          [
            errors.invalidTransition,
            errors.alreadyCancelled,
            errors.cannotCancel,
            errors.deliveryConflict,
          ]
        ),

        500: internalError,
      },
    },

    delete: {
      tags: ["Orders"],
      summary: "Eliminar pedido",
      description:
        "Solicita la eliminación de un pedido. La operación puede ser rechazada por las reglas de conservación del historial y la integridad de las entregas.",
      operationId: "deleteOrder",

      responses: {
        200: {
          description:
            "Pedido eliminado, si las reglas de negocio permiten la operación.",
          ...successResponse(
            null,
            "Pedido eliminado correctamente"
          ),
        },

        400: errorResponse(
          "Identificador inválido.",
          [errors.invalidObjectId]
        ),

        404: errorResponse(
          "Pedido no encontrado.",
          [errors.orderNotFound]
        ),

        409: errorResponse(
          "El pedido no puede eliminarse.",
          [
            errors.cannotDelete,
            errors.deliveryConflict,
          ]
        ),

        500: internalError,
      },
    },
  },
};

export default orderPaths;
