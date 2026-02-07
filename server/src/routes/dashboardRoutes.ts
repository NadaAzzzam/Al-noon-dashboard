import { Router } from "express";
import { getStats } from "../controllers/dashboardController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(authenticate, requireRole(["ADMIN"]));
router.get("/stats", getStats);

export default router;
