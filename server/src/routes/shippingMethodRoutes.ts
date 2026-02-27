import express from "express";
import {
  getShippingMethods,
  getShippingMethodById,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethod,
} from "../controllers/shippingMethodController";
import { authenticate, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

// Public route (for storefront)
router.get("/", getShippingMethods);

// Admin routes
router.get("/:id", authenticate, requirePermission(["shipping_methods.view"]), getShippingMethodById);
router.post("/", authenticate, requirePermission(["shipping_methods.manage"]), createShippingMethod);
router.put("/:id", authenticate, requirePermission(["shipping_methods.manage"]), updateShippingMethod);
router.delete("/:id", authenticate, requirePermission(["shipping_methods.manage"]), deleteShippingMethod);
router.patch("/:id/toggle", authenticate, requirePermission(["shipping_methods.manage"]), toggleShippingMethod);

export default router;
