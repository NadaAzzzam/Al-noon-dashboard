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
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

// Public routes (for storefront to fetch translations)
router.get("/export", getTranslations); // Get translations in JSON format

// Admin routes
router.get("/", authenticateAdmin, requirePermission(["translations.manage"]), getTranslations);
router.get("/key/:key", authenticateAdmin, requirePermission(["translations.manage"]), getTranslationByKey);
router.post("/", authenticateAdmin, requirePermission(["translations.manage"]), createTranslation);
router.put("/:id", authenticateAdmin, requirePermission(["translations.manage"]), updateTranslation);
router.delete("/:id", authenticateAdmin, requirePermission(["translations.manage"]), deleteTranslation);
router.post("/bulk-import", authenticateAdmin, requirePermission(["translations.manage"]), bulkImportTranslations);
router.get("/export-json", authenticateAdmin, requirePermission(["translations.manage"]), exportTranslations);

export default router;
