import { Router } from "express";
import { getStore, getPageBySlug, submitContact } from "../controllers/storeController.js";
import { validate } from "../middlewares/validate.js";
import { submitContactSchema } from "../validators/contact.js";

const router = Router();

/** Public: e-commerce storefront fetches store name, logo, quick links, social links, newsletter flag. */
router.get("/", getStore);
/** Public: get rich-text content for a footer page (privacy, return-policy, shipping-policy, about, contact). */
router.get("/page/:slug", getPageBySlug);
/** Public: submit Contact Us form (name, email*, phone, comment). */
router.post("/contact", validate(submitContactSchema), submitContact);

export default router;
