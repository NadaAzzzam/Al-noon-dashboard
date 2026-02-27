import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
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

// ADMIN users can manage roles; backend prevents deleting ADMIN role.
router.use(authenticate, requireRole(["ADMIN"]));

router.get("/", listRoles);
router.get("/permissions", listPermissionDefinitions);
router.get("/:id", validate(idParamsSchema), getRole);
router.post("/", validate(roleCreateSchema), createRole);
router.put("/:id", validate(roleUpdateSchema), updateRole);
router.delete("/:id", validate(idParamsSchema), deleteRole);

export default router;

