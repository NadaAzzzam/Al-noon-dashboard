import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from "../controllers/departmentsController.js";
import {
  idParamsSchema,
  departmentCreateSchema,
  departmentUpdateSchema,
} from "../validators/department.js";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(["departments.view"]), listDepartments);
router.get("/:id", requirePermission(["departments.view"]), validate(idParamsSchema), getDepartment);
router.post("/", requirePermission(["departments.manage"]), validate(departmentCreateSchema), createDepartment);
router.put("/:id", requirePermission(["departments.manage"]), validate(departmentUpdateSchema), updateDepartment);
router.delete("/:id", requirePermission(["departments.manage"]), validate(idParamsSchema), deleteDepartment);

export default router;
