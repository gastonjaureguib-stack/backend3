
# 🌱 ShipNow — Backend III

API REST desarrollada como proyecto académico para el curso **Backend III de Coderhouse**.

ShipNow simula una plataforma de gestión logística orientada a usuarios, productos de jardinería, inventario, pedidos y entregas.

El proyecto implementa una arquitectura por capas, persistencia en MongoDB, validaciones de datos, manejo centralizado de errores, generación de datos simulados, logging, documentación OpenAPI y pruebas funcionales automatizadas.

## Tecnologías

### Backend

- Node.js
- JavaScript (ES Modules)
- Express 5
- MongoDB
- Mongoose
- Zod
- bcrypt
- dotenv

### Herramientas y documentación

- Faker (`@faker-js/faker`)
- Winston
- winston-daily-rotate-file
- Swagger UI (`swagger-ui-express`)
- OpenAPI 3.0.3

### Testing

- Mocha
- Chai
- Supertest

## Arquitectura del proyecto

ShipNow utiliza una arquitectura por capas para separar las responsabilidades de la aplicación.

```text
HTTP Request
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
Mongoose Models
    |
    v
MongoDB
```

### Responsabilidades

- **Routes:** definen los endpoints y conectan las solicitudes con sus controladores.
- **Middlewares:** procesan validaciones, identificadores y errores.
- **Controllers:** reciben las solicitudes HTTP y construyen las respuestas.
- **Services:** implementan las reglas de negocio.
- **Repositories:** encapsulan las operaciones de acceso a datos.
- **Models:** definen la estructura de las entidades mediante Mongoose.
- **Config:** centraliza la configuración del entorno, logging y Swagger.
- **Docs:** contiene las definiciones OpenAPI y los schemas reutilizables.
- **Mocks:** genera información simulada para pruebas y desarrollo.
- **Tests:** contiene las pruebas automatizadas de la API.

El manejo de errores se centraliza mediante `AppError`, `errorDictionary.js` y el middleware global de errores.

## Instalación

### Requisitos previos

- Node.js 24.x y npm >=10. El lockfile actual es versión 3; la validación local utiliza Node.js 24.19.0.
- MongoDB
- Git

Las operaciones que utilizan transacciones de MongoDB requieren un **replica set** o una configuración compatible.

### Clonar el repositorio

```bash
git clone https://github.com/gastonjaureguib-stack/backend3.git
cd backend3
```

### Instalar dependencias

```bash
npm ci --include=dev
```

Mocha, Chai y Supertest son dependencias de desarrollo. Para ejecutar pruebas no usar `--omit=dev` ni una instalación que omita estas dependencias por `NODE_ENV=production`. `npm test` utiliza el ejecutable local de Mocha; no requiere una instalación global. El mensaje `mocha: not found` indica que ese ejecutable no está disponible; no es un error de MongoDB ni de `.mocharc.json`.

`npm ci` reemplaza `node_modules` en el directorio donde se ejecuta. Para comprobar una instalación limpia conservando una instalación existente, usar un directorio temporal independiente con copias de `package.json`, `package-lock.json`, `.mocharc.json`, `src/` y `tests/`; ejecutar allí `npm ci --include=dev`. Crear también allí el `.env.test` local antes de ejecutar las suites. No versionar ese archivo ni ejecutar suites simultáneamente contra la misma base.

### Configurar variables de entorno

Crear un archivo `.env` a partir de `.env.example`.

