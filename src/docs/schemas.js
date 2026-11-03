
import {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  RESPONSE_STATUS,
} from "../constants/index.js";

// ============================================
// SCHEMAS REUTILIZABLES DE SHIPNOW
// OPENAPI 3.0.3
// ============================================

const reference = (name) => ({
  $ref: `#/components/schemas/${name}`,
});

const objectId = {
  type: "string",
  pattern: "^[a-fA-F0-9]{24}$",
  example: "507f1f77bcf86cd799439011",
};

const timestamp = {
  type: "string",
  format: "date-time",
  readOnly: true,
  example: "2026-11-03T12:00:00.000Z",
};

const userProperties = {
  firstName: {
    type: "string",
    minLength: 2,
    maxLength: 50,
    example: "Ana",
  },
  lastName: {
    type: "string",
    minLength: 2,
    maxLength: 50,
    example: "García",
  },
  email: {
    type: "string",
    format: "email",
    example: "ana@example.com",
  },
};

const productProperties = {
  name: {
    type: "string",
    minLength: 2,
    maxLength: 100,
    example: "Monstera Deliciosa",
  },
  description: {
    type: "string",
    minLength: 5,
    maxLength: 500,
    example: "Planta tropical ideal para interiores.",
  },
  category: {
    type: "string",
    minLength: 2,
    maxLength: 50,
    example: "interior",
  },
  price: {
    type: "number",
    minimum: 0,
    example: 1250,
  },
};

const deliveryAddress = {
  type: "string",
  minLength: 5,
  maxLength: 250,
  example: "Av. Principal 123, Montevideo",
};

