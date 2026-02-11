import { Router } from "express";
import { listShippingMethods } from "../controllers/checkoutController.js";
import { createOrder } from "../controllers/ordersController.js";
import { optionalAuthenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { orderSchema } from "../validators/orders.js";

const router = Router();

/** Public: list available shipping methods with prices */
router.get("/shipping-methods", listShippingMethods);

/** Public: complete checkout (create order). Same body as POST /api/orders. Used by ecommerce storefront at checkout. */
router.post("/checkout", optionalAuthenticate, validate(orderSchema), createOrder);

export default router;
