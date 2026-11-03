# 🌱 ShipNow — Backend III

API REST académica desarrollada para **Backend III de Coderhouse**. Simula la gestión de usuarios, productos de jardinería, pedidos y entregas, con MongoDB, validaciones, errores centralizados, datos simulados, logging y documentación Swagger/OpenAPI.

## Tecnologías

- Node.js, JavaScript (ES Modules), Express
- MongoDB y Mongoose
- Zod, bcrypt, dotenv
- Faker (`@faker-js/faker`)
- Winston y `winston-daily-rotate-file`
- Swagger UI (`swagger-ui-express`), OpenAPI 3.0.3
- Node.js Test Runner y Supertest (pruebas)

## Arquitectura

La aplicación separa responsabilidades en **routes → middlewares → controllers → services → repositories → models → MongoDB**.

Los controladores procesan solicitudes y respuestas HTTP; los servicios implementan reglas de negocio; los repositorios encapsulan el acceso a datos.

`AppError`, `errorDictionary.js` y el middleware global centralizan el manejo de errores.

## Instalación

```bash
git clone https://github.com/gastonjaureguib-stack/backend3.git
cd backend3
npm install
```

Crear un archivo `.env` tomando como referencia `.env.example`:

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
NODE_ENV=development
```

La URI es un ejemplo para una instalación local; adaptarla a la instancia de MongoDB disponible.

**Las operaciones que utilizan transacciones de MongoDB requieren un replica set** (por ejemplo, `rs0`) o una configuración compatible.

No publicar el archivo `.env` ni credenciales.

Iniciar el servidor:

```bash
npm run dev
```

La API estará disponible en `http://localhost:8080` si se utiliza `PORT=8080`.

## Entrega 5 — Documentación Swagger/OpenAPI

Con el servidor iniciado, abrir:

**http://localhost:8080/api/docs**

La documentación está definida en `src/config/swagger.config.js` y utiliza schemas reutilizables de `src/docs/schemas.js`.

Describe las rutas, parámetros, cuerpos de solicitud, respuestas exitosas y errores HTTP de la API.

La interfaz organiza los endpoints en seis grupos:

- Users
- Products
- Orders
- Deliveries
- Mocks
- Logger

La ruta de Logger es exclusiva del entorno `development`; en otros entornos puede aparecer documentada, pero no estará habilitada.

### Resumen de endpoints

| Grupo | Método | Ruta | Descripción |
|---|---|---|---|
| Users | GET | `/api/users` | Listar usuarios |
| Users | GET | `/api/users/:id` | Consultar usuario |
| Users | POST | `/api/users` | Crear usuario |
| Users | PATCH | `/api/users/:id` | Actualizar usuario |
| Users | DELETE | `/api/users/:id` | Eliminar usuario |
| Products | GET | `/api/products` | Listar productos; filtros por categoría y estado |
| Products | GET | `/api/products/:id` | Consultar producto |
| Products | POST | `/api/products` | Crear producto |
| Products | PATCH | `/api/products/:id` | Actualizar producto |
| Products | PATCH | `/api/products/:id/stock` | Ajustar inventario |
| Products | DELETE | `/api/products/:id` | Eliminar producto |
| Orders | GET | `/api/orders` | Listar pedidos |
| Orders | GET | `/api/orders/:id` | Consultar pedido |
| Orders | POST | `/api/orders` | Crear pedido |
| Orders | PATCH | `/api/orders/:id` | Actualizar estado o prioridad |
| Orders | DELETE | `/api/orders/:id` | Eliminar pedido cuando las reglas lo permiten |
| Deliveries | GET | `/api/deliveries` | Listar entregas |
| Deliveries | GET | `/api/deliveries/order/:orderId` | Consultar entrega por pedido |
| Deliveries | GET | `/api/deliveries/:id` | Consultar entrega |
| Deliveries | POST | `/api/deliveries` | Crear entrega |
| Deliveries | PATCH | `/api/deliveries/:id` | Actualizar entrega |
| Deliveries | PATCH | `/api/deliveries/:id/cancel` | Cancelar entrega |
| Deliveries | DELETE | `/api/deliveries/:id` | Ruta registrada; la eliminación está restringida por reglas de negocio |
| Mocks | GET | `/api/mocks/users` | Generar usuarios simulados |
| Mocks | GET | `/api/mocks/drivers` | Generar repartidores simulados |
| Mocks | GET | `/api/mocks/products` | Generar productos simulados |
| Mocks | GET | `/api/mocks/orders` | Generar pedidos simulados |
| Mocks | GET | `/api/mocks/deliveries` | Generar entregas simuladas |
| Mocks | POST | `/api/mocks/seed` | Persistir datos simulados |
| Logger | GET | `/api/logger/test` | Probar los niveles de logging (solo desarrollo) |

