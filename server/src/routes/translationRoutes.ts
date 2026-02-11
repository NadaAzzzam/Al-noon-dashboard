import express from 'express';
import {
  getTranslations,
  getTranslationByKey,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  bulkImportTranslations,
  exportTranslations,
} from '../controllers/translationController';
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Public routes (for storefront to fetch translations)
router.get('/export', getTranslations); // Get translations in JSON format

// Admin routes
router.get('/', authenticate, requireRole(["ADMIN"]), getTranslations);
router.get('/key/:key', authenticate, requireRole(["ADMIN"]), getTranslationByKey);
router.post('/', authenticate, requireRole(["ADMIN"]), createTranslation);
router.put('/:id', authenticate, requireRole(["ADMIN"]), updateTranslation);
router.delete('/:id', authenticate, requireRole(["ADMIN"]), deleteTranslation);
router.post('/bulk-import', authenticate, requireRole(["ADMIN"]), bulkImportTranslations);
router.get('/export-json', authenticate, requireRole(["ADMIN"]), exportTranslations);

export default router;
