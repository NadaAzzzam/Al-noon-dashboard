import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getRelatedProducts,
  getSortFilters,
  listProducts,
  setProductStatus,
  updateProduct,
  uploadProductImages,
  uploadProductVideos
} from "../controllers/productsController.js";
import { updateStock } from "../controllers/inventoryController.js";
import { authenticate, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { uploadProductImages as multerProductImages, uploadProductVideos as multerProductVideos } from "../middlewares/upload.js";
import {
  productParamsSchema,
  productQuerySchema,
  productSchema,
  productStatusSchema
} from "../validators/products.js";
import { stockUpdateSchema } from "../validators/inventory.js";

const router = Router();

router.get("/filters/sort", getSortFilters);
router.get("/", validate(productQuerySchema), listProducts);
router.get("/:id/related", validate(productParamsSchema), getRelatedProducts);
router.get("/:id", validate(productParamsSchema), getProduct);

router.use(authenticate);
router.post("/images", requirePermission(["products.manage"]), multerProductImages, uploadProductImages);
router.post("/videos", requirePermission(["products.manage"]), multerProductVideos, uploadProductVideos);
router.post("/", requirePermission(["products.manage"]), validate(productSchema), createProduct);
router.put("/:id", requirePermission(["products.manage"]), validate(productSchema.merge(productParamsSchema)), updateProduct);
router.patch("/:id/status", requirePermission(["products.manage"]), validate(productStatusSchema), setProductStatus);
router.patch("/:id/stock", requirePermission(["inventory.manage"]), validate(stockUpdateSchema), updateStock);
router.delete("/:id", requirePermission(["products.manage"]), validate(productParamsSchema), deleteProduct);

export default router;
