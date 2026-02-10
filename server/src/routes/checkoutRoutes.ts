import { Router } from "express";
import { listShippingMethods, listGovernorates } from "../controllers/checkoutController.js";

const router = Router();

/** Public: list available shipping methods with prices */
router.get("/shipping-methods", listShippingMethods);

/** Public: list Egyptian governorates (Egypt only) */
router.get("/governorates", listGovernorates);

export default router;
