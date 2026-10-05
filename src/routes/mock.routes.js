import { Router } from "express";

import {
  getUsersMock,
  getDriversMock,
  getProductsMock,
  getOrdersMock,
  getDeliveriesMock,
  seedMocks,
} from "../controllers/mock.controller.js";

const router = Router();

router.get("/users", getUsersMock);
router.get("/drivers", getDriversMock);
router.get("/products", getProductsMock);
router.get("/orders", getOrdersMock);
router.get("/deliveries", getDeliveriesMock);

router.post("/seed", seedMocks);

export default router;