
import { RESPONSE_STATUS } from "../../constants/index.js";

// ============================================
// DOCUMENTACIÓN OPENAPI - MOCKS
// ============================================

const schemaRef = (name) => ({
  $ref: `#/components/schemas/${name}`,
});

// ============================================
// PARÁMETRO COMPARTIDO
// ============================================

const quantityParameter = {
  name: "qty",
  in: "query",
  required: false,
  description:
    "Cantidad de registros simulados que se desea generar. Si se omite, el servicio utiliza su valor predeterminado.",
  schema: {
    type: "integer",
    minimum: 1,
    default: 10,
  },
  example: 5,
};

// ============================================
// RESPUESTAS EXITOSAS
// ============================================

const mockListResponse = (itemSchema, description) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["status", "quantity", "payload"],
        properties: {
          status: {
            type: "string",
            enum: [RESPONSE_STATUS.SUCCESS],
          },
          quantity: {
            type: "integer",
            minimum: 0,
            example: 5,
          },
          payload: {
            type: "array",
            items: itemSchema,
          },
        },
      },
    },
  },
});

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
              status: RESPONSE_STATUS.ERROR,
              code,
              message,
            },
          },
        ])
      ),
    },
  },
});

const invalidQuantity = {
  code: "INVALID_MOCK_QUANTITY",
  message: "La cantidad solicitada no es válida",
};

const internalError = errorResponse(
  "Error interno del servidor.",
  [
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Error interno del servidor",
    },
  ]
);

const quantityError = errorResponse(
  "Cantidad de registros inválida.",
  [invalidQuantity]
);

// ============================================
// SCHEMAS DE DATOS SIMULADOS
// ============================================

// Los mocks no necesariamente tienen la misma
// estructura que los documentos persistidos.
// Estos schemas describen los campos conocidos
// sin exigir propiedades que no se verificaron
// todavía contra los generadores.

const mockUser = {
  type: "object",
  description: "Usuario generado para pruebas.",
  additionalProperties: true,
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string", format: "email" },
    role: { type: "string" },
  },
};

const mockDriver = {
  type: "object",
  description: "Repartidor generado para pruebas.",
  additionalProperties: true,
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string", format: "email" },
    role: {
      type: "string",
      example: "driver",
    },
  },
};

const mockProduct = {
  type: "object",
  description: "Producto simulado.",
  additionalProperties: true,
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    category: { type: "string" },
    price: { type: "number", minimum: 0 },
    stock: { type: "integer", minimum: 0 },
    status: { type: "string" },
  },
};

const mockOrder = {
  type: "object",
  description: "Pedido simulado.",
  additionalProperties: true,
  properties: {
    user: { type: "string" },
    products: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
    status: { type: "string" },
    priority: { type: "string" },
    total: { type: "number" },
  },
};

const mockDelivery = {
  type: "object",
  description: "Entrega simulada.",
  additionalProperties: true,
  properties: {
    order: { type: "string" },
    driver: {
      type: "string",
      nullable: true,
    },
    status: { type: "string" },
    deliveryAddress: { type: "string" },
  },
};

// ============================================
// UTILIDAD PARA GENERADORES GET
// ============================================

const mockGetOperation = ({
  summary,
  description,
  operationId,
  itemSchema,
}) => ({
  tags: ["Mocks"],
  summary,
  description,
  operationId,
  parameters: [quantityParameter],
  responses: {
    200: mockListResponse(
      itemSchema,
      "Datos simulados generados correctamente."
    ),
    400: quantityError,
    500: internalError,
  },
});

// ============================================
// ENDPOINTS
// ============================================

