import { Category } from "../models/Category.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json({ categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  res.status(204).send();
});
