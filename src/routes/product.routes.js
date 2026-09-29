import { Router } from "express";

import productController from "../controllers/product.controller.js";
import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation.js";

const router = Router();

router.get("/", productController.getAll);

router.get(
  "/:id",
  validateObjectId,
  productController.getById
);

router.post(
  "/",
  validate(createProductSchema),
  productController.create
);

router.patch(
  "/:id",
  validateObjectId,
  validate(updateProductSchema),
  productController.update
);

router.delete(
  "/:id",
  validateObjectId,
  productController.delete
);

export default router;