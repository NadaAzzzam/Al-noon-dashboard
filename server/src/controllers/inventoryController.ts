import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

async function getLowStockThreshold(): Promise<number> {
  if (!isDbConnected()) return 5;
  const settings = await Settings.findOne().lean();
  return settings?.lowStockThreshold ?? 5;
}

export const getLowStock = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { products: [], threshold: 5 } });
  }
  const threshold = await getLowStockThreshold();
  const products = await Product.find({
    deletedAt: null,
    $and: [{ stock: { $gt: 0 } }, { stock: { $lte: threshold } }]
  })
    .populate("category", "name")
    .sort({ stock: 1 })
    .lean();
  sendResponse(res, req.locale, { data: { products, threshold } });
});

export const getOutOfStock = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { products: [] } });
  }
  const products = await Product.find({ deletedAt: null, stock: 0 })
    .populate("category", "name")
    .sort({ name: 1 })
    .lean();
  sendResponse(res, req.locale, { data: { products } });
});

export const updateStock = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const stock = Number(req.body.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ApiError(400, "Stock must be a non-negative integer", { code: "errors.inventory.invalid_stock" });
  }
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { stock },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found", { code: "errors.product.not_found" });
  }
  sendResponse(res, req.locale, { message: "success.inventory.stock_updated", data: { product } });
});
