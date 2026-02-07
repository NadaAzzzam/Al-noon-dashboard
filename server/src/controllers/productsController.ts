import type { Request } from "express";
import { Product } from "../models/Product.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { productImagePath } from "../middlewares/upload.js";

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
    const re = new RegExp(search, "i");
    filter.$or = [
      { "name.en": re },
      { "name.ar": re },
      { "description.en": re },
      { "description.ar": re }
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

function mapBodyToProduct(body: Record<string, unknown>) {
  const { nameEn, nameAr, descriptionEn, descriptionAr, sizes, sizeDescriptions, colors, images, imageColors, ...rest } = body;
  const payload: Record<string, unknown> = { ...rest };
  if (nameEn !== undefined || nameAr !== undefined) {
    payload.name = { en: String(nameEn ?? "").trim(), ar: String(nameAr ?? "").trim() };
  }
  if (descriptionEn !== undefined || descriptionAr !== undefined) {
    payload.description = { en: String(descriptionEn ?? "").trim(), ar: String(descriptionAr ?? "").trim() };
  }
  if (sizes !== undefined) {
    const sizeArr = Array.isArray(sizes) ? sizes.map((s) => String(s).trim()).filter(Boolean) : [];
    payload.sizes = sizeArr;
    const descArr = Array.isArray(sizeDescriptions) ? sizeDescriptions.map((d) => String(d ?? "").trim()) : [];
    payload.sizeDescriptions = sizeArr.map((_: string, i: number) => descArr[i] ?? "");
  }
  if (colors !== undefined) {
    payload.colors = Array.isArray(colors) ? colors.map((c) => String(c).trim()).filter(Boolean) : [];
  }
  if (images !== undefined && Array.isArray(images)) {
    payload.images = images.map((p) => String(p));
    const colorArr = Array.isArray(imageColors) ? imageColors.map((c) => String(c ?? "").trim()) : [];
    payload.imageColors = payload.images.map((_: unknown, i: number) => colorArr[i] ?? "");
  }
  return payload;
}

export const createProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.create(mapBodyToProduct(req.body));
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    mapBodyToProduct(req.body),
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

export const uploadProductImages = asyncHandler(async (req: Request, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new ApiError(400, "No images uploaded. Please select one or more images.");
  const paths = files.map((f) => productImagePath(f.filename));
  res.json({ paths });
});
