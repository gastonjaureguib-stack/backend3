# 🌱 ShipNow — Backend III

API REST desarrollada como parte del curso **Backend III de Coderhouse**.

ShipNow simula el backend de una tienda online de plantas y productos de jardinería.

El proyecto utiliza una arquitectura por capas, persistencia en MongoDB, generación de datos simulados, manejo centralizado de errores y un sistema profesional de logging mediante Winston.

---

## 1. Objetivos del proyecto

El proyecto se desarrolla progresivamente mediante cuatro módulos.

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

### Módulo 4 — Logging y monitoreo básico

Implementación de un sistema de logging mediante Winston y Winston Daily Rotate File.

Incluye:

- Logger centralizado.
- Seis niveles personalizados de severidad.
- Configuración diferenciada para desarrollo y producción.
- Registro de eventos del servidor y MongoDB.
- Registro de errores HTTP.
- Logging de operaciones de mocking y seed.
- Archivos rotativos para errores.
- Exclusión de logs del repositorio.
- Endpoint de diagnóstico exclusivo de desarrollo.
- Pruebas de funcionamiento del logger y rotación por tamaño.

---

## 2. Tecnologías utilizadas

- Node.js.
- Express.
- MongoDB.
- Mongoose.
- JavaScript ES Modules.
- Zod.
- bcrypt.
- Faker (`@faker-js/faker`).
- dotenv.
- Winston.
- Winston Daily Rotate File.

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
- Registrar errores mediante Winston.

### Logging

El sistema de logging funciona como una herramienta transversal a la aplicación.

Su configuración se centraliza en `src/config/logger.config.js`, permitiendo reutilizar una misma instancia del logger desde distintos módulos.

---

## 4. Estructura del proyecto