Ejemplo de configuración local:

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow?replicaSet=rs0
NODE_ENV=development
```

La URI debe adaptarse a la instancia de MongoDB utilizada.

El archivo `.env` contiene configuración local y no debe publicarse en el repositorio.

### Configurar MongoDB

El proyecto utiliza transacciones para operaciones que requieren consistencia entre documentos, como la creación y actualización de pedidos.

Para utilizar MongoDB localmente con transacciones es necesario configurar un replica set.

Para las pruebas, el nombre requerido es `rs0`. Con MongoDB Community y `mongosh` previamente instalados, se puede preparar una instancia local dedicada de esta forma. Si ya existe un servicio en el puerto 27017, revisar su configuración antes: no iniciar otra instancia ni reinicializar un replica set existente.

En PowerShell, crear una carpeta vacía para datos fuera del repositorio e iniciar MongoDB en una terminal:

```powershell
New-Item -ItemType Directory -Path "$env:LOCALAPPDATA\ShipNowMongo" -Force
mongod --dbpath "$env:LOCALAPPDATA\ShipNowMongo" --replSet rs0 --bind_ip 127.0.0.1 --port 27017
```

En otra terminal, abrir `mongosh`:

```bash
mongosh "mongodb://127.0.0.1:27017/admin?directConnection=true"
```

Solo si la instancia todavía no tiene un replica set inicializado, ejecutar dentro de `mongosh`:

```javascript
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
```

Comprobar `rs.status()` y `db.hello()`: debe aparecer `setName: "rs0"` e `isWritablePrimary: true`. No ejecutar `rs.initiate()` sobre una instancia ya inicializada. La base `shipnow_test` se crea al realizar la primera escritura; no hace falta migración ni borrar datos.

La instancia de MongoDB debe encontrarse operativa antes de iniciar la aplicación.

### Iniciar el servidor

```bash
npm run dev
```

Con la configuración de ejemplo, la API estará disponible en:

http://localhost:8080

## Documentación Swagger / OpenAPI

ShipNow incorpora documentación interactiva mediante Swagger UI y OpenAPI 3.0.3.

Con el servidor iniciado, acceder a:

**http://localhost:8080/api/docs**

La configuración principal se encuentra en:

```text
src/config/swagger.config.js
```

Los schemas reutilizables se encuentran en:

```text
src/docs/schemas.js
```

La documentación incluye:

- Endpoints disponibles.
- Métodos HTTP.
- Parámetros de ruta y consulta.
- Cuerpos de solicitud.
- Schemas de entrada y salida.
- Ejemplos de respuestas.
- Códigos de estado HTTP.
- Errores documentados.
- Descripciones de las operaciones.

### Grupos documentados

Swagger organiza los endpoints en seis grupos:

1. Users
2. Products
3. Orders
4. Deliveries
5. Mocks
6. Logger

El endpoint de Logger se habilita cuando `NODE_ENV=development` o `NODE_ENV=test`; en producción no se registra.

## Endpoints de la API

### Users

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/:id` | Obtener usuario por ID |
| POST | `/api/users` | Crear usuario |
| PATCH | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Products

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/products` | Listar productos |
| GET | `/api/products/:id` | Obtener producto por ID |
| POST | `/api/products` | Crear producto |
| PATCH | `/api/products/:id` | Actualizar producto |
| PATCH | `/api/products/:id/stock` | Ajustar inventario |
| DELETE | `/api/products/:id` | Eliminar producto |

El listado de productos admite filtros por categoría y estado.

### Orders

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/orders` | Listar pedidos |
| GET | `/api/orders/:id` | Obtener pedido por ID |
| POST | `/api/orders` | Crear pedido |
| PATCH | `/api/orders/:id` | Actualizar estado o prioridad |
| DELETE | `/api/orders/:id` | Solicitar eliminación de pedido |

Las operaciones de pedidos están sujetas a las reglas de negocio y a la disponibilidad del inventario.

