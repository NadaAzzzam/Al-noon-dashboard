import { Router } from "express";
import {
  getCustomer,
  getCustomerOrders,
  listUsers,
  updateUserRole
} from "../controllers/usersController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateRoleSchema, userParamsSchema } from "../validators/users.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(["users.view"]), listUsers);
router.get("/:id", requirePermission(["customers.view"]), validate(userParamsSchema), getCustomer);
router.get("/:id/orders", requirePermission(["customers.view"]), validate(userParamsSchema), getCustomerOrders);
router.patch("/:id/role", requirePermission(["users.manage"]), validate(updateRoleSchema), updateUserRole);

export default router;
