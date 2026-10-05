# 🌱 ShipNow - Backend III

API REST desarrollada como parte del curso **Backend III de Coderhouse**.

ShipNow se plantea como una tienda online de plantas y productos relacionados con jardinería. El proyecto utiliza una arquitectura profesional por capas y se amplía progresivamente durante el curso.

---

# Pre-entrega Módulo 1 — Arquitectura por capas

El objetivo de la primera etapa fue refactorizar la API utilizando una arquitectura de tres capas:

**Controller → Service → Repository**

La aplicación separa las responsabilidades HTTP, la lógica de negocio y el acceso a MongoDB para obtener un código organizado, mantenible y escalable.

---

# Pre-entrega Módulo 2 — Mocking y carga de datos

En el segundo módulo se incorporó un sistema de **mocking** que permite generar datos simulados para probar la aplicación sin depender de información cargada manualmente.

El módulo permite generar:

- Usuarios.
- Repartidores.
- Productos (plantas).
- Pedidos.
- Entregas.

Los datos simulados respetan los modelos y constantes reales del proyecto.

También se mantienen las relaciones entre las entidades:

```text
Usuario
   ↓
Pedido ← Producto
   ↓
Entrega
   ↓
Repartidor
```

Los endpoints `GET /api/mocks/...` generan información únicamente en memoria y **no la almacenan en MongoDB**.

El endpoint `POST /api/mocks/seed` genera los datos y los **persiste en MongoDB**, manteniendo las relaciones mediante ObjectIds reales.

---

# Tecnologías utilizadas

- Node.js
- Express
- MongoDB
- Mongoose
- dotenv
- Zod
- bcrypt
- Faker (`@faker-js/faker`)

---

# Arquitectura

El proyecto utiliza el siguiente flujo general:

```text
Request
   ↓
Routes
   ↓
Middlewares
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
Model
   ↓
MongoDB
```

## Controller

Es la puerta de entrada HTTP.

Su responsabilidad es recibir `req`, extraer los datos necesarios, llamar al Service y construir la respuesta HTTP correspondiente.

Los Controllers no realizan consultas directas a MongoDB ni contienen lógica de negocio.

## Service

Contiene la lógica de negocio de la aplicación.

Por ejemplo:

- Determinar el estado de un producto según su stock.
- Evitar la creación de usuarios con emails ya registrados.
- Procesar contraseñas antes de almacenarlas.
- Controlar filtros permitidos para productos.
- Coordinar la generación y carga de datos simulados.
- Mantener las relaciones entre usuarios, productos, pedidos, entregas y repartidores durante el seed.

El Service no realiza consultas directamente mediante Mongoose. Para acceder a los datos utiliza los Repositories.

## Repository

Es la capa encargada del acceso a datos.

Es el único lugar de cada entidad donde se realizan operaciones mediante los modelos de Mongoose, como búsquedas, creación, actualización, eliminación y carga masiva.

De esta manera, la lógica de negocio queda separada de la forma en que los datos son almacenados.

---

