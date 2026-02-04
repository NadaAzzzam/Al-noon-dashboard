import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct
} from "../controllers/productsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { productParamsSchema, productSchema } from "../validators/products.js";

const router = Router();

router.get("/", listProducts);
router.get("/:id", validate(productParamsSchema), getProduct);

router.use(authenticate, requireRole(["ADMIN"]));
router.post("/", validate(productSchema), createProduct);
router.put("/:id", validate(productSchema.merge(productParamsSchema)), updateProduct);
router.delete("/:id", validate(productParamsSchema), deleteProduct);

export default router;