### Deliveries

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/deliveries` | Listar entregas |
| GET | `/api/deliveries/:id` | Obtener entrega por ID |
| GET | `/api/deliveries/order/:orderId` | Obtener entrega por pedido |
| POST | `/api/deliveries` | Crear entrega |
| PATCH | `/api/deliveries/:id` | Actualizar entrega |
| PATCH | `/api/deliveries/:id/cancel` | Cancelar entrega |
| DELETE | `/api/deliveries/:id` | Solicitar eliminación de entrega |

La eliminación de entregas está restringida por las reglas de negocio para preservar la consistencia y el historial logístico.

### Mocks

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/mocks/users` | Generar usuarios simulados |
| GET | `/api/mocks/drivers` | Generar repartidores simulados |
| GET | `/api/mocks/products` | Generar productos simulados |
| GET | `/api/mocks/orders` | Generar pedidos simulados |
| GET | `/api/mocks/deliveries` | Generar entregas simuladas |
| POST | `/api/mocks/seed` | Insertar datos simulados |

### Logger

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/logger/test` | Probar los niveles del logger |

Disponible en los entornos `development` y `test`.

## Entidades y reglas de negocio

### Users

Representa a los usuarios registrados en la plataforma.

Campos principales:

- Nombre.
- Apellido.
- Correo electrónico.
- Contraseña.
- Rol.

Roles disponibles:

- `user`
- `driver`
- `admin`

Las contraseñas se protegen mediante bcrypt y no deben exponerse en las respuestas públicas de la API.

### Products

Representa los productos disponibles en el inventario.

Campos principales:

- Nombre.
- Descripción.
- Categoría.
- Precio.
- Stock.
- Estado.

Estados disponibles:

- `available`
- `out_of_stock`

El estado del producto se relaciona con su disponibilidad.

El inventario se modifica mediante las operaciones permitidas por el servicio.

### Orders

Representa los pedidos realizados por los usuarios.

Campos principales:

- Usuario.
- Productos y cantidades.
- Total.
- Prioridad.
- Estado.

Prioridades:

- `low`
- `medium`
- `high`

Estados:

- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

Reglas principales:

- El usuario debe existir.
- Los productos deben existir.
- El pedido debe contener al menos un producto.
- No se permiten productos duplicados.
- Las cantidades deben ser enteros positivos.
- Debe existir stock suficiente.
- El total se calcula en el servidor.
- La creación del pedido reserva inventario.
- La cancelación puede restituir stock según las reglas del servicio.
- Las transiciones de estado están controladas.

Las operaciones que modifican múltiples documentos utilizan transacciones cuando corresponde.

### Deliveries

Representa las entregas asociadas a los pedidos.

Campos principales:

- Pedido.
- Repartidor opcional.
- Dirección de entrega.
- Estado.

Estados disponibles:

- `pending`
- `assigned`
- `in_transit`
- `delivered`
- `cancelled`

Reglas principales:

- El pedido debe existir.
- Cada pedido puede tener una sola entrega.
- El pedido debe cumplir las condiciones para generar una entrega.
- El repartidor asignado debe existir y tener el rol correspondiente.
- Las transiciones de estado están controladas.
- La entrega mantiene consistencia con el estado del pedido.
- La eliminación puede rechazarse para conservar el historial logístico.

## Validaciones

ShipNow utiliza Zod para validar los datos recibidos por los endpoints.

Las validaciones permiten controlar:

- Campos obligatorios.
- Tipos de datos.
- Longitudes mínimas y máximas.
- Formatos de correo electrónico.
- Valores permitidos.
- Cantidades y precios.
- Estados y prioridades.
- Estructuras de solicitudes.

Los identificadores MongoDB se validan antes de realizar las operaciones correspondientes.

## Manejo centralizado de errores

La aplicación implementa un sistema de errores centralizado mediante:

```text
src/utils/AppError.js
src/utils/errorDictionary.js
src/middlewares/error.middleware.js
```

Los errores utilizan una estructura de respuesta consistente.

Ejemplo:

```json
{
  "status": "error",
  "code": "INVALID_OBJECT_ID",
  "message": "El identificador proporcionado no es válido"
}
```

Entre los errores contemplados se encuentran:

| Código | HTTP |
|---|---|
| VALIDATION_ERROR | 400 |
| INVALID_OBJECT_ID | 400 |
| ROUTE_NOT_FOUND | 404 |
| USER_NOT_FOUND | 404 |
| EMAIL_ALREADY_EXISTS | 409 |
| PRODUCT_NOT_FOUND | 404 |
| ORDER_NOT_FOUND | 404 |
| DELIVERY_NOT_FOUND | 404 |
| INTERNAL_SERVER_ERROR | 500 |

También existen errores específicos para inventario, transiciones de estado, repartidores, pedidos, entregas y generación de datos simulados.

La documentación Swagger incluye ejemplos de las respuestas de error.

## Generación de datos simulados

El proyecto utiliza Faker para generar información de prueba.

Se pueden generar:

- Usuarios.
- Repartidores.
- Productos.
- Pedidos.
- Entregas.

Los endpoints GET generan datos simulados sin persistirlos en MongoDB.

Ejemplo:

```http
GET /api/mocks/products?qty=5
```

El parámetro `qty` permite indicar la cantidad solicitada.

### Seed de datos

El endpoint de seed permite generar e insertar datos en la base configurada.

Ejemplo:

```http
POST /api/mocks/seed?qty=3
```

**Advertencia:** esta operación modifica la base de datos.

Se recomienda utilizarla exclusivamente en entornos de desarrollo o pruebas.

El proceso de seed no garantiza una única transacción global para todas las inserciones.

## Sistema de logging

ShipNow utiliza Winston para registrar eventos relevantes de la aplicación.

Se implementan seis niveles personalizados:

| Nivel | Uso |
|---|---|
| fatal | Errores críticos |
| error | Errores de aplicación |
| warning | Advertencias |
| info | Información general |
| http | Eventos HTTP |
| debug | Diagnóstico y desarrollo |

La configuración se encuentra en:

```text
src/config/logger.config.js
```

### Rotación de archivos

Los errores se registran mediante `winston-daily-rotate-file`.

Configuración:

- Directorio: `logs/`
- Archivo: `error-%DATE%.log`
- Rotación diaria.
- Tamaño máximo: 10 MB.
- Retención: 14 días.
- Compresión de archivos antiguos.

Los archivos de logs no deben incluirse en el repositorio.

### Endpoint de diagnóstico

```http
GET /api/logger/test
```

Permite ejecutar una prueba de los seis niveles de logging.

Disponible cuando `NODE_ENV=development` o `NODE_ENV=test`. Por ejemplo:

```env
NODE_ENV=development
```

## Entrega 6 — Testing funcional

Como parte de la Entrega 6 de Backend III se incorporaron pruebas funcionales automatizadas para verificar el comportamiento de los principales módulos de la API.

Las pruebas se implementaron utilizando:

- **Mocha:** ejecución y organización de suites.
- **Chai:** aserciones sobre resultados.
- **Supertest:** solicitudes HTTP a la aplicación Express.

Las pruebas verifican respuestas HTTP, operaciones CRUD, validaciones, reglas de negocio y escenarios de error.

### Organización

Las suites funcionales se encuentran en:

```text
tests/
└── functional/
```

Se prueban siete módulos:

- Users
- Products
- Orders
- Deliveries
- Mocks
- Logger
- Swagger

### Cobertura funcional

#### Users

Las pruebas verifican operaciones y comportamientos relacionados con la gestión de usuarios.

Incluyen escenarios de creación, consulta, actualización, eliminación y validación de datos.

#### Products

Las pruebas verifican el comportamiento de los endpoints de productos.

Incluyen operaciones CRUD, consultas, filtros, validaciones y manejo del inventario.

#### Orders

Las pruebas verifican operaciones de pedidos y sus reglas de negocio.

Incluyen creación, consultas, actualizaciones, cancelaciones, validaciones y restricciones relacionadas con el stock.

#### Deliveries

Las pruebas verifican operaciones de entregas y su relación con los pedidos.

Incluyen creación, consultas, asignación de repartidores, actualizaciones, cancelaciones y restricciones de estados.

#### Mocks

Los 13 casos verifican los cinco GET, estructuras, enums, cantidad predeterminada, cantidades inválidas y fuera del rango seguro, rechazo de `qty=0` en cada GET y en seed, y un seed real con `qty=1`. Este último comprueba cinco documentos, hashes bcrypt y relaciones, y verifica su eliminación selectiva por IDs propios.

#### Logger

Los dos casos verifican la respuesta y las prioridades de los seis niveles en testing, y el 404 de la misma ruta en un proceso de producción aislado. El proceso utiliza un directorio temporal, no carga el `.env` de desarrollo, no importa `server.js` y comprueba que MongoDB permanezca desconectado.

#### Swagger

Los cuatro casos verifican redirección, HTML, especificación OpenAPI servida y rechazo 404 de `/api/docs/package.json` por el middleware instalado. Este rechazo es texto, no una respuesta JSON de `AppError`. No se utiliza un error del parser JSON como supuesto error de Swagger.

### Ejecutar las pruebas

Crear manualmente `.env.test` en la raíz del proyecto con estas tres variables:

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow_test?replicaSet=rs0
NODE_ENV=test
```