const mockPaths = {
  "/api/mocks/users": {
    get: mockGetOperation({
      summary: "Generar usuarios simulados",
      description:
        "Genera usuarios de prueba sin insertarlos en la base de datos.",
      operationId: "getMockUsers",
      itemSchema: mockUser,
    }),
  },

  "/api/mocks/drivers": {
    get: mockGetOperation({
      summary: "Generar repartidores simulados",
      description:
        "Genera usuarios con rol de repartidor sin persistirlos.",
      operationId: "getMockDrivers",
      itemSchema: mockDriver,
    }),
  },

  "/api/mocks/products": {
    get: mockGetOperation({
      summary: "Generar productos simulados",
      description:
        "Genera productos de prueba sin insertarlos en MongoDB.",
      operationId: "getMockProducts",
      itemSchema: mockProduct,
    }),
  },

  "/api/mocks/orders": {
    get: mockGetOperation({
      summary: "Generar pedidos simulados",
      description:
        "Genera pedidos de prueba. Los datos devueltos no se persisten.",
      operationId: "getMockOrders",
      itemSchema: mockOrder,
    }),
  },

  "/api/mocks/deliveries": {
    get: mockGetOperation({
      summary: "Generar entregas simuladas",
      description:
        "Genera entregas de prueba sin insertarlas en MongoDB.",
      operationId: "getMockDeliveries",
      itemSchema: mockDelivery,
    }),
  },

  "/api/mocks/seed": {
    post: {
      tags: ["Mocks"],
      summary: "Insertar datos simulados",
      description: `
        Genera e inserta datos de prueba en MongoDB.

        Puede crear usuarios, repartidores, productos,
        pedidos y entregas relacionados.

        ADVERTENCIA:
        Esta operación modifica la base de datos.
        Utilizar únicamente en un entorno de pruebas.

        El resultado depende de las validaciones
        y restricciones implementadas en el servicio.
      `,
      operationId: "seedMockData",
      parameters: [quantityParameter],

      responses: {
        201: {
          description:
            "Datos de prueba insertados correctamente.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "status",
                  "message",
                  "payload",
                ],
                properties: {
                  status: {
                    type: "string",
                    enum: [RESPONSE_STATUS.SUCCESS],
                  },
                  message: {
                    type: "string",
                    example:
                      "Datos de prueba insertados correctamente",
                  },
                  payload: {
                    type: "object",
                    description:
                      "Resultado de la inserción, organizado por tipo de entidad.",
                    properties: {
                      users: {
                        type: "array",
                        items: schemaRef("User"),
                      },
                      drivers: {
                        type: "array",
                        items: schemaRef("User"),
                      },
                      products: {
                        type: "array",
                        items: schemaRef("Product"),
                      },
                      orders: {
                        type: "array",
                        items: schemaRef("Order"),
                      },
                      deliveries: {
                        type: "array",
                        items: schemaRef("Delivery"),
                      },
                    },
                  },
                },
              },
            },
          },
        },

        400: errorResponse(
          "Cantidad inválida o datos insuficientes para generar los registros.",
          [
            invalidQuantity,
            {
              code: "MOCK_DATA_REQUIRED",
              message:
                "Se requieren datos para generar los registros",
            },
            {
              code: "MOCK_PRODUCT_OUT_OF_STOCK",
              message:
                "No hay stock suficiente para generar el pedido",
            },
            {
              code: "MOCK_ORDERS_REQUIRED",
              message:
                "Se requieren pedidos para generar entregas",
            },
            {
              code: "MOCK_DRIVERS_REQUIRED",
              message:
                "Se requieren repartidores para generar entregas",
            },
            {
              code: "MOCK_INSUFFICIENT_ORDERS",
              message:
                "No hay pedidos suficientes para generar entregas",
            },
          ]
        ),

        500: errorResponse(
          "Error interno o fallo al insertar datos simulados.",
          [
            {
              code: "MOCK_SEED_FAILED",
              message:
                "No fue posible insertar los datos simulados",
            },
            {
              code: "INTERNAL_SERVER_ERROR",
              message: "Error interno del servidor",
            },
          ]
        ),
      },
    },
  },
};

export default mockPaths;
