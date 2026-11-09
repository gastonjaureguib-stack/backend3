
const errorDictionary = {
  // Errores generales

  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Error interno del servidor",
  },

  ROUTE_NOT_FOUND: {
    statusCode: 404,
    code: "ROUTE_NOT_FOUND",
    message: "Ruta no encontrada",
  },

  VALIDATION_ERROR: {
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: "Los datos enviados no son válidos",
  },

  INVALID_OBJECT_ID: {
    statusCode: 400,
    code: "INVALID_OBJECT_ID",
    message: "El ID proporcionado no es válido",
  },

  // Errores de usuarios

  USER_NOT_FOUND: {
    statusCode: 404,
    code: "USER_NOT_FOUND",
    message: "Usuario no encontrado",
  },

  EMAIL_ALREADY_EXISTS: {
    statusCode: 409,
    code: "EMAIL_ALREADY_EXISTS",
    message: "Ya existe un usuario con ese email",
  },

  // Errores de productos

  PRODUCT_NOT_FOUND: {
    statusCode: 404,
    code: "PRODUCT_NOT_FOUND",
    message: "Producto no encontrado",
  },

  INVALID_PRODUCT_STATUS: {
    statusCode: 400,
    code: "INVALID_PRODUCT_STATUS",
    message: "Estado de producto inválido",
  },

  PRODUCT_INSUFFICIENT_STOCK: {
    statusCode: 409,
    code: "PRODUCT_INSUFFICIENT_STOCK",
    message: "Stock insuficiente para realizar el ajuste",
  },

  PRODUCT_IN_USE: {
    statusCode: 409,
    code: "PRODUCT_IN_USE",
    message: "No se puede eliminar un producto asociado a pedidos",
  },

  PRODUCT_STOCK_CONFLICT: {
    statusCode: 409,
    code: "PRODUCT_STOCK_CONFLICT",
    message: "No se pudo completar el ajuste de inventario por un conflicto",
  },

  // Errores de pedidos

  ORDER_NOT_FOUND: {
    statusCode: 404,
    code: "ORDER_NOT_FOUND",
    message: "Pedido no encontrado",
  },

  ORDER_INSUFFICIENT_STOCK: {
    statusCode: 409,
    code: "ORDER_INSUFFICIENT_STOCK",
    message: "Stock insuficiente para completar el pedido",
  },

  ORDER_INVALID_STATUS_TRANSITION: {
    statusCode: 409,
    code: "ORDER_INVALID_STATUS_TRANSITION",
    message: "La transición de estado del pedido no está permitida",
  },

  ORDER_ALREADY_CANCELLED: {
    statusCode: 409,
    code: "ORDER_ALREADY_CANCELLED",
    message: "El pedido ya se encuentra cancelado",
  },

  ORDER_CANNOT_BE_CANCELLED: {
    statusCode: 409,
    code: "ORDER_CANNOT_BE_CANCELLED",
    message: "El pedido no puede cancelarse en su estado actual",
  },

  ORDER_CANNOT_BE_DELETED: {
    statusCode: 409,
    code: "ORDER_CANNOT_BE_DELETED",
    message: "El pedido no puede eliminarse porque debe conservarse su historial",
  },

  ORDER_DELIVERY_CONFLICT: {
    statusCode: 409,
    code: "ORDER_DELIVERY_CONFLICT",
    message: "La operación del pedido entra en conflicto con su entrega",
  },

  // Errores de entregas

  DELIVERY_NOT_FOUND: {
    statusCode: 404,
    code: "DELIVERY_NOT_FOUND",
    message: "Entrega no encontrada",
  },

  DELIVERY_ALREADY_EXISTS: {
    statusCode: 409,
    code: "DELIVERY_ALREADY_EXISTS",
    message: "Ya existe una entrega asociada a este pedido",
  },

  DELIVERY_INVALID_STATUS_TRANSITION: {
    statusCode: 409,
    code: "DELIVERY_INVALID_STATUS_TRANSITION",
    message: "La transición de estado de la entrega no está permitida",
  },

  DELIVERY_INVALID_DRIVER: {
    statusCode: 400,
    code: "DELIVERY_INVALID_DRIVER",
    message: "El usuario asignado no es un repartidor válido",
  },

  DELIVERY_DRIVER_NOT_FOUND: {
    statusCode: 404,
    code: "DELIVERY_DRIVER_NOT_FOUND",
    message: "Repartidor no encontrado",
  },

  DELIVERY_ORDER_NOT_ELIGIBLE: {
    statusCode: 409,
    code: "DELIVERY_ORDER_NOT_ELIGIBLE",
    message: "El pedido no cumple las condiciones para generar o actualizar una entrega",
  },

  DELIVERY_CANNOT_BE_DELETED: {
    statusCode: 409,
    code: "DELIVERY_CANNOT_BE_DELETED",
    message: "La entrega no puede eliminarse porque debe conservarse su historial",
  },

  // Errores de mocks

  INVALID_MOCK_QUANTITY: {
    statusCode: 400,
    code: "INVALID_MOCK_QUANTITY",
    message: "La cantidad de mocks debe ser un número entero positivo",
  },

  MOCK_DATA_REQUIRED: {
    statusCode: 400,
    code: "MOCK_DATA_REQUIRED",
    message: "Se necesitan usuarios y productos para generar pedidos simulados",
  },

  MOCK_PRODUCT_OUT_OF_STOCK: {
    statusCode: 400,
    code: "MOCK_PRODUCT_OUT_OF_STOCK",
    message: "Se necesita al menos un producto con stock para generar pedidos",
  },

  MOCK_ORDERS_REQUIRED: {
    statusCode: 400,
    code: "MOCK_ORDERS_REQUIRED",
    message: "Se necesitan pedidos para generar entregas simuladas",
  },

  MOCK_DRIVERS_REQUIRED: {
    statusCode: 400,
    code: "MOCK_DRIVERS_REQUIRED",
    message: "Se necesita al menos un repartidor para generar entregas simuladas",
  },

  MOCK_INSUFFICIENT_ORDERS: {
    statusCode: 400,
    code: "MOCK_INSUFFICIENT_ORDERS",
    message: "No se pueden generar más entregas que pedidos disponibles",
  },

  MOCK_SEED_FAILED: {
    statusCode: 500,
    code: "MOCK_SEED_FAILED",
    message: "Ocurrió un error al guardar los datos simulados en MongoDB",
  },
};

export default errorDictionary;
