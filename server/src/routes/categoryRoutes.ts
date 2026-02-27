import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  setCategoryStatus,
  updateCategory
} from "../controllers/categoriesController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  categoryParamsSchema,
  categoryQuerySchema,
  categorySchema,
  categoryStatusSchema
} from "../validators/categories.js";

const router = Router();

router.get("/", validate(categoryQuerySchema), listCategories);

router.use(authenticate);
router.post("/", requirePermission(["categories.manage"]), validate(categorySchema), createCategory);
router.put("/:id", requirePermission(["categories.manage"]), validate(categorySchema.merge(categoryParamsSchema)), updateCategory);
router.patch("/:id/status", requirePermission(["categories.manage"]), validate(categoryStatusSchema), setCategoryStatus);
router.delete("/:id", requirePermission(["categories.manage"]), validate(categoryParamsSchema), deleteCategory);

export default router;
