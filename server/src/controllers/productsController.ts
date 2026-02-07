import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const defaultLimit = 20;

export const listProducts = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    res.json({ products: [], total: 0, page: 1, limit: defaultLimit, totalPages: 0 });
    return;
  }
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || defaultLimit, 100);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const category = req.query.category as string | undefined;
  const status = req.query.status as "ACTIVE" | "INACTIVE" | undefined;

  const filter: Record<string, unknown> = { deletedAt: null };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { description: new RegExp(search, "i") }
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name isVisible")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.json({
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOne({ _id: req.params.id, deletedAt: null }).populate("category", "name isVisible");
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    req.body,
    { new: true }
  ).populate("category", "name");
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!product) throw new ApiError(404, "Product not found");
  res.status(204).send();
});

export const setProductStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { status: req.body.status },
    { new: true }
  ).populate("category", "name");
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ product });
});

export const updateStock = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { stock: req.body.stock },
    { new: true }
  );
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ product });
});

export const getLowStockProducts = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ products: [] });
    return;
  }
  const settings = await Settings.findOne().lean();
  const threshold = settings?.lowStockThreshold ?? 5;
  const products = await Product.find({
    deletedAt: null,
    stock: { $gt: 0, $lte: threshold }
  })
    .populate("category", "name")
    .sort({ stock: 1 })
    .lean();
  res.json({ products, threshold });
});

export const getOutOfStockProducts = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ products: [] });
    return;
  }
  const products = await Product.find({ deletedAt: null, stock: 0 })
    .populate("category", "name")
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ products });
});
