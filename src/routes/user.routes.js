
import { Router } from "express";

import userController from "../controllers/user.controller.js";

import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createUserSchema,
  updateUserSchema,
} from "../validations/user.validation.js";

const router = Router();

// ============================================
// CONSULTAR USUARIOS
// ============================================

router.get(
  "/",
  userController.getAll
);

router.get(
  "/:id",
  validateObjectId(),
  userController.getById
);

// ============================================
// CREAR USUARIO
// ============================================

router.post(
  "/",
  validate(createUserSchema),
  userController.create
);

// ============================================
// ACTUALIZAR USUARIO
// ============================================

router.patch(
  "/:id",
  validateObjectId(),
  validate(updateUserSchema),
  userController.update
);

// ============================================
// ELIMINAR USUARIO
// ============================================

router.delete(
  "/:id",
  validateObjectId(),
  userController.delete
);

export default router;
