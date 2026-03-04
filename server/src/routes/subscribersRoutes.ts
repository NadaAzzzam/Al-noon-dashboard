import { Router } from "express";
import { listSubscribers } from "../controllers/subscribersController.js";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateAdmin, requirePermission(["subscribers.view"]));
router.get("/", listSubscribers);

export default router;
