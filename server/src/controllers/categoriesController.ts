import { Category } from "../models/Category.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCategories = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ categories: [] });
    return;
  }
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json({ categories });
});

function mapBodyToCategory(body: Record<string, unknown>) {
  const { nameEn, nameAr, descriptionEn, descriptionAr, ...rest } = body;
  const payload: Record<string, unknown> = { ...rest };
  payload.name = { en: String(nameEn ?? "").trim(), ar: String(nameAr ?? "").trim() };
  if (descriptionEn !== undefined || descriptionAr !== undefined) {
    payload.description = { en: String(descriptionEn ?? "").trim(), ar: String(descriptionAr ?? "").trim() };
  }
  return payload;
}

export const createCategory = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const category = await Category.create(mapBodyToCategory(req.body));
  res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const category = await Category.findByIdAndUpdate(req.params.id, mapBodyToCategory(req.body), { new: true });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  res.status(204).send();
});

export const setCategoryStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  res.json({ category });
});
