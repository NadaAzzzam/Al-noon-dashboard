import { Router } from "express";
import { getReports } from "../controllers/reportsController.js";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin, requirePermission(["reports.view"]));
router.get("/", getReports);

export default router;
