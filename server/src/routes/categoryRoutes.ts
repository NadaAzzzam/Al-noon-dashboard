import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  setCategoryStatus,
  updateCategory
} from "../controllers/categoriesController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  categoryParamsSchema,
  categorySchema,
  categoryStatusSchema
} from "../validators/categories.js";

const router = Router();

router.get("/", listCategories);

router.use(authenticate, requireRole(["ADMIN"]));
router.post("/", validate(categorySchema), createCategory);
router.put("/:id", validate(categorySchema.merge(categoryParamsSchema)), updateCategory);
router.patch("/:id/status", validate(categoryStatusSchema), setCategoryStatus);
router.delete("/:id", validate(categoryParamsSchema), deleteCategory);

export default router;