# Estructura del proyecto

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
│   └── AppError.js
├── validations/
│   ├── product.validation.js
│   └── user.validation.js
├── app.js
└── server.js
```

---

# Entidades

## Products

Los productos representan las plantas disponibles en ShipNow.

Campos principales:

- `name`
- `description`
- `category`
- `price`
- `stock`
- `status`

Los estados se encuentran centralizados mediante constantes:

```text
AVAILABLE
OUT_OF_STOCK
```

El estado se determina a partir del stock:

```text
stock > 0 → available
stock = 0 → out_of_stock
```

Los mocks de productos mantienen el dominio de ShipNow generando plantas y categorías relacionadas con jardinería.

---

## Users

Los usuarios contienen:

- `firstName`
- `lastName`
- `email`
- `password`
- `role`

Los roles se encuentran centralizados mediante constantes:

```text
ADMIN
USER
DRIVER
```

`DRIVER` representa a los usuarios que cumplen el rol de repartidores.

Además:

- El email debe ser único.
- Las contraseñas se almacenan utilizando bcrypt.
- La contraseña no se devuelve en los endpoints normales de consulta.
- Las contraseñas generadas durante el seed también son hasheadas antes de persistirse.

---

## Orders

Los pedidos representan compras de plantas realizadas por los usuarios.

Campos principales:

- `user`
- `products`
- `status`
- `priority`
- `total`

Cada pedido mantiene una referencia al usuario que realizó la compra y a los productos incluidos.

Los estados y prioridades permitidos se encuentran centralizados en constantes.

Estados:

```text
PENDING
PROCESSING
SHIPPED
DELIVERED
CANCELLED
```

Prioridades:

```text
LOW
MEDIUM
HIGH
```

El total del pedido se calcula a partir del precio del producto y la cantidad simulada.

---

## Deliveries

Las entregas representan el envío de los pedidos.

Campos principales:

- `order`
- `driver`
- `status`
- `deliveryAddress`

Cada entrega se relaciona con un pedido y con un usuario cuyo rol es `DRIVER`.

Estados:

```text
PENDING
ASSIGNED
IN_TRANSIT
DELIVERED
CANCELLED
```

Un pedido puede tener una única entrega.

---

# Constantes

Los valores utilizados para roles, estados, prioridades y estados de respuesta se encuentran centralizados en:

```text
src/constants/index.js
```

Se utilizan constantes para evitar literales repetidos y mantener consistencia entre modelos, servicios, mocks y controladores.

Entre ellas:

```text
USER_ROLES
PRODUCT_STATUS
ORDER_STATUS
ORDER_PRIORITY
DELIVERY_STATUS
RESPONSE_STATUS
```

---

# Mocking

El módulo de mocking utiliza **Faker** para generar información ficticia.

Los generadores se encuentran en:

```text
src/mocks/
```

Los mocks permiten trabajar de dos maneras.

## Generación sin persistencia

Los endpoints `GET` generan datos simulados en memoria.

Estos datos se devuelven en la respuesta HTTP pero **no son insertados en MongoDB**.

Los pedidos y entregas utilizan ObjectIds simulados para conservar una estructura equivalente a los documentos reales.

## Seed con persistencia

El endpoint:

```http
POST /api/mocks/seed
```

genera e inserta registros en MongoDB.

La carga se realiza en un orden que permite conservar las relaciones:

```text
1. Usuarios
2. Repartidores
3. Productos
4. Pedidos
5. Entregas
```

Primero se crean usuarios, repartidores y productos.

Luego sus ObjectIds reales se utilizan para crear los pedidos.

Finalmente, los ObjectIds de los pedidos y repartidores se utilizan para crear las entregas.

---

# Endpoints

## Products

```text
GET     /api/products
GET     /api/products/:id
POST    /api/products
PATCH   /api/products/:id
DELETE  /api/products/:id
```

El listado permite filtrar por:

```text
category
status
```

Ejemplos:

```text
GET /api/products?category=interior
GET /api/products?status=available
```

---

## Users

```text
GET     /api/users
GET     /api/users/:id
POST    /api/users
PATCH   /api/users/:id
DELETE  /api/users/:id
```

---

# Endpoints de Mocking

Todos los endpoints se encuentran bajo:

```text
/api/mocks
```

## Generar usuarios

```http
GET /api/mocks/users?qty=3
```

Genera usuarios con rol `USER`.

No guarda información en MongoDB.

---

## Generar repartidores

```http
GET /api/mocks/drivers?qty=3
```

Genera usuarios con rol `DRIVER`.

No guarda información en MongoDB.

---

## Generar productos

```http
GET /api/mocks/products?qty=3
```

Genera plantas ficticias con precio, stock y estado coherente.

No guarda información en MongoDB.

---

## Generar pedidos

```http
GET /api/mocks/orders?qty=3
```

Genera pedidos simulados relacionados con usuarios y productos ficticios.

No guarda información en MongoDB.

---

## Generar entregas

```http
GET /api/mocks/deliveries?qty=3
```

Genera entregas relacionadas con pedidos y repartidores ficticios.

No guarda información en MongoDB.

---

## Cargar datos de prueba en MongoDB

```http
POST /api/mocks/seed?qty=3
```

No requiere body.

Genera y persiste:

```text
3 usuarios
3 repartidores
3 productos
3 pedidos
3 entregas
```

Ejemplo de respuesta:

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

Si no se proporciona `qty`, se utiliza una cantidad predeterminada de `10`.

---

# Validaciones

La API utiliza **Zod** para validar los datos recibidos en los endpoints de Users y Products antes de que lleguen al Controller.

Se validan, entre otras cosas:

- Campos obligatorios.
- Formato de email.
- Longitudes de strings.
- Precio no negativo.
- Stock entero y no negativo.
- Actualizaciones con al menos un campo.

También se valida el formato de los identificadores de MongoDB antes de realizar consultas por ID.

Esto permite diferenciar errores como:

```text
400 → datos o identificadores inválidos
404 → recurso no encontrado
409 → conflicto
500 → error interno inesperado
```

---

# Configuración de entorno

Las variables de entorno se gestionan de forma centralizada mediante:

```text
src/config/env.config.js
```

La aplicación valida al iniciar que estén definidas:

```text
PORT
MONGODB_URI
NODE_ENV
```

Si falta alguna variable crítica, la aplicación muestra un error descriptivo y no inicia.

No se utiliza `process.env` directamente fuera del módulo de configuración.

---

# Variables de entorno

El proyecto incluye:

```text
.env.example
```

con:

```env
PORT=
MONGODB_URI=
NODE_ENV=
```

El archivo `.env` real no se incluye en el repositorio.

Ejemplo local:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/shipnow
NODE_ENV=development
```

