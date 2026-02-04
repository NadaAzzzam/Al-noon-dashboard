import { Router } from "express";
import { createOrder, listOrders, updateOrderStatus } from "../controllers/ordersController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { orderSchema, orderStatusSchema } from "../validators/orders.js";

const router = Router();

router.use(authenticate);

router.get("/", listOrders);
router.post("/", validate(orderSchema), createOrder);
router.patch("/:id/status", requireRole(["ADMIN"]), validate(orderStatusSchema), updateOrderStatus);

export default router;
