import { City } from "../models/City.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const listCities = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { cities: [] } });
  }
  const cities = await City.find().sort({ "name.en": 1 }).lean();
  sendResponse(res, req.locale, { data: { cities } });
});

export const getCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const city = await City.findById(req.params.id).lean();
  if (!city) throw new ApiError(404, "City not found", { code: "errors.city.not_found" });
  sendResponse(res, req.locale, { data: { city } });
});

export const createCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const nameEn = String(req.body.nameEn ?? "").trim();
  const nameAr = String(req.body.nameAr ?? "").trim();
  const existing = await City.findOne({ "name.en": { $regex: new RegExp(`^${nameEn}$`, "i") } });
  if (existing) throw new ApiError(409, "City with this name already exists", { code: "errors.city.already_exists" });
  const city = await City.create({
    name: { en: nameEn, ar: nameAr },
    deliveryFee: typeof req.body.deliveryFee === "number" && req.body.deliveryFee >= 0 ? req.body.deliveryFee : 0
  });
  sendResponse(res, req.locale, { status: 201, message: "success.city.created", data: { city } });
});

export const updateCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const updates: { name?: { en: string; ar: string }; deliveryFee?: number } = {};
  if (req.body.nameEn !== undefined || req.body.nameAr !== undefined) {
    updates.name = {
      en: String(req.body.nameEn ?? "").trim(),
      ar: String(req.body.nameAr ?? "").trim()
    };
  }
  if (typeof req.body.deliveryFee === "number" && req.body.deliveryFee >= 0) updates.deliveryFee = req.body.deliveryFee;
  const city = await City.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!city) throw new ApiError(404, "City not found", { code: "errors.city.not_found" });
  sendResponse(res, req.locale, { message: "success.city.updated", data: { city } });
});

export const deleteCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const city = await City.findByIdAndDelete(req.params.id);
  if (!city) throw new ApiError(404, "City not found", { code: "errors.city.not_found" });
  sendResponse(res, req.locale, { status: 204 });
});
