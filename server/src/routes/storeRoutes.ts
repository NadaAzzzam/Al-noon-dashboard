import { Router } from "express";
import { getStoreHome, getStoreSettings, getPageBySlug, submitContact } from "../controllers/storeController.js";
import { validate } from "../middlewares/validate.js";
import { submitContactSchema } from "../validators/contact.js";

const router = Router();

/** Public: storefront-safe settings (store name, logo, announcement, social, newsletter, content page slugs). No auth. Use instead of GET /api/settings when not admin. */
router.get("/settings", getStoreSettings);
/** Public: single home page API – all sections (hero, newArrivals products with media, collections, feedbacks, section images/videos). */
router.get("/home", getStoreHome);
/** Public: get rich-text content for a footer page (privacy, return-policy, shipping-policy, about, contact). */
router.get("/page/:slug", getPageBySlug);
/** Public: submit Contact Us form (name, email*, phone, comment). */
router.post("/contact", validate(submitContactSchema), submitContact);

export default router;
