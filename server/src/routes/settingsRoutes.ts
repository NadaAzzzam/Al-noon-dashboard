import { Router } from "express";
import { getSettings, getPublicSettings, updateSettings, sendTestOrderEmail, uploadLogo, uploadCollectionImage, uploadHeroImage, uploadSectionImage, uploadHeroVideo, uploadSectionVideo, uploadPromoImage, uploadHomePageMedia } from "../controllers/settingsController.js";
import { authenticate, optionalAuthenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateSettingsSchema } from "../validators/settings.js";
import { uploadLogo as multerUploadLogo, uploadCollectionImage as multerUploadCollectionImage, uploadHeroImage as multerUploadHeroImage, uploadSectionImage as multerUploadSectionImage, uploadHeroVideo as multerUploadHeroVideo, uploadSectionVideo as multerUploadSectionVideo, uploadPromoImage as multerUploadPromoImage, createHomePageMediaUpload } from "../middlewares/upload.js";

const router = Router();

/** GET /api/settings: with ADMIN token returns full settings; without token or with USER token returns public settings (storefront-safe). Stops 401/403 for ecommerce. */
router.get("/", optionalAuthenticate, (req, res, next) => {
  if (req.auth?.role === "ADMIN") return getSettings(req, res, next);
  return getPublicSettings(req, res, next);
});

router.use(authenticate, requireRole(["ADMIN"]));
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
