import { Router } from "express";
import { getSettings, updateSettings, uploadLogo } from "../controllers/settingsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateSettingsSchema } from "../validators/settings.js";
import { uploadLogo as multerUploadLogo } from "../middlewares/upload.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));
router.get("/", getSettings);
router.put("/", validate(updateSettingsSchema), updateSettings);
router.post("/logo", multerUploadLogo, uploadLogo);

export default router;