`.env.test` está excluido por `.gitignore` y no se debe versionar. `.env.example` contiene ejemplos sin credenciales. Mocha establece `NODE_ENV=test` mediante `tests/setup/env.js`; la configuración exige que `.env.test` exista y contenga las tres variables, y sobrescribe las variables heredadas. No utiliza `.env` como alternativa.

Antes de escribir datos, se exige la URI local indicada, la base `shipnow_test` y `replicaSet=rs0`; las suites también comprueban el nombre de la base conectada. El puerto 3001 es configuración HTTP; Supertest importa la aplicación sin iniciar `src/server.js`.

Desde la raíz del proyecto:

```bash
npm test
```

Para ejecutar un módulo y revisar los archivos antes de la suite completa:

```bash
npm test -- --grep "Mocks - Pruebas funcionales"
npm test -- --grep "Logger - Pruebas funcionales"
npm test -- --grep "Swagger - Pruebas funcionales"
node --check tests/functional/mocks.test.js
git diff --check
```

Las pruebas utilizan una base de datos independiente de la base principal de desarrollo.

Base utilizada:

```text
shipnow_test
```

La limpieza actual usa los IDs registrados por cada suite y filtros `_id: { $in: ... }`; no borra colecciones completas. Se eliminan primero entregas y pedidos, y después productos y usuarios, según corresponda. No ejecutar dos procesos de pruebas al mismo tiempo sobre esta base.

