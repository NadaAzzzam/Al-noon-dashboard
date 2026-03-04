import { Router } from "express";
import { getStats, getTopSelling } from "../controllers/dashboardController.js";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin, requirePermission(["dashboard.view"]));
router.get("/top-selling", getTopSelling);
router.get("/stats", getStats);

export default router;
