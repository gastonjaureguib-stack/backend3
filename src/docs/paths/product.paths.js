
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

const errorExample = (code, message) => ({
  status: "error",
  code,
  message,
});

const errorResponse = (description, examples) => ({
  description,
  content: {
    "application/json": {
      schema: schemaRef("Error"),
      examples: Object.fromEntries(
        examples.map(({ code, message }) => [
          code,
          {
            summary: code,
            value: errorExample(code, message),
          },
        ])
      ),
    },
  },
});

const internalError = errorResponse(
  "Error interno del servidor.",
  [
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Error interno del servidor",
    },
  ]
);

const invalidObjectId = {
  code: "INVALID_OBJECT_ID",
  message: "El identificador proporcionado no es válido",
};

const validationError = {
  code: "VALIDATION_ERROR",
  message: "Los datos proporcionados no son válidos",
};

const productNotFound = {
  code: "PRODUCT_NOT_FOUND",
  message: "Producto no encontrado",
};

const productIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Identificador MongoDB del producto.",
  schema: schemaRef("ObjectId"),
};

const productPaths = {
  "/api/products": {
    get: {
      tags: ["Products"],
      summary: "Listar productos",
      description:
        "Obtiene los productos registrados. Permite filtrar por categoría y estado.",
      operationId: "getAllProducts",
      parameters: [
        {
          name: "category",
          in: "query",
          required: false,
          description: "Categoría por la que se desea filtrar.",
          schema: {
            type: "string",
          },
          example: "interior",
        },
        {
          name: "status",
          in: "query",
          required: false,
          description:
            "Estado de disponibilidad del producto.",
          schema: {
            type: "string",
            enum: ["available", "out_of_stock"],
          },
        },
      ],
      responses: {
        200: {
          description: "Listado de productos obtenido correctamente.",
          ...successResponse({
            type: "array",
            items: schemaRef("Product"),
          }),
        },
        400: errorResponse(
          "Filtro de estado inválido.",
          [
            {
              code: "INVALID_PRODUCT_STATUS",
              message: "Estado de producto inválido",
            },
          ]
        ),
        500: internalError,
      },
    },

    post: {
      tags: ["Products"],
      summary: "Crear producto",
      description:
        "Registra un producto nuevo. Su estado de disponibilidad se determina a partir del stock.",
      operationId: "createProduct",
      requestBody: {
        required: true,
        description: "Datos del producto que se desea crear.",
        content: jsonContent(
          schemaRef("CreateProductRequest")
        ),
      },
      responses: {
        201: {
          description: "Producto creado correctamente.",
          ...successResponse(
            schemaRef("Product"),
            "Producto creado correctamente"
          ),
        },
        400: errorResponse(
          "Datos de creación inválidos.",
          [validationError]
        ),
        500: internalError,
      },
    },
  },

  "/api/products/{id}": {
    parameters: [productIdParameter],

    get: {
      tags: ["Products"],
      summary: "Obtener producto por ID",
      description:
        "Consulta un producto mediante su identificador MongoDB.",
      operationId: "getProductById",
      responses: {
        200: {
          description: "Producto encontrado.",
          ...successResponse(schemaRef("Product")),
        },
        400: errorResponse(
          "Identificador inválido.",
          [invalidObjectId]
        ),
        404: errorResponse(
          "Producto no encontrado.",
          [productNotFound]
        ),
        500: internalError,
      },
    },

    patch: {
      tags: ["Products"],
      summary: "Actualizar producto",
      description:
        "Modifica los datos generales de un producto. El stock se administra mediante su endpoint específico.",
      operationId: "updateProduct",
      requestBody: {
        required: true,
        description:
          "Campos generales que se desean actualizar.",
        content: jsonContent(
          schemaRef("UpdateProductRequest")
        ),
      },
      responses: {
        200: {
          description: "Producto actualizado correctamente.",
          ...successResponse(
            schemaRef("Product"),
            "Producto actualizado correctamente"
          ),
        },
        400: errorResponse(
          "Identificador o datos de entrada inválidos.",
          [invalidObjectId, validationError]
        ),
        404: errorResponse(
          "Producto no encontrado.",
          [productNotFound]
        ),
        500: internalError,
      },
    },

    delete: {
      tags: ["Products"],
      summary: "Eliminar producto",
      description:
        "Elimina un producto cuando las reglas de integridad del sistema permiten hacerlo.",
      operationId: "deleteProduct",
      responses: {
        200: {
          description: "Producto eliminado correctamente.",
          ...successResponse(
            null,
            "Producto eliminado correctamente"
          ),
        },
        400: errorResponse(
          "Identificador inválido.",
          [invalidObjectId]
        ),
        404: errorResponse(
          "Producto no encontrado.",
          [productNotFound]
        ),
        409: errorResponse(
          "El producto está asociado a pedidos y no puede eliminarse.",
          [
            {
              code: "PRODUCT_IN_USE",
              message:
                "No se puede eliminar un producto asociado a pedidos",
            },
          ]
        ),
        500: internalError,
      },
    },
  },

  "/api/products/{id}/stock": {
    parameters: [productIdParameter],

    patch: {
      tags: ["Products"],
      summary: "Ajustar inventario",
      description:
        "Incrementa o disminuye el stock de un producto mediante un ajuste entero distinto de cero. No permite que el inventario quede negativo.",
      operationId: "adjustProductStock",
      requestBody: {
        required: true,
        description:
          "Cantidad positiva para incrementar stock o negativa para descontarlo.",
        content: jsonContent(
          schemaRef("AdjustProductStockRequest")
        ),
      },
      responses: {
        200: {
          description: "Inventario actualizado correctamente.",
          ...successResponse(
            schemaRef("Product"),
            "Inventario actualizado correctamente"
          ),
        },
        400: errorResponse(
          "Identificador o ajuste de inventario inválido.",
          [invalidObjectId, validationError]
        ),
        404: errorResponse(
          "Producto no encontrado.",
          [productNotFound]
        ),
        409: errorResponse(
          "Conflicto al modificar el inventario.",
          [
            {
              code: "PRODUCT_INSUFFICIENT_STOCK",
              message:
                "Stock insuficiente para realizar la operación",
            },
            {
              code: "PRODUCT_STOCK_CONFLICT",
              message:
                "Conflicto al actualizar el inventario",
            },
          ]
        ),
        500: internalError,
      },
    },
  },
};

export default productPaths;