Se corrigieron los siete registros tardíos de IDs: las creaciones HTTP se recuperan por email o nombre con UUID, o por el usuario/pedido exclusivo del test, antes de las aserciones. Si fallan tanto la solicitud como la recuperación, `AggregateError` conserva ambos errores. Una interrupción del proceso o un fallo de MongoDB todavía puede impedir la limpieza.

El seed utiliza wrappers temporales de los cuatro métodos `createMany`: asignan y registran ObjectIds antes de persistir y delegan al método original. En `finally` se restauran los descriptores antes de borrar por IDs en orden Delivery, Order, Product y User. La limpieza intenta todas las entidades, comprueba ausencia de los IDs propios y comunica errores. No depende de IDs en la respuesta ni de diferencias globales de colecciones.

No almacenar información importante en esta base.

Las pruebas que utilizan transacciones requieren MongoDB configurado con replica set.

Con el entorno y el primario de `rs0` validados, ejecutar `npm test` dos veces consecutivas y registrar ambas salidas. No ejecutar procesos de pruebas simultáneos.

### Resultados de las pruebas funcionales

El 16 de noviembre de 2026 se validó previamente una instalación limpia en un directorio temporal independiente mediante `npm ci --include=dev`, con Node.js 24.19.0 y npm 11.17.0, conservando el `node_modules` del proyecto. En esa instalación pasaron dos veces los 108 tests originales. La causa histórica exacta de `mocha: not found` no pudo acreditarse; no se reprodujo al instalar las dependencias de desarrollo.

