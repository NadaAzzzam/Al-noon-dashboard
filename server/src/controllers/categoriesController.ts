import { Category } from "../models/Category.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const listCategories = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { categories: [] } });
  }
  const statusParam = req.query.status as string | undefined;
  const filter: Record<string, string> = {};
  if (statusParam) {
    // Store FE may send status=PUBLISHED; map to visible
    filter.status = statusParam === "PUBLISHED" ? "visible" : statusParam;
  }
  const categories = await Category.find(filter).sort({ createdAt: -1 }).lean();
  sendResponse(res, req.locale, { data: { categories } });
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
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const category = await Category.create(mapBodyToCategory(req.body));
  sendResponse(res, req.locale, { status: 201, message: "success.category.created", data: { category } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const category = await Category.findByIdAndUpdate(req.params.id, mapBodyToCategory(req.body), { new: true });
  if (!category) {
    throw new ApiError(404, "Category not found", { code: "errors.category.not_found" });
  }
  sendResponse(res, req.locale, { message: "success.category.updated", data: { category } });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found", { code: "errors.category.not_found" });
  }
  sendResponse(res, req.locale, { status: 204 });
});

export const setCategoryStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!category) {
    throw new ApiError(404, "Category not found", { code: "errors.category.not_found" });
  }
  sendResponse(res, req.locale, { message: "success.category.status_updated", data: { category } });
});
