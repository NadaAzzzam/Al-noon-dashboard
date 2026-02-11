import { Router } from "express";
import { getSettings, updateSettings, sendTestOrderEmail, uploadLogo, uploadCollectionImage, uploadHeroImage, uploadSectionImage, uploadHeroVideo, uploadSectionVideo, uploadPromoImage, uploadHomePageMedia } from "../controllers/settingsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateSettingsSchema } from "../validators/settings.js";
import { uploadLogo as multerUploadLogo, uploadCollectionImage as multerUploadCollectionImage, uploadHeroImage as multerUploadHeroImage, uploadSectionImage as multerUploadSectionImage, uploadHeroVideo as multerUploadHeroVideo, uploadSectionVideo as multerUploadSectionVideo, uploadPromoImage as multerUploadPromoImage, createHomePageMediaUpload } from "../middlewares/upload.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));
router.get("/", getSettings);
router.put("/", validate(updateSettingsSchema), updateSettings);
router.post("/test-order-email", sendTestOrderEmail);
router.post("/logo", multerUploadLogo, uploadLogo);

// New unified endpoint - accepts query param `type`: 'hero' | 'section' | 'collection' | 'promo'
// Automatically detects if file is image or video
router.post("/upload-media", createHomePageMediaUpload(), uploadHomePageMedia);

// Legacy endpoints (deprecated but kept for backward compatibility)
router.post("/collection-image", multerUploadCollectionImage, uploadCollectionImage);
router.post("/hero-image", multerUploadHeroImage, uploadHeroImage);
router.post("/hero-video", multerUploadHeroVideo, uploadHeroVideo);
router.post("/section-image", multerUploadSectionImage, uploadSectionImage);
router.post("/section-video", multerUploadSectionVideo, uploadSectionVideo);
router.post("/promo-image", multerUploadPromoImage, uploadPromoImage);

export default router;
