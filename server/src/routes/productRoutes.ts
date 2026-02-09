import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAvailabilityFilters,
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
import { authenticate, requireRole } from "../middlewares/auth.js";
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

router.get("/", validate(productQuerySchema), listProducts);
router.get("/filters/availability", getAvailabilityFilters);
router.get("/filters/sort", getSortFilters);
router.get("/:id/related", validate(productParamsSchema), getRelatedProducts);
router.get("/:id", validate(productParamsSchema), getProduct);

router.use(authenticate, requireRole(["ADMIN"]));
router.post("/images", multerProductImages, uploadProductImages);
router.post("/videos", multerProductVideos, uploadProductVideos);
router.post("/", validate(productSchema), createProduct);
router.put("/:id", validate(productSchema.merge(productParamsSchema)), updateProduct);
router.patch("/:id/status", validate(productStatusSchema), setProductStatus);
router.patch("/:id/stock", validate(stockUpdateSchema), updateStock);
router.delete("/:id", validate(productParamsSchema), deleteProduct);

export default router;
