import { Router } from "express";
import { getPaymentMethods } from "../controllers/paymentMethodController.js";

const router = Router();

/** Public: get enabled payment methods for e-commerce (checkout, storefront). */
router.get("/", getPaymentMethods);

export default router;
