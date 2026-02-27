import { Router } from "express";
import {
  createUser,
  listDepartmentOptions,
  listRoleOptions,
  listUsers,
  updateUser,
  updateUserRole
} from "../controllers/usersController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createUserSchema, updateRoleSchema, updateUserSchema, userParamsSchema } from "../validators/users.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(["users.view"]), listUsers);
router.get("/role-options", requirePermission(["users.manage"]), listRoleOptions);
router.get("/department-options", requirePermission(["users.manage"]), listDepartmentOptions);
router.post("/", requirePermission(["users.manage"]), validate(createUserSchema), createUser);
router.put("/:id", requirePermission(["users.manage"]), validate(updateUserSchema), updateUser);
router.patch("/:id/role", requirePermission(["users.manage"]), validate(updateRoleSchema), updateUserRole);

export default router;
