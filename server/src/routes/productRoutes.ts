import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  getProduct,
  listProducts,
  setProductStatus,
  updateProduct,
  updateStock
} from "../controllers/productsController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  listProductsQuerySchema,
  productParamsSchema,
  productSchema,
  productStatusSchema,
  productStockSchema
} from "../validators/products.js";

const router = Router();

router.get("/", validate(listProductsQuerySchema), listProducts);
router.get("/low-stock", authenticate, requireRole(["ADMIN"]), getLowStockProducts);
router.get("/out-of-stock", authenticate, requireRole(["ADMIN"]), getOutOfStockProducts);
router.get("/:id", validate(productParamsSchema), getProduct);

router.use(authenticate, requireRole(["ADMIN"]));
router.post("/", validate(productSchema), createProduct);
router.put("/:id", validate(productSchema.merge(productParamsSchema)), updateProduct);
router.patch("/:id/status", validate(productStatusSchema), setProductStatus);
router.patch("/:id/stock", validate(productStockSchema), updateStock);
router.delete("/:id", validate(productParamsSchema), deleteProduct);

export default router;
