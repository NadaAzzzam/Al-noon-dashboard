import { Router } from "express";
import { getSettings, updateSettings, uploadLogo, uploadCollectionImage, uploadHeroImage, uploadSectionImage, uploadHeroVideo, uploadSectionVideo, uploadPromoImage } from "../controllers/settingsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateSettingsSchema } from "../validators/settings.js";
import { uploadLogo as multerUploadLogo, uploadCollectionImage as multerUploadCollectionImage, uploadHeroImage as multerUploadHeroImage, uploadSectionImage as multerUploadSectionImage, uploadHeroVideo as multerUploadHeroVideo, uploadSectionVideo as multerUploadSectionVideo, uploadPromoImage as multerUploadPromoImage } from "../middlewares/upload.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));
router.get("/", getSettings);
router.put("/", validate(updateSettingsSchema), updateSettings);
router.post("/logo", multerUploadLogo, uploadLogo);
router.post("/collection-image", multerUploadCollectionImage, uploadCollectionImage);
router.post("/hero-image", multerUploadHeroImage, uploadHeroImage);
router.post("/hero-video", multerUploadHeroVideo, uploadHeroVideo);
router.post("/section-image", multerUploadSectionImage, uploadSectionImage);
router.post("/section-video", multerUploadSectionVideo, uploadSectionVideo);
router.post("/promo-image", multerUploadPromoImage, uploadPromoImage);

export default router;
