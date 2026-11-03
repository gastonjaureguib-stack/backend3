
import { Router } from "express";

import deliveryController from "../controllers/delivery.controller.js";

import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createDeliverySchema,
  updateDeliverySchema,
} from "../validations/delivery.validation.js";

const router = Router();

// ============================================
// CONSULTAR ENTREGAS
// ============================================

router.get(
  "/",
  deliveryController.getAll
);

router.get(
  "/order/:orderId",
  validateObjectId("orderId"),
  deliveryController.getByOrderId
);

router.get(
  "/:id",
  validateObjectId(),
  deliveryController.getById
);

// ============================================
// CREAR ENTREGA
// ============================================

router.post(
  "/",
  validate(createDeliverySchema),
  deliveryController.create
);

// ============================================
// ACTUALIZAR ENTREGA
// ============================================

router.patch(
  "/:id",
  validateObjectId(),
  validate(updateDeliverySchema),
  deliveryController.update
);

// ============================================
// CANCELAR ENTREGA
// ============================================

router.patch(
  "/:id/cancel",
  validateObjectId(),
  deliveryController.cancel
);

// ============================================
// ELIMINAR ENTREGA
// ============================================

router.delete(
  "/:id",
  validateObjectId(),
  deliveryController.delete
);

export default router;
