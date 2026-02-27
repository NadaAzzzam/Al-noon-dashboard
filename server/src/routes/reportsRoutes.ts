import { Router } from "express";
import { getReports } from "../controllers/reportsController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate, requirePermission(["reports.view"]));
router.get("/", getReports);

export default router;
