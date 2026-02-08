import { Router } from "express";
import { getStats, getTopSelling } from "../controllers/dashboardController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));
router.get("/top-selling", getTopSelling);
router.get("/stats", getStats);

export default router;
