import { Router } from "express";
import { authenticate, requirePermission, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createRole,
  deleteRole,
  getRole,
  listPermissionDefinitions,
  listRoles,
  updateRole,
} from "../controllers/rolesController.js";
import { idParamsSchema, roleCreateSchema, roleUpdateSchema } from "../validators/rbac.js";

const router = Router();

router.use(authenticate);

// List roles: allow roles.view OR departments.manage (for department form dropdown)
router.get("/", requirePermission(["roles.view", "departments.manage"]), listRoles);
router.get("/permissions", listPermissionDefinitions);
router.get("/:id", requirePermission(["roles.view", "departments.manage"]), validate(idParamsSchema), getRole);

// Create, update, delete: ADMIN only
router.post("/", requireRole(["ADMIN"]), validate(roleCreateSchema), createRole);
router.put("/:id", requireRole(["ADMIN"]), validate(roleUpdateSchema), updateRole);
router.delete("/:id", requireRole(["ADMIN"]), validate(idParamsSchema), deleteRole);

export default router;

