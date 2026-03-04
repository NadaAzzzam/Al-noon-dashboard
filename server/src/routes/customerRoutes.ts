import { Router } from "express";
import { getCustomer, getCustomerOrders, listCustomers, updateCustomerPassword } from "../controllers/usersController.js";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { userParamsSchema, updateCustomerPasswordSchema } from "../validators/users.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/", requirePermission(["customers.view"]), listCustomers);
router.get("/:id", requirePermission(["customers.view"]), validate(userParamsSchema), getCustomer);
router.get("/:id/orders", requirePermission(["customers.view"]), validate(userParamsSchema), getCustomerOrders);
router.put("/:id/password", requirePermission(["customers.view"]), validate(updateCustomerPasswordSchema), updateCustomerPassword);

export default router;
