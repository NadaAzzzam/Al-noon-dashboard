import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  setProductStatus,
  updateProduct,
  uploadProductImages
} from "../controllers/productsController.js";
import { updateStock } from "../controllers/inventoryController.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { uploadProductImages as multerProductImages } from "../middlewares/upload.js";
import {
  productParamsSchema,
  productQuerySchema,
  productSchema,
  productStatusSchema
} from "../validators/products.js";
import { stockUpdateSchema } from "../validators/inventory.js";

const router = Router();

router.get("/", validate(productQuerySchema), listProducts);
router.get("/:id", validate(productParamsSchema), getProduct);

router.use(authenticate, requireRole(["ADMIN"]));
router.post("/images", multerProductImages, uploadProductImages);
router.post("/", validate(productSchema), createProduct);
router.put("/:id", validate(productSchema.merge(productParamsSchema)), updateProduct);
router.patch("/:id/status", validate(productStatusSchema), setProductStatus);
router.patch("/:id/stock", validate(stockUpdateSchema), updateStock);
router.delete("/:id", validate(productParamsSchema), deleteProduct);

export default router;
