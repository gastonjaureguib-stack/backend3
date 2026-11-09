
import { Router } from "express";

import deliveryController from "../controllers/delivery.controller.js";

import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createDeliverySchema,
  updateDeliverySchema,
} from "../validations/delivery.validation.js";

const router = Router();

router.get("/", deliveryController.getAll);

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

router.post(
  "/",
  validate(createDeliverySchema),
  deliveryController.create
);

router.patch(
  "/:id",
  validateObjectId(),
  validate(updateDeliverySchema),
  deliveryController.update
);

router.patch(
  "/:id/cancel",
  validateObjectId(),
  deliveryController.cancel
);

router.delete(
  "/:id",
  validateObjectId(),
  deliveryController.delete
);

export default router;
