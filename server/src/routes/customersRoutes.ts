import { Router } from "express";
import {
  getCustomer,
  getCustomerOrders,
  listCustomers
} from "../controllers/customersController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const customerParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});

const router = Router();
router.use(authenticate, requireRole(["ADMIN"]));
router.get("/", listCustomers);
router.get("/:id", validate(customerParamsSchema), getCustomer);
router.get("/:id/orders", validate(customerParamsSchema), getCustomerOrders);

export default router;
