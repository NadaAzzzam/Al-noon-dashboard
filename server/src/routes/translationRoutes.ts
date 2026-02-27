import express from "express";
import {
  getTranslations,
  getTranslationByKey,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  bulkImportTranslations,
  exportTranslations,
} from "../controllers/translationController";
import { authenticate, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

// Public routes (for storefront to fetch translations)
router.get("/export", getTranslations); // Get translations in JSON format

// Admin routes
router.get("/", authenticate, requirePermission(["translations.manage"]), getTranslations);
router.get("/key/:key", authenticate, requirePermission(["translations.manage"]), getTranslationByKey);
router.post("/", authenticate, requirePermission(["translations.manage"]), createTranslation);
router.put("/:id", authenticate, requirePermission(["translations.manage"]), updateTranslation);
router.delete("/:id", authenticate, requirePermission(["translations.manage"]), deleteTranslation);
router.post("/bulk-import", authenticate, requirePermission(["translations.manage"]), bulkImportTranslations);
router.get("/export-json", authenticate, requirePermission(["translations.manage"]), exportTranslations);

export default router;
