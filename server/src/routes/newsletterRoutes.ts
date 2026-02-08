import { Router } from "express";
import { subscribeNewsletter } from "../controllers/storeController.js";
import { validate } from "../middlewares/validate.js";
import { subscribeNewsletterSchema } from "../validators/newsletter.js";

const router = Router();

/** Public: e-commerce footer form submits email. */
router.post("/subscribe", validate(subscribeNewsletterSchema), subscribeNewsletter);

export default router;
