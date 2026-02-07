import { Router } from "express";
import {
  getCustomer,
  getCustomerOrders,
  listUsers,
  updateUserRole
} from "../controllers/usersController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateRoleSchema, userParamsSchema } from "../validators/users.js";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));

router.get("/", listUsers);
router.get("/:id", validate(userParamsSchema), getCustomer);
router.get("/:id/orders", validate(userParamsSchema), getCustomerOrders);
router.patch("/:id/role", validate(updateRoleSchema), updateUserRole);

export default router;
