import { Router } from "express";

import userController from "../controllers/user.controller.js";
import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validations/user.validation.js";

const router = Router();

router.get("/", userController.getAll);

router.get(
  "/:id",
  validateObjectId,
  userController.getById
);

router.post(
  "/",
  validate(createUserSchema),
  userController.create
);

router.patch(
  "/:id",
  validateObjectId,
  validate(updateUserSchema),
  userController.update
);

router.delete(
  "/:id",
  validateObjectId,
  userController.delete
);

export default router;