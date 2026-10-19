
# 🌱 ShipNow — Backend III

API REST desarrollada como parte del curso **Backend III de Coderhouse**.

ShipNow simula el backend de una tienda online de plantas y productos de jardinería.

El proyecto utiliza una arquitectura por capas, persistencia en MongoDB, generación de datos simulados y un sistema centralizado de manejo de errores.

---

## 1. Objetivos del proyecto

El proyecto se desarrolla progresivamente mediante tres módulos.

### Módulo 1 — Arquitectura por capas

Implementación de una API REST organizada mediante:

**Controller → Service → Repository**

Funcionalidades:

- CRUD de usuarios.
- CRUD de productos.
- Persistencia en MongoDB.
- Validaciones mediante Zod.
- Configuración de entorno.
- Constantes centralizadas.
- Contraseñas protegidas con bcrypt.

### Módulo 2 — Mocking y carga de datos

Implementación de un sistema de generación de información simulada mediante Faker.

Permite generar:

- Usuarios.
- Repartidores.
- Productos.
- Pedidos.
- Entregas.

Los datos pueden generarse en memoria o persistirse en MongoDB mediante un endpoint de seed.

### Módulo 3 — Manejo profesional de errores

Implementación de un sistema centralizado de errores mediante:

- Clase personalizada `AppError`.
- Diccionario de errores.
- Middleware global de errores.
- Errores específicos del dominio.
- Validaciones HTTP.
- Propagación de errores desde los services.
- Manejo de fallas durante el seed.
- Respuestas HTTP uniformes.

---

## 2. Tecnologías utilizadas

- Node.js
- Express
- MongoDB
- Mongoose
- JavaScript ES Modules
- Zod
- bcrypt
- Faker (`@faker-js/faker`)
- dotenv

---

## 3. Arquitectura

La aplicación utiliza una arquitectura por capas.

```text
Request HTTP
     |
     v
   Routes
     |
     v
 Middlewares
     |
     v
 Controllers
     |
     v
  Services
     |
     v
 Repositories
     |
     v
   Models
     |
     v
  MongoDB
```

### Controllers

Reciben las solicitudes HTTP, ejecutan los services y construyen las respuestas.

No contienen consultas directas a MongoDB ni lógica de negocio.

Los errores se propagan mediante `next(error)`.

### Services

Contienen la lógica de negocio.

Entre sus responsabilidades se encuentran:

- Validar reglas de negocio.
- Evitar usuarios con emails duplicados.
- Determinar el estado de productos según su stock.
- Coordinar la generación de mocks.
- Gestionar la carga de datos simulados.
- Detectar y lanzar errores personalizados.

### Repositories

Realizan las operaciones de persistencia mediante Mongoose.

Permiten separar la lógica de negocio del acceso a MongoDB.

### Middlewares

Se encargan de tareas transversales como:

- Validar datos con Zod.
- Validar identificadores de MongoDB.
- Procesar errores de manera centralizada.

---

## 4. Estructura del proyecto

```text
src/
├── config/
│   └── env.config.js
├── constants/
│   └── index.js
├── controllers/
│   ├── mock.controller.js
│   ├── product.controller.js
│   └── user.controller.js
├── middlewares/
│   ├── error.middleware.js
│   ├── validate.middleware.js
│   └── validateObjectId.middleware.js
├── mocks/
│   ├── delivery.mock.js
│   ├── order.mock.js
│   ├── product.mock.js
│   └── user.mock.js
├── models/
│   ├── delivery.model.js
│   ├── order.model.js
│   ├── product.model.js
│   └── user.model.js
├── repositories/
│   ├── delivery.repository.js
│   ├── order.repository.js
│   ├── product.repository.js
│   └── user.repository.js
├── routes/
│   ├── mock.routes.js
│   ├── product.routes.js
│   └── user.routes.js
├── services/
│   ├── mock.service.js
│   ├── product.service.js
│   └── user.service.js
├── utils/
│   ├── AppError.js
│   └── errorDictionary.js
├── validations/
│   ├── product.validation.js
│   └── user.validation.js
├── app.js
└── server.js
```

