import { Product } from "../models/Product.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listProducts = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ products: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  }
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = req.query.status as string | undefined;
  const category = req.query.category as string | undefined;

  const filter: Record<string, unknown> = { deletedAt: null };
  if (status === "ACTIVE" || status === "INACTIVE") filter.status = status;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { description: new RegExp(search, "i") }
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name status")
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
    totalPages: Math.ceil(total / limit)
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOne({ _id: req.params.id, deletedAt: null }).populate(
    "category",
    "name status"
  );
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
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
  );
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ product });
});

export const setProductStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { status: req.body.status },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ product });
});
