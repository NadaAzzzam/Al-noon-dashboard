import { Router } from "express";
import { listSubscribers } from "../controllers/subscribersController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));
router.get("/", listSubscribers);

export default router;
