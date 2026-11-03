
import { Router } from "express";

import orderController from "../controllers/order.controller.js";

import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createOrderSchema,
  updateOrderSchema,
} from "../validations/order.validation.js";

const router = Router();

// ============================================
// CONSULTAR PEDIDOS
// ============================================

router.get(
  "/",
  orderController.getAll
);

router.get(
  "/:id",
  validateObjectId(),
  orderController.getById
);

// ============================================
// CREAR PEDIDO
// ============================================

router.post(
  "/",
  validate(createOrderSchema),
  orderController.create
);

// ============================================
// ACTUALIZAR PEDIDO
// ============================================

router.patch(
  "/:id",
  validateObjectId(),
  validate(updateOrderSchema),
  orderController.update
);

// ============================================
// ELIMINAR PEDIDO
// ============================================

router.delete(
  "/:id",
  validateObjectId(),
  orderController.delete
);

export default router;
