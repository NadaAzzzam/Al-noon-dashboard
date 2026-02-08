import { Router } from "express";
import { getReports } from "../controllers/reportsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));
router.get("/", getReports);

export default router;
