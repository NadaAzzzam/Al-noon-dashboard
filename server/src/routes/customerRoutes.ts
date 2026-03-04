import { Router } from "express";
import { getCustomer, getCustomerOrders, listCustomers } from "../controllers/usersController.js";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { userParamsSchema } from "../validators/users.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/", requirePermission(["customers.view"]), listCustomers);
router.get("/:id", requirePermission(["customers.view"]), validate(userParamsSchema), getCustomer);
router.get("/:id/orders", requirePermission(["customers.view"]), validate(userParamsSchema), getCustomerOrders);

export default router;
