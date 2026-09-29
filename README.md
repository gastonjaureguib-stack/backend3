# 🌱 ShipNow - Backend III

API REST desarrollada como parte del curso **Backend III de Coderhouse**.

En esta primera etapa, ShipNow se plantea como una tienda de plantas y productos relacionados con jardinería. El proyecto sirve como base para trabajar una arquitectura profesional por capas y podrá ampliarse durante el curso con nuevas funcionalidades.

## Pre-entrega Módulo 1

El objetivo de esta entrega es refactorizar la API utilizando una arquitectura de tres capas:

**Controller → Service → Repository**

La aplicación separa las responsabilidades HTTP, la lógica de negocio y el acceso a MongoDB para obtener un código más organizado, mantenible y fácil de escalar.

---

## Tecnologías utilizadas

- Node.js
- Express
- MongoDB
- Mongoose
- dotenv
- Zod
- bcrypt

---

## Arquitectura

El proyecto utiliza el siguiente flujo:

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

### Controller

Es la puerta de entrada HTTP.

Su responsabilidad es recibir `req`, extraer los datos necesarios, llamar al Service y construir la respuesta HTTP correspondiente.

Los Controllers no realizan consultas directas a MongoDB ni contienen lógica de negocio.

### Service

Contiene la lógica de negocio de la aplicación.

Por ejemplo:

- Determinar el estado de un producto según su stock.
- Evitar la creación de usuarios con emails ya registrados.
- Procesar la contraseña de un usuario antes de almacenarla.
- Controlar los filtros permitidos para productos.

El Service no realiza consultas directamente mediante Mongoose. Para acceder a los datos utiliza el Repository.

### Repository

Es la capa encargada del acceso a datos.

Es el único lugar de cada entidad donde se realizan operaciones mediante los modelos de Mongoose, como búsquedas, creación, actualización y eliminación.

También encapsula detalles propios de persistencia, como proyecciones y ordenamiento.

De esta manera, la lógica de negocio queda separada de la forma en que los datos son almacenados.

---

## Estructura del proyecto

```text
src/
├── config/
│   └── env.config.js
├── constants/
│   └── index.js
├── controllers/
│   ├── product.controller.js
│   └── user.controller.js
├── middlewares/
│   ├── error.middleware.js
│   ├── validate.middleware.js
│   └── validateObjectId.middleware.js
├── models/
│   ├── product.model.js
│   └── user.model.js
├── repositories/
│   ├── product.repository.js
│   └── user.repository.js
├── routes/
│   ├── product.routes.js
│   └── user.routes.js
├── services/
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

## Entidades

### Products

Los productos representan las plantas disponibles en ShipNow.

Campos principales:

- `name`
- `description`
- `category`
- `price`
- `stock`
- `status`

Los estados posibles se encuentran centralizados mediante constantes:

```text
AVAILABLE
OUT_OF_STOCK
```

El estado no es decidido directamente por el cliente.

El Service aplica la siguiente regla de negocio:

```text
stock > 0  → available
stock = 0  → out_of_stock
```

### Users

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
```

Los nuevos usuarios reciben el rol `USER` por defecto.

Además:

- El email debe ser único.
- Las contraseñas se almacenan utilizando bcrypt.
- La contraseña no se devuelve en los endpoints de consulta.

---

## Validaciones

La API utiliza **Zod** para validar los datos recibidos antes de que lleguen al Controller.

Se validan, entre otras cosas:

- Campos obligatorios.
- Formato de email.
- Longitudes de strings.
- Precio no negativo.
- Stock entero y no negativo.
- Actualizaciones con al menos un campo.

También se valida el formato de los identificadores de MongoDB antes de realizar una consulta.

Esto permite diferenciar correctamente errores como:

```text
400 → datos o identificadores inválidos
404 → recurso no encontrado
409 → conflicto, por ejemplo email ya registrado
500 → error interno inesperado
```

---

## Endpoints

### Products

```text
GET     /api/products
GET     /api/products/:id
POST    /api/products
PATCH   /api/products/:id
DELETE  /api/products/:id
```

El listado de productos permite filtrar por:

```text
category
status
```

Ejemplos:

```text
GET /api/products?category=interior
GET /api/products?status=available
```

### Users

```text
GET     /api/users
GET     /api/users/:id
POST    /api/users
PATCH   /api/users/:id
DELETE  /api/users/:id
```

---

## Configuración de entorno

Las variables de entorno se gestionan de forma centralizada mediante:

```text
src/config/env.config.js
```

La aplicación valida al iniciar que estén definidas las variables críticas:

```text
PORT
MONGODB_URI
NODE_ENV
```

Si falta alguna de estas variables, la aplicación muestra un error descriptivo y no inicia.

No se utiliza `process.env` directamente fuera del módulo de configuración.

---

## Variables de entorno

El proyecto incluye un archivo:

```text
.env.example
```

con la estructura necesaria:

```env
PORT=
MONGODB_URI=
NODE_ENV=
```

El archivo `.env` real no se incluye en el repositorio.

Para trabajar localmente se debe crear un `.env` tomando `.env.example` como referencia.

Ejemplo:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/shipnow
NODE_ENV=development
```

---

## Instalación

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

Crear el archivo `.env` utilizando `.env.example` como referencia.

Luego iniciar el proyecto en modo desarrollo:

```bash
npm run dev
```

Con la configuración utilizada durante el desarrollo, la API estará disponible en:

```text
http://localhost:8080
```

---

## Ejemplo de creación de producto

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

## Ejemplo de creación de usuario

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

## Decisiones de arquitectura

La separación entre **Service** y **Repository** busca evitar mezclar reglas de negocio con acceso a datos.

Por ejemplo, para crear un usuario:

```text
Repository
→ consulta si existe un usuario con determinado email.

Service
→ decide que, si ese usuario existe, no se permite crear otro con el mismo email.

Repository
→ persiste el nuevo usuario cuando corresponde.
```

Otro ejemplo ocurre con Products:

```text
Service
→ determina el estado del producto según su stock.

Repository
→ guarda el producto y encapsula las operaciones de acceso a MongoDB.
```

De esta forma, cambiar una regla de negocio no requiere modificar la lógica de persistencia y los Controllers permanecen independientes de Mongoose.

---

## Manejo de errores

La aplicación utiliza un error personalizado `AppError` y un middleware global de errores.

Los Controllers derivan los errores mediante `next(error)`, evitando repetir la construcción de respuestas de error en cada endpoint.

---

## Estado de la pre-entrega

- Arquitectura Controller → Service → Repository implementada.
- CRUD de Products implementado.
- CRUD de Users implementado.
- Configuración de entorno centralizada y validada.
- Constantes para roles y estados.
- Validaciones mediante Zod.
- Validación de ObjectId.
- Manejo centralizado de errores.
- Contraseñas procesadas con bcrypt.
- Filtros controlados para Products.