---

## 5. Entidades

### Users

Representan usuarios de la aplicación.

Campos principales:

- `firstName`
- `lastName`
- `email`
- `password`
- `role`

Roles:

- `ADMIN`
- `USER`
- `DRIVER`

Las contraseñas se almacenan utilizando bcrypt.

Los endpoints normales de consulta no devuelven la contraseña.

### Products

Representan plantas disponibles en ShipNow.

Campos principales:

- `name`
- `description`
- `category`
- `price`
- `stock`
- `status`

Estados:

- `AVAILABLE`
- `OUT_OF_STOCK`

El estado se determina según el stock:

```text
stock > 0 → available
stock = 0 → out_of_stock
```

### Orders

Representan pedidos realizados por los usuarios.

Campos principales:

- `user`
- `products`
- `status`
- `priority`
- `total`

Estados:

- `PENDING`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

Prioridades:

- `LOW`
- `MEDIUM`
- `HIGH`

Los pedidos mantienen referencias a usuarios y productos.

### Deliveries

Representan las entregas de los pedidos.

Campos principales:

- `order`
- `driver`
- `status`
- `deliveryAddress`

Estados:

- `PENDING`
- `ASSIGNED`
- `IN_TRANSIT`
- `DELIVERED`
- `CANCELLED`

Cada entrega mantiene referencias al pedido y al repartidor correspondiente.

---

## 6. Constantes

Los roles, estados y prioridades están centralizados en:

`src/constants/index.js`

Constantes principales:

- `USER_ROLES`
- `PRODUCT_STATUS`
- `ORDER_STATUS`
- `ORDER_PRIORITY`
- `DELIVERY_STATUS`
- `RESPONSE_STATUS`

Esto evita repetir valores literales y mantiene consistencia entre modelos, services y mocks.

---

## 7. Endpoints de usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Obtener usuarios |
| GET | `/api/users/:id` | Obtener usuario por ID |
| POST | `/api/users` | Crear usuario |
| PATCH | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Ejemplo de creación

**POST /api/users**

```json
{
  "firstName": "Ana",
  "lastName": "Pérez",
  "email": "ana@example.com",
  "password": "12345678"
}
```

El usuario se crea con rol `USER` por defecto.

La contraseña se procesa con bcrypt antes de almacenarse.

---

## 8. Endpoints de productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Obtener productos |
| GET | `/api/products/:id` | Obtener producto por ID |
| POST | `/api/products` | Crear producto |
| PATCH | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |

### Filtros

El listado de productos permite filtrar por:

- `category`
- `status`

Ejemplos:

```http
GET /api/products?category=interior
GET /api/products?status=available
```

### Ejemplo de creación

**POST /api/products**

```json
{
  "name": "Monstera Deliciosa",
  "description": "Planta tropical de interior",
  "category": "interior",
  "price": 850,
  "stock": 5
}
```

El service determina automáticamente el estado del producto según su stock.

---

## 9. Módulo de mocking

El sistema utiliza Faker para generar datos simulados.

