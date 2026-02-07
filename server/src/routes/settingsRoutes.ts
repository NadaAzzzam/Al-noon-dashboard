import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateSettingsSchema } from "../validators/settings.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));
router.get("/", getSettings);
router.put("/", validate(updateSettingsSchema), updateSettings);

export default router;
