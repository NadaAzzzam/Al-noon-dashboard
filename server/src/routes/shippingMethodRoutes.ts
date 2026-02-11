import express from 'express';
import {
  getShippingMethods,
  getShippingMethodById,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethod,
} from '../controllers/shippingMethodController';
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Public route (for storefront)
router.get('/', getShippingMethods);

// Admin routes
router.get('/:id', authenticate, requireRole(["ADMIN"]), getShippingMethodById);
router.post('/', authenticate, requireRole(["ADMIN"]), createShippingMethod);
router.put('/:id', authenticate, requireRole(["ADMIN"]), updateShippingMethod);
router.delete('/:id', authenticate, requireRole(["ADMIN"]), deleteShippingMethod);
router.patch('/:id/toggle', authenticate, requireRole(["ADMIN"]), toggleShippingMethod);

export default router;