```text
src/
├── config/
│   ├── env.config.js
│   └── logger.config.js
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

El directorio `logs/` se utiliza para almacenar los archivos generados por Winston y está excluido de Git.

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

Representan plantas y productos disponibles en ShipNow.

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
stock > 0 → AVAILABLE
stock = 0 → OUT_OF_STOCK
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
|---|---|---|
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
|---|---|---|
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
|---|---|---|
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

Los errores inesperados se registran mediante Winston y se convierten en `MOCK_SEED_FAILED`.

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

### Errores definidos

| Código | HTTP | Descripción |
|---|---|---|
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

### Integración con Winston

El middleware global registra:

- Errores controlados con estado HTTP inferior a 500 mediante `warning`.
- Errores internos o inesperados mediante `error`.

El registro de errores no modifica el formato de las respuestas HTTP.

### Formato uniforme de respuesta

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
   +----> Winston Logger
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

---

## 13. Módulo 4 — Logging y monitoreo básico

ShipNow incorpora un sistema centralizado de logging mediante Winston.

El objetivo es registrar eventos relevantes del funcionamiento de la API, facilitar el diagnóstico de errores y mantener información útil para el seguimiento de la aplicación.

### Dependencias

Se incorporaron las siguientes dependencias:

- `winston`
- `winston-daily-rotate-file`

Winston administra los niveles, formatos y transportes de logging.

Winston Daily Rotate File permite almacenar registros en archivos rotativos.

### Configuración centralizada

Ubicación:

`src/config/logger.config.js`

Este archivo define:

- Niveles personalizados.
- Colores de consola.
- Formato de mensajes.
- Fecha y hora de cada registro.
- Configuración diferenciada por entorno.
- Transporte de consola.
- Transporte de archivos rotativos.

Los distintos módulos importan la misma instancia del logger.

### Niveles personalizados

Se definieron seis niveles de severidad.

| Nivel | Prioridad | Uso |
|---|---:|---|
| `fatal` | 0 | Fallas críticas del sistema |
| `error` | 1 | Errores de ejecución |
| `warning` | 2 | Situaciones anómalas o errores controlados |
| `info` | 3 | Eventos relevantes de funcionamiento |
| `http` | 4 | Mensajes de diagnóstico HTTP |
| `debug` | 5 | Información detallada para desarrollo |

Los valores numéricos representan la prioridad interna de Winston.

Cuanto menor es el número, mayor es la severidad.

### Formato de los registros

Los mensajes incluyen:

- Fecha.
- Hora.
- Nivel de severidad.
- Mensaje descriptivo.

Ejemplo:

```text
2026-10-22 19:10:01 [info] Conexión a MongoDB establecida correctamente
2026-10-22 19:10:01 [info] Servidor ShipNow escuchando en el puerto 8080
```

La consola utiliza colores diferenciados según el nivel.

Los archivos utilizan un formato de texto sin códigos de color.

### Configuración de desarrollo

Cuando `NODE_ENV=development`, la consola utiliza el nivel `debug`.

Esto permite mostrar todos los niveles configurados:

```text
debug
http
info
warning
error
fatal
```

### Configuración de producción

Cuando `NODE_ENV=production`, la consola utiliza el nivel `info`.

Se muestran los niveles:

```text
info
warning
error
fatal
```

Los mensajes `debug` y `http` no aparecen en esta configuración.

Esto permite reducir la información de diagnóstico en producción.

### Registro del servidor

Ubicación:

`src/server.js`

El logger registra:

- Conexión exitosa a MongoDB.
- Inicio correcto del servidor HTTP.
- Entorno de ejecución durante desarrollo.
- Fallas críticas al conectar con MongoDB.
- Errores críticos al iniciar el servidor HTTP.

Ejemplo de inicio exitoso:

```text
[info] Conexión a MongoDB establecida correctamente
[info] Servidor ShipNow escuchando en el puerto 8080
```

Ejemplo de error crítico:

```text
[fatal] Error crítico al iniciar el servidor HTTP: listen EADDRINUSE: address already in use :::8080
```

### Registro de errores HTTP

Ubicación:

`src/middlewares/error.middleware.js`

El middleware global registra errores mediante Winston.

Los errores controlados con estados HTTP inferiores a 500 se registran como `warning`.

Los errores internos o inesperados se registran como `error`.

Las respuestas HTTP mantienen el formato uniforme definido en el módulo 3.

### Registro de mocks

Ubicación:

`src/services/mock.service.js`

Se incorporaron registros para las operaciones de generación de:

- Usuarios.
- Repartidores.
- Productos.
- Pedidos.
- Entregas.

También se registran eventos relacionados con la carga de datos mediante seed.

Los mensajes permiten observar operaciones exitosas, información de diagnóstico y situaciones de error.

### Archivos rotativos de errores

El logger utiliza `winston-daily-rotate-file` para almacenar registros de errores.

Configuración:

| Propiedad | Valor |
|---|---|
| Directorio | `logs/` |
| Nombre | `error-%DATE%.log` |
| Patrón de fecha | `YYYY-MM-DD` |
| Nivel | `error` |
| Tamaño máximo | `10m` |
| Conservación | `14d` |
| Compresión | Activada |

El transporte de archivos registra los niveles `error` y `fatal`.

Los mensajes `info`, `http`, `debug` y `warning` no se guardan en ese transporte.

Ejemplo de archivo:

```text
logs/error-2026-10-22.log
```

Contenido de ejemplo:

```text
2026-10-22 19:08:24 [error] Prueba del nivel ERROR
2026-10-22 19:08:24 [fatal] Prueba del nivel FATAL
```

La configuración permite rotar los archivos por fecha y tamaño, limitar su conservación y comprimir archivos rotados.

### Verificación de rotación por tamaño

Se realizó una prueba funcional independiente utilizando Winston Daily Rotate File con un tamaño máximo reducido de `1k`.

Esta prueba permitió forzar la generación de registros y comprobar el mecanismo de rotación por tamaño sin alterar la configuración principal de ShipNow.

La configuración utilizada por la aplicación conserva su límite de `10m`.

### Exclusión de archivos de Git

El archivo `.gitignore` incluye:

```gitignore
logs/
*.log
```

Esto evita incorporar los archivos de ejecución al repositorio.

### Endpoint de prueba del logger

Se incorporó el siguiente endpoint:

```http
GET /api/logger/test
```

Está disponible únicamente cuando:

```env
NODE_ENV=development
```

El endpoint ejecuta un mensaje por cada nivel:

```javascript
logger.debug("Prueba del nivel DEBUG");
logger.http("Prueba del nivel HTTP");
logger.info("Prueba del nivel INFO");
logger.warning("Prueba del nivel WARNING");
logger.error("Prueba del nivel ERROR");
logger.fatal("Prueba del nivel FATAL");
```

Respuesta:

```json
{
  "status": "success",
  "message": "Prueba del logger ejecutada correctamente",
  "levels": [
    "debug",
    "http",
    "info",
    "warning",
    "error",
    "fatal"
  ]
}
```

Los mensajes `error` y `fatal` también se escriben en el archivo rotativo.

### Protección del endpoint en producción

Cuando `NODE_ENV=production`, la ruta de diagnóstico no se registra.

Una solicitud a:

```http
GET /api/logger/test
```

devuelve HTTP 404:

```json
{
  "status": "error",
  "code": "ROUTE_NOT_FOUND",
  "message": "Ruta no encontrada"
}
```

Esto evita exponer el endpoint de pruebas en producción.

### Alcance del monitoreo

El módulo proporciona logging por niveles y persistencia de errores.

El nivel `http` está disponible para futuras integraciones de registro automático de solicitudes.

El sistema no incorpora paneles de métricas, alertas automáticas ni seguimiento distribuido de solicitudes.

---

## 14. Pruebas del módulo 4

### Prueba 1 — Inicio en desarrollo

Comando:

```bash
npm run dev
```

Resultado verificado:

```text
[info] Conexión a MongoDB establecida correctamente
[info] Servidor ShipNow escuchando en el puerto 8080
[debug] Entorno de ejecución: development
```

### Prueba 2 — Ejecución de todos los niveles

Endpoint:

```http
GET /api/logger/test
```

Se verificó la emisión de los seis niveles:

```text
[debug] Prueba del nivel DEBUG
[http] Prueba del nivel HTTP
[info] Prueba del nivel INFO
[warning] Prueba del nivel WARNING
[error] Prueba del nivel ERROR
[fatal] Prueba del nivel FATAL
```

### Prueba 3 — Persistencia de errores

Se comprobó la creación de:

```text
logs/error-2026-10-22.log
```

El archivo contenía los registros `error` y `fatal` generados durante la prueba.

### Prueba 4 — Exclusión de Git

Se utilizó:

```bash
git check-ignore logs/error-*.log
```

El resultado confirmó que los archivos de logs están ignorados por Git.

### Prueba 5 — Inicio en producción

Comando utilizado desde Git Bash:

```bash
NODE_ENV=production npm start
```

Resultado verificado:

```text
2026-10-22 19:10:01 [info] Conexión a MongoDB establecida correctamente
2026-10-22 19:10:01 [info] Servidor ShipNow escuchando en el puerto 8080
```

El mensaje `debug` no apareció.

### Prueba 6 — Error crítico del servidor

Durante una prueba se intentó iniciar el servidor mientras el puerto 8080 estaba ocupado.

Winston registró:

```text
[fatal] Error crítico al iniciar el servidor HTTP: listen EADDRINUSE: address already in use :::8080
```

Esto permitió verificar el registro de una falla crítica real.

### Prueba 7 — Endpoint deshabilitado en producción

Se comprobó que:

```http
GET /api/logger/test
```

devuelve HTTP 404 en producción.

### Prueba 8 — Transporte rotativo

Se verificó que el transporte configurado corresponde a `DailyRotateFile`, utiliza el nivel `error` y tiene como nombre de archivo `error-%DATE%.log`.

### Prueba 9 — Rotación por tamaño

Se realizó una prueba aislada con un tamaño máximo de `1k` para forzar la rotación mediante la escritura de múltiples registros.

La prueba utiliza la misma librería de rotación integrada en ShipNow, manteniendo intacta la configuración principal de la aplicación.

---

## 15. Configuración de entorno

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

### Entornos

Para desarrollo:

```env
NODE_ENV=development
```

Para producción:

```env
NODE_ENV=production
```

El valor de `NODE_ENV` determina el nivel de logging de consola y la disponibilidad del endpoint de diagnóstico.

---

## 16. Instalación y ejecución

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

### Iniciar en desarrollo

```bash
npm run dev
```

### Iniciar en producción

Configurar `NODE_ENV=production` en el entorno de ejecución.

Desde Git Bash:

```bash
NODE_ENV=production npm start
```

Con `PORT=8080`, la API estará disponible en:

```text
http://localhost:8080
```

### Probar el logger

Con el servidor iniciado en desarrollo:

```http
GET http://localhost:8080/api/logger/test
```

Para inspeccionar los archivos generados desde Git Bash:

```bash
ls -lah logs/
cat logs/error-*.log
```

---

## 17. Pruebas realizadas

### Módulo 3

| Prueba | Resultado |
|---|---|
| Cantidad negativa de mocks | Exitosa |
| ObjectId inválido | Exitosa |
| Producto inexistente | Exitosa |
| Ruta inexistente | Exitosa |
| Validación de Zod | Exitosa |
| Generación de pedidos | Exitosa |
| Generación de entregas | Exitosa |
| Persistencia mediante seed | Exitosa |

### Módulo 4

| Prueba | Resultado |
|---|---|
| Inicio del servidor en desarrollo | Exitosa |
| Emisión de los seis niveles | Exitosa |
| Escritura de errores en archivo | Exitosa |
| Exclusión de logs mediante `.gitignore` | Exitosa |
| Inicio del servidor en producción | Exitosa |
| Registro de error crítico del servidor | Exitosa |
| Endpoint de diagnóstico deshabilitado en producción | Exitosa |
| Identificación del transporte `DailyRotateFile` | Exitosa |
| Rotación por tamaño mediante prueba aislada | Exitosa |

---

## 18. Estado del proyecto

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

### Módulo 4

- Winston integrado.
- Niveles personalizados de logging.
- Configuración diferenciada para desarrollo y producción.
- Transporte de consola con colores.
- Registros con fecha y hora.
- Logging de conexión a MongoDB.
- Logging de inicio y errores críticos del servidor.
- Logging del middleware global de errores.
- Logging de mocks y seed.
- Transporte rotativo para archivos de errores.
- Rotación por tamaño verificada mediante prueba aislada.
- Exclusión de logs mediante `.gitignore`.
- Endpoint de diagnóstico exclusivo de desarrollo.
- Pruebas de logging y comportamiento en producción.

---

## 19. Repositorio

GitHub:

https://github.com/gastonjaureguib-stack/backend3

---

**Proyecto académico desarrollado para Backend III — Coderhouse.**