Para los campos obligatorios, ejemplos, parámetros, códigos HTTP y schemas de cada operación, consultar **Swagger UI**.

## Entidades y reglas principales

**Users:** nombre, apellido, email, contraseña protegida mediante bcrypt y rol (`USER`, `DRIVER`, `ADMIN`). Las respuestas públicas no deben exponer contraseñas.

**Products:** nombre, descripción, categoría, precio, stock y estado (`AVAILABLE`, `OUT_OF_STOCK`). El estado depende de la disponibilidad.

**Orders:** usuario, productos y cantidades, total, prioridad (`LOW`, `MEDIUM`, `HIGH`) y estado (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). La creación reserva inventario y la cancelación puede liberarlo según las reglas de negocio.

**Deliveries:** pedido, repartidor opcional, dirección y estado (`PENDING`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`). Su ciclo de vida se coordina con el pedido.

## Validaciones y errores

Las solicitudes se validan con **Zod** y los identificadores MongoDB se verifican antes de acceder a los datos.

Los errores se centralizan en `src/utils/errorDictionary.js` y se procesan con `src/middlewares/error.middleware.js`.

Ejemplo de respuesta:

```json
{
  "status": "error",
  "code": "INVALID_OBJECT_ID",
  "message": "El ID proporcionado no es válido"
}
```

Entre los errores documentados se encuentran:

- `VALIDATION_ERROR` (400)
- `INVALID_OBJECT_ID` (400)
- `ROUTE_NOT_FOUND` (404)
- `USER_NOT_FOUND` (404)
- `EMAIL_ALREADY_EXISTS` (409)
- `PRODUCT_NOT_FOUND` (404)

También existen errores específicos asociados a inventario, pedidos, entregas y mocks.

La referencia completa de respuestas se encuentra en Swagger.

## Mocking y seed

Faker permite generar usuarios, repartidores, productos, pedidos y entregas de prueba.

Los endpoints `GET /api/mocks/*` generan datos simulados; `POST /api/mocks/seed` inserta registros en MongoDB.

Ejemplos:

```http
GET /api/mocks/products?qty=5
POST /api/mocks/seed?qty=3
```

**Atención:** el seed escribe datos en la base configurada. No ejecutarlo sobre información que deba conservarse.

El seed no garantiza una transacción global para todas las inserciones.

## Logging

Winston registra eventos del servidor, errores y operaciones relevantes.

Utiliza seis niveles:

- `fatal`
- `error`
- `warning`
- `info`
- `http`
- `debug`

Los errores se almacenan en archivos rotativos dentro de `logs/`, excluidos del repositorio.

El endpoint `GET /api/logger/test` solo se habilita con `NODE_ENV=development`.

## Pruebas automatizadas

Ejecutar:

```bash
npm test
```

El proyecto incluye pruebas de integración de servicios para Products, Orders y Deliveries, además de pruebas HTTP de Products con **Supertest**.

En la verificación local del **3 de noviembre de 2026** se ejecutaron **71 pruebas, todas aprobadas**.

Las pruebas utilizan una base aislada llamada `shipnow_test` y **eliminan datos de sus colecciones** durante la preparación y limpieza.

No utilizar esa base para información importante.

Las suites están configuradas para ejecutarse secuencialmente mediante `--test-concurrency=1`; las pruebas que utilizan transacciones requieren MongoDB con replica set.

## Evidencias de la Entrega 5

Para la presentación de Swagger, preparar capturas que permitan ver:

1. Encabezado de Swagger UI, información general y grupos de endpoints.
2. Ejemplo de endpoint documentado con parámetros, request body y respuestas.
3. Sección **Schemas** con modelos reutilizables.
4. Ejecución de una solicitud desde **Try it out** y su respuesta HTTP.
5. Resultado final de `npm test` con las 71 pruebas aprobadas, como evidencia complementaria.

Las capturas deben reflejar la ejecución real del proyecto. No se incluyen imágenes no verificadas en este README.

## Repositorio

https://github.com/gastonjaureguib-stack/backend3

---

**Proyecto académico — Backend III, Coderhouse.**