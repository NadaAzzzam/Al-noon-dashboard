import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus
} from "../controllers/ordersController.js";
import { attachPaymentProof, confirmPayment } from "../controllers/paymentsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
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

router.use(authenticate);

router.get("/", validate(orderQuerySchema), listOrders);
router.get("/:id", validate(orderParamsSchema), getOrder);
router.post("/", validate(orderSchema), createOrder);
router.patch("/:id/status", requireRole(["ADMIN"]), validate(orderStatusSchema), updateOrderStatus);
router.post("/:id/cancel", requireRole(["ADMIN"]), validate(orderParamsSchema), cancelOrder);
router.post("/:id/payment-proof", requireRole(["ADMIN"]), validate(orderParamsSchema), uploadPaymentProof, attachPaymentProof);
router.post("/:id/payments/confirm", requireRole(["ADMIN"]), validate(paymentConfirmSchema), confirmPayment);

export default router;
