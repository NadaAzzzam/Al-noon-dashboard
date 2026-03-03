import { Router, type RequestHandler } from "express";
import {
  listDiscountCodes,
  getDiscountCode,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "../controllers/discountCodeController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  discountCodeCreateSchema,
  discountCodeUpdateSchema,
  discountCodeParamsSchema,
} from "../validators/discountCode.js";

const router = Router();

router.use(authenticate as RequestHandler);
router.get("/", listDiscountCodes);
router.get("/:id", validate(discountCodeParamsSchema) as RequestHandler, getDiscountCode);
router.post("/", requirePermission(["settings.manage"]), validate(discountCodeCreateSchema) as RequestHandler, createDiscountCode);
router.put("/:id", requirePermission(["settings.manage"]), validate(discountCodeUpdateSchema) as RequestHandler, updateDiscountCode);
router.delete("/:id", requirePermission(["settings.manage"]), validate(discountCodeParamsSchema) as RequestHandler, deleteDiscountCode);

export default router;