const schemas = {
  // ==========================================
  // TIPOS COMPARTIDOS
  // ==========================================

  ObjectId: objectId,

  // ==========================================
  // USERS
  // ==========================================

  User: {
    type: "object",
    required: [
      "_id",
      "firstName",
      "lastName",
      "email",
      "role",
    ],
    properties: {
      _id: reference("ObjectId"),
      ...userProperties,
      role: {
        type: "string",
        enum: Object.values(USER_ROLES),
        example: USER_ROLES.USER,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  UserSummary: {
    type: "object",
    required: [
      "_id",
      "firstName",
      "lastName",
      "email",
      "role",
    ],
    properties: {
      _id: reference("ObjectId"),
      firstName: userProperties.firstName,
      lastName: userProperties.lastName,
      email: userProperties.email,
      role: {
        type: "string",
        enum: Object.values(USER_ROLES),
      },
    },
  },

  CreateUserRequest: {
    type: "object",
    additionalProperties: false,
    required: [
      "firstName",
      "lastName",
      "email",
      "password",
    ],
    properties: {
      ...userProperties,
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        maxLength: 100,
        writeOnly: true,
        example: "ClaveSegura123",
      },
    },
  },

  UpdateUserRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      ...userProperties,
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        maxLength: 100,
        writeOnly: true,
      },
    },
  },

  // ==========================================
  // PRODUCTS
  // ==========================================

  Product: {
    type: "object",
    required: [
      "_id",
      "name",
      "description",
      "category",
      "price",
      "stock",
      "status",
    ],
    properties: {
      _id: reference("ObjectId"),
      ...productProperties,
      stock: {
        type: "integer",
        minimum: 0,
        maximum: Number.MAX_SAFE_INTEGER,
        example: 15,
      },
      status: {
        type: "string",
        enum: Object.values(PRODUCT_STATUS),
        example: PRODUCT_STATUS.AVAILABLE,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  ProductSummary: {
    type: "object",
    properties: {
      _id: reference("ObjectId"),
      name: productProperties.name,
      category: productProperties.category,
      price: productProperties.price,
    },
  },

  CreateProductRequest: {
    type: "object",
    additionalProperties: false,
    required: [
      "name",
      "description",
      "category",
      "price",
      "stock",
    ],
    properties: {
      ...productProperties,
      stock: {
        type: "integer",
        minimum: 0,
        maximum: Number.MAX_SAFE_INTEGER,
        example: 15,
      },
    },
  },

  UpdateProductRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: productProperties,
  },

  AdjustProductStockRequest: {
    type: "object",
    additionalProperties: false,
    required: ["adjustment"],
    properties: {
      adjustment: {
        type: "integer",
        minimum: -Number.MAX_SAFE_INTEGER,
        maximum: Number.MAX_SAFE_INTEGER,
        not: {
          enum: [0],
        },
        example: 5,
        description:
          "Valor positivo para ingresar stock o negativo para descontarlo. No admite cero.",
      },
    },
  },

  // ==========================================
  // ORDER ITEMS
  // ==========================================

  OrderItem: {
    type: "object",
    required: ["product", "quantity"],
    properties: {
      product: reference("ObjectId"),
      quantity: {
        type: "integer",
        minimum: 1,
        maximum: Number.MAX_SAFE_INTEGER,
        example: 2,
      },
    },
  },

  OrderItemPopulated: {
    type: "object",
    required: ["product", "quantity"],
    properties: {
      product: {
        allOf: [reference("ProductSummary")],
        nullable: true,
      },
      quantity: {
        type: "integer",
        minimum: 1,
      },
    },
  },

  // ==========================================
  // ORDERS
  // ==========================================

  Order: {
    type: "object",
    required: [
      "_id",
      "user",
      "products",
      "status",
      "priority",
      "total",
    ],
    properties: {
      _id: reference("ObjectId"),
      user: reference("ObjectId"),
      products: {
        type: "array",
        minItems: 1,
        items: reference("OrderItem"),
      },
      status: {
        type: "string",
        enum: Object.values(ORDER_STATUS),
        example: ORDER_STATUS.PENDING,
      },
      priority: {
        type: "string",
        enum: Object.values(ORDER_PRIORITY),
        example: ORDER_PRIORITY.MEDIUM,
      },
      total: {
        type: "number",
        minimum: 0,
        example: 2500,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  OrderPopulated: {
    type: "object",
    required: [
      "_id",
      "user",
      "products",
      "status",
      "priority",
      "total",
    ],
    properties: {
      _id: reference("ObjectId"),
      user: {
        allOf: [reference("UserSummary")],
        nullable: true,
      },
      products: {
        type: "array",
        minItems: 1,
        items: reference("OrderItemPopulated"),
      },
      status: {
        type: "string",
        enum: Object.values(ORDER_STATUS),
      },
      priority: {
        type: "string",
        enum: Object.values(ORDER_PRIORITY),
      },
      total: {
        type: "number",
        minimum: 0,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  CreateOrderRequest: {
    type: "object",
    additionalProperties: false,
    required: ["user", "products"],
    properties: {
      user: reference("ObjectId"),
      products: {
        type: "array",
        minItems: 1,
        uniqueItems: false,
        description:
          "No se permite repetir un mismo producto en el pedido.",
        items: reference("OrderItem"),
      },
      priority: {
        type: "string",
        enum: Object.values(ORDER_PRIORITY),
        default: ORDER_PRIORITY.MEDIUM,
      },
    },
  },

  UpdateOrderRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      status: {
        type: "string",
        enum: Object.values(ORDER_STATUS),
        description:
          "La transición solicitada debe cumplir las reglas de negocio.",
      },
      priority: {
        type: "string",
        enum: Object.values(ORDER_PRIORITY),
      },
    },
  },

  // ==========================================
  // DELIVERIES
  // ==========================================

  Delivery: {
    type: "object",
    required: [
      "_id",
      "order",
      "status",
      "deliveryAddress",
    ],
    properties: {
      _id: reference("ObjectId"),
      order: reference("ObjectId"),
      driver: {
        ...objectId,
        nullable: true,
      },
      status: {
        type: "string",
        enum: Object.values(DELIVERY_STATUS),
        example: DELIVERY_STATUS.PENDING,
      },
      deliveryAddress,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  DeliveryPopulated: {
    type: "object",
    required: [
      "_id",
      "order",
      "status",
      "deliveryAddress",
    ],
    properties: {
      _id: reference("ObjectId"),
      order: {
        allOf: [reference("Order")],
        nullable: true,
      },
      driver: {
        allOf: [reference("UserSummary")],
        nullable: true,
      },
      status: {
        type: "string",
        enum: Object.values(DELIVERY_STATUS),
      },
      deliveryAddress,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  CreateDeliveryRequest: {
    type: "object",
    additionalProperties: false,
    required: ["order", "deliveryAddress"],
    properties: {
      order: reference("ObjectId"),
      driver: {
        ...objectId,
        nullable: true,
      },
      deliveryAddress,
    },
  },

  UpdateDeliveryRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      driver: {
        ...objectId,
        nullable: true,
      },
      status: {
        type: "string",
        enum: Object.values(DELIVERY_STATUS),
      },
      deliveryAddress,
    },
  },

  // ==========================================
  // RESPUESTAS ESTANDARIZADAS
  // ==========================================

  Error: {
    type: "object",
    required: ["status", "code", "message"],
    properties: {
      status: {
        type: "string",
        enum: [RESPONSE_STATUS.ERROR],
        example: RESPONSE_STATUS.ERROR,
      },
      code: {
        type: "string",
        example: "PRODUCT_NOT_FOUND",
      },
      message: {
        type: "string",
        example: "Producto no encontrado",
      },
    },
  },

  Success: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: [RESPONSE_STATUS.SUCCESS],
        example: RESPONSE_STATUS.SUCCESS,
      },
      message: {
        type: "string",
        example: "Operación realizada correctamente",
      },
      payload: {
        description:
          "Datos devueltos por la operación. Su estructura depende del endpoint.",
      },
    },
  },
};

export default schemas;
