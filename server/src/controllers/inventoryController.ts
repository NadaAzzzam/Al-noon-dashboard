import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getLowStockThreshold(): Promise<number> {
  if (!isDbConnected()) return 5;
  const settings = await Settings.findOne().lean();
  return settings?.lowStockThreshold ?? 5;
}

export const getLowStock = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    return res.json({ products: [] });
  }
  const threshold = await getLowStockThreshold();
  const products = await Product.find({
    deletedAt: null,
    $and: [{ stock: { $gt: 0 } }, { stock: { $lte: threshold } }]
  })
    .populate("category", "name")
    .sort({ stock: 1 })
    .lean();
  res.json({ products, threshold });
});

export const getOutOfStock = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    return res.json({ products: [] });
  }
  const products = await Product.find({ deletedAt: null, stock: 0 })
    .populate("category", "name")
    .sort({ name: 1 })
    .lean();
  res.json({ products });
});

export const updateStock = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const stock = Number(req.body.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ApiError(400, "Stock must be a non-negative integer");
  }
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { stock },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ product });
});