Después de completar las correcciones, en el directorio del proyecto se verificaron sintaxis y destino MongoDB: `NODE_ENV=test`, `127.0.0.1:27017`, base `shipnow_test`, replica set `rs0` y primario disponible. Mocks y las dos ejecuciones completas terminaron con código 0:

| Módulo | Pruebas aprobadas |
|---|---:|
| Users | 14 |
| Products | 28 |
| Orders | 29 |
| Deliveries | 37 |
| Mocks | 13 |
| Logger | 2 |
| Swagger | 4 |
| **Total** | **127** |

Resultado de la ejecución:

```text
Mocks: 13 passing (357ms)
Primera ejecución completa: 127 passing (10s)
Segunda ejecución completa: 127 passing (10s)
```

**127 pruebas aprobadas en cada ejecución completa.** El test de seed verificó que sus IDs ya no existían tras la limpieza; después de Mocks y al finalizar las suites, las cuatro colecciones se compararon con la referencia inicial de lectura y quedaron vacías, igual que al inicio. No se utilizó esa comparación para identificar documentos que borrar.

La versión final de 127 tests se ejecutó con las dependencias existentes del proyecto; la instalación limpia registrada corresponde a la validación anterior de los 108 tests. Estas ejecuciones no prueban la recuperación ante una interrupción abrupta ni ante todos los fallos parciales posibles. Ejecutar nuevamente `npm test` después de modificar las suites o la aplicación.

Los cambios de tests fueron preparados con asistencia de Codex y están disponibles para revisión en los archivos y el diff. Antes de entregar, el estudiante debe leerlos, comprender sus aserciones y limpieza, y cumplir la indicación del docente sobre realización personal de los tests.

## Evidencias de la entrega

### Swagger / OpenAPI

La documentación puede verificarse desde:

```text
http://localhost:8080/api/docs
```

Se recomienda registrar evidencias de:

1. La interfaz principal de Swagger UI.
2. Los seis grupos de endpoints.
3. Los parámetros y cuerpos de solicitud.
4. Los schemas reutilizables.
5. Las respuestas HTTP y los errores documentados.
6. Una solicitud ejecutada mediante `Try it out`.

### Testing funcional

Para verificar la Entrega 6:

1. Ejecutar `npm test`.
2. Comprobar la ejecución de las suites funcionales.
3. Verificar el resultado final de las pruebas.
4. Registrar una captura de la terminal con el resultado real.

Las evidencias deben corresponder a ejecuciones efectivas del proyecto.

## Consideraciones de seguridad

- Las contraseñas se protegen mediante bcrypt.
- Las respuestas públicas no deben exponer contraseñas.
- Las solicitudes se validan antes de procesarse.
- Los identificadores MongoDB se verifican.
- Los errores internos utilizan respuestas controladas.
- Las variables de entorno se mantienen fuera del repositorio.
- Las operaciones sensibles de inventario y pedidos respetan reglas de negocio.
- Las pruebas utilizan una base independiente.
- Los archivos de logging no se publican.

## Repositorio

Código fuente disponible en GitHub:

https://github.com/gastonjaureguib-stack/backend3

## Proyecto académico

**ShipNow — Backend III**

Proyecto desarrollado para Coderhouse.

Incluye:

- API REST con Express.
- Persistencia mediante MongoDB y Mongoose.
- Arquitectura por capas.
- Validaciones con Zod.
- Reglas de negocio para pedidos y entregas.
- Manejo centralizado de errores.
- Mocking y seed de datos.
- Logging con Winston.
- Documentación Swagger/OpenAPI 3.0.3.
- Testing funcional con Mocha, Chai y Supertest.

**Estado:** desarrollo académico actualizado hasta la Entrega 6.
