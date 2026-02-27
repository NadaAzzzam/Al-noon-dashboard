import { Router } from "express";
import { listSubscribers } from "../controllers/subscribersController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate, requirePermission(["subscribers.view"]));
router.get("/", listSubscribers);

export default router;