Los endpoints GET generan información en memoria y no realizan inserciones en MongoDB.

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/mocks/users` | Generar usuarios |
| GET | `/api/mocks/drivers` | Generar repartidores |
| GET | `/api/mocks/products` | Generar productos |
| GET | `/api/mocks/orders` | Generar pedidos |
| GET | `/api/mocks/deliveries` | Generar entregas |
| POST | `/api/mocks/seed` | Persistir datos simulados |

### Ejemplos

```http
GET /api/mocks/users?qty=5
GET /api/mocks/drivers?qty=5
GET /api/mocks/products?qty=5
GET /api/mocks/orders?qty=5
GET /api/mocks/deliveries?qty=5
```

El parámetro `qty` determina la cantidad de registros generados.

Si no se proporciona, se utiliza un valor predeterminado de 10.

Las cantidades inválidas generan un error HTTP 400.

### Generación de pedidos

Los pedidos simulados utilizan usuarios y productos generados por Faker.

Se seleccionan únicamente productos con stock positivo.

El generador de productos garantiza al menos un producto disponible cuando se genera un lote no vacío.

Cada pedido incluye:

- Usuario.
- Producto.
- Cantidad.
- Estado.
- Prioridad.
- Total.

### Generación de entregas

Las entregas se generan a partir de pedidos y repartidores simulados.

Mantienen las referencias correspondientes mediante ObjectIds.

---

## 10. Seed de MongoDB

El endpoint:

```http
POST /api/mocks/seed?qty=3
```

genera y almacena datos simulados en MongoDB.

No requiere body.

### Orden de persistencia

```text
1. Usuarios
2. Repartidores
3. Productos
4. Pedidos
5. Entregas
```

Los pedidos utilizan los ObjectIds reales de usuarios y productos.

Las entregas utilizan los ObjectIds reales de pedidos y repartidores.

Las contraseñas de los usuarios y repartidores son hasheadas antes de almacenarse.

### Respuesta exitosa

HTTP 201:

```json
{
  "status": "success",
  "message": "Datos de prueba insertados correctamente",
  "payload": {
    "users": 3,
    "drivers": 3,
    "products": 3,
    "orders": 3,
    "deliveries": 3
  }
}
```

### Manejo de errores durante el seed

La función `seedMockData()` utiliza `try/catch` para controlar errores durante la generación y persistencia.

Los errores de dominio identificados se conservan.

Los errores inesperados se registran en la consola del servidor y se convierten en `MOCK_SEED_FAILED`.

**Limitación:** el seed no utiliza transacciones de MongoDB. Si una operación falla después de que otras se completaron, pueden permanecer registros parcialmente insertados.

---

## 11. Módulo 3 — Manejo profesional de errores

ShipNow implementa un sistema centralizado de errores para evitar respuestas inconsistentes y separar la detección de errores de su presentación HTTP.

### Clase AppError

Ubicación:

`src/utils/AppError.js`

La clase `AppError` extiende la clase nativa `Error` de JavaScript.

Permite crear errores personalizados a partir de códigos definidos en el diccionario.

Ejemplo:

```javascript
throw new AppError("USER_NOT_FOUND");
```

También permite especificar un mensaje personalizado:

```javascript
throw new AppError(
  "VALIDATION_ERROR",
  "El email no tiene un formato válido"
);
```

### Diccionario de errores

Ubicación:

`src/utils/errorDictionary.js`

Centraliza:

- Código del error.
- Estado HTTP.
- Mensaje descriptivo.

Esto permite mantener consistencia entre los distintos módulos.

### Errores definidos

| Código | HTTP | Descripción |
|--------|------|-------------|
| `INTERNAL_SERVER_ERROR` | 500 | Error interno inesperado |
| `ROUTE_NOT_FOUND` | 404 | Ruta inexistente |
| `VALIDATION_ERROR` | 400 | Datos inválidos |
| `INVALID_OBJECT_ID` | 400 | Identificador MongoDB inválido |
| `USER_NOT_FOUND` | 404 | Usuario inexistente |
| `EMAIL_ALREADY_EXISTS` | 409 | Email duplicado |
| `PRODUCT_NOT_FOUND` | 404 | Producto inexistente |
| `INVALID_PRODUCT_STATUS` | 400 | Estado de producto inválido |
| `INVALID_MOCK_QUANTITY` | 400 | Cantidad de mocks inválida |
| `MOCK_DATA_REQUIRED` | 400 | Faltan datos para generar pedidos |
| `MOCK_PRODUCT_OUT_OF_STOCK` | 400 | No hay productos disponibles |
| `MOCK_SEED_FAILED` | 500 | Fallo inesperado durante el seed |

### Middleware global

Ubicación:

`src/middlewares/error.middleware.js`

El middleware recibe los errores propagados desde la aplicación.

Distingue entre:

1. Errores personalizados de tipo `AppError`.
2. Errores inesperados del servidor.

Los errores personalizados utilizan el estado HTTP, código y mensaje definidos.

Los errores inesperados devuelven HTTP 500 y no exponen información técnica sensible al cliente.

### Formato uniforme de respuesta

Las respuestas de error utilizan esta estructura:

```json
{
  "status": "error",
  "code": "USER_NOT_FOUND",
  "message": "Usuario no encontrado"
}
```

### Propagación de errores

Los services detectan las situaciones inválidas y lanzan errores.

Los controllers utilizan `next(error)` para propagarlos.

El middleware global construye la respuesta HTTP.

Flujo:

```text
Request
   |
   v
