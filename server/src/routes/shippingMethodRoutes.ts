import express from "express";
import {
  getShippingMethods,
  getShippingMethodById,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethod,
} from "../controllers/shippingMethodController";
import { authenticateAdmin, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

// Public route (for storefront)
router.get("/", getShippingMethods);

// Admin routes
router.get("/:id", authenticateAdmin, requirePermission(["shipping_methods.view"]), getShippingMethodById);
router.post("/", authenticateAdmin, requirePermission(["shipping_methods.manage"]), createShippingMethod);
router.put("/:id", authenticateAdmin, requirePermission(["shipping_methods.manage"]), updateShippingMethod);
router.delete("/:id", authenticateAdmin, requirePermission(["shipping_methods.manage"]), deleteShippingMethod);
router.patch("/:id/toggle", authenticateAdmin, requirePermission(["shipping_methods.manage"]), toggleShippingMethod);

export default router;
