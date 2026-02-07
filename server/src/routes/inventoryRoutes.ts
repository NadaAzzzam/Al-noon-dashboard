import { Router } from "express";
import {
  getLowStock,
  getOutOfStock
} from "../controllers/inventoryController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));

router.get("/low-stock", getLowStock);
router.get("/out-of-stock", getOutOfStock);

export default router;
