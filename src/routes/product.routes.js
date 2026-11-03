
import { Router } from "express";

import productController from "../controllers/product.controller.js";

import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createProductSchema,
  updateProductSchema,
  adjustProductStockSchema,
} from "../validations/product.validation.js";

const router = Router();

// ============================================
// CONSULTAR PRODUCTOS
// ============================================

router.get(
  "/",
  productController.getAll
);

router.get(
  "/:id",
  validateObjectId(),
  productController.getById
);

// ============================================
// CREAR PRODUCTO
// ============================================

router.post(
  "/",
  validate(createProductSchema),
  productController.create
);

// ============================================
// ACTUALIZAR DATOS GENERALES
// ============================================

router.patch(
  "/:id",
  validateObjectId(),
  validate(updateProductSchema),
  productController.update
);

// ============================================
// AJUSTAR INVENTARIO
// ============================================

router.patch(
  "/:id/stock",
  validateObjectId(),
  validate(adjustProductStockSchema),
  productController.adjustStock
);

// ============================================
// ELIMINAR PRODUCTO
// ============================================

router.delete(
  "/:id",
  validateObjectId(),
  productController.delete
);

export default router;
