import { Router } from "express";
import {
  getLowStock,
  getOutOfStock
} from "../controllers/inventoryController.js";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin, requirePermission(["inventory.view"]));

router.get("/low-stock", getLowStock);
router.get("/out-of-stock", getOutOfStock);

export default router;
