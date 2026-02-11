import { Router } from "express";
import { listShippingMethods } from "../controllers/checkoutController.js";

const router = Router();

/** Public: list available shipping methods with prices */
router.get("/shipping-methods", listShippingMethods);

export default router;
