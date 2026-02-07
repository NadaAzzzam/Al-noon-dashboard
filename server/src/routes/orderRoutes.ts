import { Router } from "express";
import {
  cancelOrder,
  confirmPayment,
  createOrder,
  getOrder,
  listOrders,
  updateOrderPayment,
  updateOrderStatus
} from "../controllers/ordersController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  listOrdersQuerySchema,
  orderParamsSchema,
  orderPaymentSchema,
  orderSchema,
  orderStatusSchema
} from "../validators/orders.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listOrdersQuerySchema), listOrders);
router.get("/:id", validate(orderParamsSchema), getOrder);
router.post("/", validate(orderSchema), createOrder);
router.patch("/:id/status", requireRole(["ADMIN"]), validate(orderStatusSchema), updateOrderStatus);
router.patch("/:id/payment", requireRole(["ADMIN"]), validate(orderPaymentSchema), updateOrderPayment);
router.post("/:id/cancel", requireRole(["ADMIN"]), validate(orderParamsSchema), cancelOrder);
router.post("/:id/confirm-payment", requireRole(["ADMIN"]), validate(orderParamsSchema), confirmPayment);

export default router;
