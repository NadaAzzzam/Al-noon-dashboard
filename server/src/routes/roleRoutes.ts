import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import {
  createRole,
  deleteRole,
  getRole,
  listPermissionDefinitions,
  listRoles,
  updateRole,
} from "../controllers/rolesController.js";

const router = Router();

router.use(authenticate, requirePermission(["roles.manage"]));

router.get("/", listRoles);
router.get("/permissions", listPermissionDefinitions);
router.get("/:id", getRole);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;

import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createRole, deleteRole, getRole, listRoles, updateRole } from "../controllers/rolesController.js";
import { idParamsSchema, roleCreateSchema, roleUpdateSchema } from "../validators/rbac.js";

const router = Router();

// Any ADMIN user can manage roles; backend still prevents deleting roles in use.
router.use(authenticate, requireRole(["ADMIN"]));

router.get("/", listRoles);
router.get("/:id", validate(idParamsSchema), getRole);
router.post("/", validate(roleCreateSchema), createRole);
router.put("/:id", validate(roleUpdateSchema), updateRole);
router.delete("/:id", validate(idParamsSchema), deleteRole);

export default router;

