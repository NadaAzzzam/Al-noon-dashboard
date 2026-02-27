import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus
} from "../controllers/ordersController.js";
import { attachPaymentProof, confirmPayment } from "../controllers/paymentsController.js";
import { authenticate, optionalAuthenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  orderParamsSchema,
  orderQuerySchema,
  orderSchema,
  orderStatusSchema
} from "../validators/orders.js";
import { uploadPaymentProof } from "../middlewares/upload.js";
import { paymentConfirmSchema } from "../validators/payments.js";

const router = Router();

// POST /api/orders: allow guest checkout (optional auth) when body has guestName + guestEmail
router.post("/", optionalAuthenticate, validate(orderSchema), createOrder);

// All other order routes require authentication
router.use(authenticate);

router.get("/", requirePermission(["orders.view"]), validate(orderQuerySchema), listOrders);
router.get("/:id", requirePermission(["orders.view"]), validate(orderParamsSchema), getOrder);
router.patch("/:id/status", requirePermission(["orders.manage"]), validate(orderStatusSchema), updateOrderStatus);
router.post("/:id/cancel", requirePermission(["orders.manage"]), validate(orderParamsSchema), cancelOrder);
router.post("/:id/payment-proof", requirePermission(["orders.manage"]), validate(orderParamsSchema), uploadPaymentProof, attachPaymentProof);
router.post("/:id/payments/confirm", requirePermission(["orders.manage"]), validate(paymentConfirmSchema), confirmPayment);

export default router;
