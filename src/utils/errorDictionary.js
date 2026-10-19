
const errorDictionary = {
  // =========================================
  // ERRORES GENERALES
  // =========================================

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

  // =========================================
  // ERRORES DE USUARIOS
  // =========================================

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

  // =========================================
  // ERRORES DE PRODUCTOS
  // =========================================

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

  // =========================================
  // ERRORES DE MOCKS
  // =========================================

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

  MOCK_SEED_FAILED: {
    statusCode: 500,
    code: "MOCK_SEED_FAILED",
    message: "Ocurrió un error al guardar los datos simulados en MongoDB",
  },
};

export default errorDictionary;