Middleware / Controller
   |
   v
Service
   |
   v
AppError
   |
   v
next(error)
   |
   v
Global Error Middleware
   |
   v
HTTP Response
```

### Validaciones con Zod

Ubicación:

`src/middlewares/validate.middleware.js`

El middleware utiliza `safeParse()` para validar los datos recibidos.

Cuando la validación falla, genera un error `VALIDATION_ERROR` y conserva los mensajes específicos de Zod.

### Validación de ObjectId

Ubicación:

`src/middlewares/validateObjectId.middleware.js`

Comprueba que los identificadores recibidos tengan un formato válido de MongoDB.

Si el identificador es inválido, genera `INVALID_OBJECT_ID`.

### Rutas inexistentes

En `src/app.js` se incorpora un middleware que detecta solicitudes que no coinciden con ninguna ruta registrada.

Estas solicitudes generan `ROUTE_NOT_FOUND`.

El middleware global de errores se registra al final de la configuración de Express.

---

## 12. Pruebas del manejo de errores

Las siguientes pruebas permiten verificar el comportamiento del sistema.

Se pueden realizar desde el navegador, Postman o Thunder Client, según el método HTTP utilizado.

### Prueba 1 — Cantidad negativa

```http
GET /api/mocks/users?qty=-5
```

Resultado esperado: HTTP 400.

```json
{
  "status": "error",
  "code": "INVALID_MOCK_QUANTITY",
  "message": "La cantidad de mocks debe ser un número entero positivo"
}
```

### Prueba 2 — ObjectId inválido

```http
GET /api/products/abc123
```

Resultado esperado: HTTP 400.

```json
{
  "status": "error",
  "code": "INVALID_OBJECT_ID",
  "message": "El ID proporcionado no es válido"
}
```

### Prueba 3 — Producto inexistente

```http
GET /api/products/507f1f77bcf86cd799439011
```

Resultado esperado, si el ID no existe en la base de datos: HTTP 404.

```json
{
  "status": "error",
  "code": "PRODUCT_NOT_FOUND",
  "message": "Producto no encontrado"
}
```

### Prueba 4 — Ruta inexistente

```http
GET /api/ruta-inexistente
```

Resultado esperado: HTTP 404.

```json
{
  "status": "error",
  "code": "ROUTE_NOT_FOUND",
  "message": "Ruta no encontrada"
}
```

### Prueba 5 — Validación de Zod

```http
POST /api/users
Content-Type: application/json
```

Body:

```json
{
  "email": "correo-invalido"
}
```

Resultado esperado: HTTP 400.

La respuesta incluye el código `VALIDATION_ERROR` y los mensajes correspondientes a los campos inválidos.

### Prueba 6 — Generación de pedidos

```http
GET /api/mocks/orders?qty=10
```

Resultado esperado: HTTP 200.

La respuesta debe contener diez pedidos simulados.

### Prueba 7 — Generación de entregas

```http
GET /api/mocks/deliveries?qty=10
```

Resultado esperado: HTTP 200.

La respuesta debe contener diez entregas simuladas.

### Prueba 8 — Persistencia en MongoDB

```http
POST /api/mocks/seed?qty=3
```

Resultado esperado: HTTP 201.

Se generan y almacenan tres usuarios, tres repartidores, tres productos, tres pedidos y tres entregas.

**Advertencia:** esta prueba inserta registros reales en la base de datos configurada.

### Prueba 9 — Falla del seed

Código esperado ante una falla inesperada durante la generación o persistencia:

`MOCK_SEED_FAILED`

Estado HTTP esperado: 500.

Esta prueba requiere simular una falla de forma controlada y verificar el resultado. No se considera validada únicamente por el éxito del seed.

---

## 13. Configuración de entorno

La configuración se centraliza en:

`src/config/env.config.js`

Variables utilizadas:

- `PORT`
- `MONGODB_URI`
- `NODE_ENV`

El proyecto incluye un archivo `.env.example`.

Ejemplo de configuración local:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/shipnow
NODE_ENV=development
```

