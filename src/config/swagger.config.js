
import config from "./env.config.js";

import schemas from "../docs/schemas.js";

import userPaths from "../docs/paths/user.paths.js";
import productPaths from "../docs/paths/product.paths.js";
import orderPaths from "../docs/paths/order.paths.js";
import deliveryPaths from "../docs/paths/delivery.paths.js";
import mockPaths from "../docs/paths/mock.paths.js";
import loggerPaths from "../docs/paths/logger.paths.js";

// ============================================
// CONFIGURACIÓN OPENAPI DE SHIPNOW
// ============================================

const swaggerConfig = {
  openapi: "3.0.3",

  // ==========================================
  // INFORMACIÓN GENERAL
  // ==========================================

  info: {
    title: "ShipNow API",
    version: "1.0.0",

    description: `
      API REST de ShipNow, una plataforma de gestión logística.

      Permite administrar usuarios, repartidores, productos,
      inventarios, pedidos y entregas.

      Incluye operaciones de gestión, control de stock,
      seguimiento de estados, generación de datos simulados
      y herramientas de diagnóstico.

      Tecnologías principales:
      - Node.js
      - Express 5
      - MongoDB
      - Mongoose
      - Zod
      - Winston
    `,

    contact: {
      name: "Gastón Jaureguiberry",
    },
  },

  // ==========================================
  // SERVIDOR LOCAL
  // ==========================================

  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: "Servidor local de desarrollo",
    },
  ],

  // ==========================================
  // TAGS
  // ==========================================

  tags: [
    {
      name: "Users",
      description: "Gestión de usuarios y repartidores",
    },
    {
      name: "Products",
      description: "Gestión de productos e inventario",
    },
    {
      name: "Orders",
      description: "Creación y administración de pedidos",
    },
    {
      name: "Deliveries",
      description: "Gestión y seguimiento de entregas",
    },
    {
      name: "Mocks",
      description: "Generación y persistencia de datos simulados",
    },
    {
      name: "Logger",
      description: "Herramientas de diagnóstico y logging",
    },
  ],

  // ==========================================
  // ENDPOINTS DOCUMENTADOS
  // ==========================================

  paths: {
    ...userPaths,
    ...productPaths,
    ...orderPaths,
    ...deliveryPaths,
    ...mockPaths,
    ...loggerPaths,
  },

  // ==========================================
  // COMPONENTES REUTILIZABLES
  // ==========================================

  components: {
    schemas,

    responses: {},

    parameters: {},
  },
};

export default swaggerConfig;
