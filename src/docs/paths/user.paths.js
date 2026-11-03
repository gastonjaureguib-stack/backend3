
const schemaRef = (name) => ({
  $ref: `#/components/schemas/${name}`,
});

const jsonContent = (schema) => ({
  "application/json": {
    schema,
  },
});

const successResponse = (payloadSchema, message = null) => {
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

const errorResponse = (description, code, message) => ({
  description,
  content: {
    "application/json": {
      schema: schemaRef("Error"),
      example: {
        status: "error",
        code,
        message,
      },
    },
  },
});

const userIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Identificador MongoDB del usuario (24 caracteres hexadecimales).",
  schema: schemaRef("ObjectId"),
};

const userPaths = {
  "/api/users": {
    get: {
      tags: ["Users"],
      summary: "Listar usuarios",
      description:
        "Obtiene todos los usuarios registrados. Las contraseñas no se incluyen en la respuesta.",
      operationId: "getAllUsers",
      responses: {
        200: {
          description: "Usuarios obtenidos correctamente.",
          ...successResponse({
            type: "array",
            items: schemaRef("User"),
          }),
        },
        500: errorResponse(
          "Error interno del servidor.",
          "INTERNAL_SERVER_ERROR",
          "Error interno del servidor"
        ),
      },
    },

    post: {
      tags: ["Users"],
      summary: "Crear usuario",
      description:
        "Registra un usuario nuevo. La contraseña se almacena mediante hash y no se devuelve en la respuesta.",
      operationId: "createUser",
      requestBody: {
        required: true,
        description: "Datos necesarios para registrar un usuario.",
        content: jsonContent(schemaRef("CreateUserRequest")),
      },
      responses: {
        201: {
          description: "Usuario creado correctamente.",
          ...successResponse(
            schemaRef("User"),
            "Usuario creado correctamente"
          ),
        },
        400: errorResponse(
          "Datos de entrada inválidos.",
          "VALIDATION_ERROR",
          "Los datos proporcionados no son válidos"
        ),
        409: errorResponse(
          "El correo electrónico ya está registrado.",
          "EMAIL_ALREADY_EXISTS",
          "El correo electrónico ya está registrado"
        ),
        500: errorResponse(
          "Error interno del servidor.",
          "INTERNAL_SERVER_ERROR",
          "Error interno del servidor"
        ),
      },
    },
  },

  "/api/users/{id}": {
    parameters: [userIdParameter],

    get: {
      tags: ["Users"],
      summary: "Obtener usuario por ID",
      description:
        "Consulta un usuario mediante su identificador MongoDB.",
      operationId: "getUserById",
      responses: {
        200: {
          description: "Usuario encontrado.",
          ...successResponse(schemaRef("User")),
        },
        400: errorResponse(
          "El identificador no tiene un formato válido.",
          "INVALID_OBJECT_ID",
          "El identificador proporcionado no es válido"
        ),
        404: errorResponse(
          "No existe un usuario con el identificador indicado.",
          "USER_NOT_FOUND",
          "Usuario no encontrado"
        ),
        500: errorResponse(
          "Error interno del servidor.",
          "INTERNAL_SERVER_ERROR",
          "Error interno del servidor"
        ),
      },
    },

    patch: {
      tags: ["Users"],
      summary: "Actualizar usuario",
      description:
        "Actualiza los campos permitidos de un usuario existente.",
      operationId: "updateUser",
      requestBody: {
        required: true,
        description: "Campos del usuario que se desean actualizar.",
        content: jsonContent(schemaRef("UpdateUserRequest")),
      },
      responses: {
        200: {
          description: "Usuario actualizado correctamente.",
          ...successResponse(
            schemaRef("User"),
            "Usuario actualizado correctamente"
          ),
        },
        400: errorResponse(
          "Identificador o datos de entrada inválidos.",
          "VALIDATION_ERROR",
          "Los datos proporcionados no son válidos"
        ),
        404: errorResponse(
          "Usuario no encontrado.",
          "USER_NOT_FOUND",
          "Usuario no encontrado"
        ),
        409: errorResponse(
          "El correo electrónico ya está registrado.",
          "EMAIL_ALREADY_EXISTS",
          "El correo electrónico ya está registrado"
        ),
        500: errorResponse(
          "Error interno del servidor.",
          "INTERNAL_SERVER_ERROR",
          "Error interno del servidor"
        ),
      },
    },

    delete: {
      tags: ["Users"],
      summary: "Eliminar usuario",
      description:
        "Elimina un usuario existente mediante su identificador.",
      operationId: "deleteUser",
      responses: {
        200: {
          description: "Usuario eliminado correctamente.",
          ...successResponse(
            null,
            "Usuario eliminado correctamente"
          ),
        },
        400: errorResponse(
          "El identificador no tiene un formato válido.",
          "INVALID_OBJECT_ID",
          "El identificador proporcionado no es válido"
        ),
        404: errorResponse(
          "Usuario no encontrado.",
          "USER_NOT_FOUND",
          "Usuario no encontrado"
        ),
        500: errorResponse(
          "Error interno del servidor.",
          "INTERNAL_SERVER_ERROR",
          "Error interno del servidor"
        ),
      },
    },
  },
};

export default userPaths;