El archivo `.env` real no debe publicarse en el repositorio.

---

## 14. Instalación y ejecución

### Clonar el repositorio

```bash
git clone https://github.com/gastonjaureguib-stack/backend3.git
```

### Entrar al proyecto

```bash
cd backend3
```

### Instalar dependencias

```bash
npm install
```

### Configurar variables de entorno

Crear un archivo `.env` a partir de `.env.example` y completar los valores correspondientes.

Es necesario contar con una instancia de MongoDB accesible mediante `MONGODB_URI`.

### Iniciar el servidor

```bash
npm run dev
```

Con `PORT=8080`, la API estará disponible en:

```text
http://localhost:8080
```

---

## 15. Pruebas realizadas

Durante el desarrollo del Módulo 3 se verificaron los siguientes escenarios:

| Prueba | Resultado |
|--------|-----------|
| Cantidad negativa de mocks | Exitosa |
| ObjectId inválido | Exitosa |
| Producto inexistente | Exitosa |
| Ruta inexistente | Exitosa |
| Validación de Zod | Exitosa |
| Generación de pedidos | Exitosa |
| Generación de entregas | Exitosa |
| Persistencia mediante seed | Exitosa |
| Falla inesperada durante el seed | Pendiente |

Las pruebas realizadas confirmaron el funcionamiento de los principales mecanismos de validación, propagación de errores y generación de datos.

---

## 16. Estado del proyecto

### Módulo 1

- Arquitectura por capas implementada.
- CRUD de usuarios.
- CRUD de productos.
- Validaciones con Zod.
- Configuración de entorno centralizada.
- Constantes de dominio.
- Persistencia con MongoDB.
- Contraseñas protegidas con bcrypt.

### Módulo 2

- Generación de mocks mediante Faker.
- Usuarios y repartidores simulados.
- Productos simulados.
- Pedidos y entregas simulados.
- Generación sin persistencia.
- Seed con persistencia en MongoDB.
- Relaciones entre entidades.
- Corrección de disponibilidad de productos para generación de pedidos.

### Módulo 3

- Clase personalizada `AppError`.
- Diccionario centralizado de errores.
- Middleware global de errores.
- Manejo de errores de usuarios.
- Manejo de errores de productos.
- Validación de cantidades de mocks.
- Validación de ObjectIds.
- Integración con Zod.
- Manejo de rutas inexistentes.
- Manejo de errores inesperados.
- Manejo controlado de fallas del seed.
- Respuestas HTTP uniformes.
- Pruebas de validación y propagación de errores.

---

## 17. Repositorio

GitHub:

https://github.com/gastonjaureguib-stack/backend3

---

**Proyecto académico desarrollado para Backend III — Coderhouse.**