---

# Instalación

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar al proyecto:

```bash
cd backend3
```

Instalar las dependencias:

```bash
npm install
```

Crear `.env` tomando `.env.example` como referencia.

Iniciar el proyecto:

```bash
npm run dev
```

Con la configuración de ejemplo, la API estará disponible en:

```text
http://localhost:8080
```

---

# Ejemplo de creación de producto

```http
POST /api/products
```

```json
{
  "name": "Monstera Deliciosa",
  "description": "Planta tropical de interior de hojas grandes",
  "category": "interior",
  "price": 850,
  "stock": 5
}
```

El Service determina automáticamente el estado del producto a partir del stock.

---

# Ejemplo de creación de usuario

```http
POST /api/users
```

```json
{
  "firstName": "Gastón",
  "lastName": "Jaureguiberry",
  "email": "gaston@email.com",
  "password": "12345678"
}
```

El usuario se crea con rol `USER` por defecto y la contraseña se almacena mediante bcrypt.

---

# Manejo de errores

La aplicación utiliza un error personalizado `AppError` y un middleware global de errores.

Los Controllers derivan los errores mediante:

```js
next(error);
```

evitando repetir la construcción de respuestas de error en cada endpoint.

---

# Estado del proyecto

## Módulo 1

- Arquitectura Controller → Service → Repository implementada.
- CRUD de Products.
- CRUD de Users.
- Configuración de entorno centralizada y validada.
- Constantes para roles y estados.
- Validaciones mediante Zod.
- Validación de ObjectId.
- Manejo centralizado de errores.
- Contraseñas procesadas con bcrypt.
- Filtros controlados para Products.

## Módulo 2

- Mocking mediante Faker.
- Generación de usuarios simulados.
- Generación de repartidores simulados.
- Generación de plantas simuladas.
- Generación de pedidos simulados.
- Generación de entregas simuladas.
- Endpoints de mocks sin persistencia.
- Seed controlado en MongoDB.
- Relaciones entre usuarios, pedidos, productos, entregas y repartidores.
- Roles, estados y prioridades centralizados mediante constantes.
- Carga masiva mediante Repositories.
- Contraseñas de usuarios mock hasheadas antes de persistirse.
- Estados de respuesta centralizados mediante constantes.