import { City } from "../models/City.js";
import { isDbConnected } from "../config/db.js";
import { getDefaultLocale, type Locale } from "../i18n.js";
import { ApiError } from "../utils/apiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const listCities = asyncHandler(async (req, res) => {
  const locale = (req.locale ?? getDefaultLocale()) as Locale;
  if (!isDbConnected()) {
    return sendResponse(res, locale, { data: { cities: [] } });
  }
  const cities = await City.find().sort({ "name.en": 1 }).lean();
  sendResponse(res, locale, { data: { cities } });
});

export const getCity = asyncHandler(async (req, res) => {
  const locale = (req.locale ?? getDefaultLocale()) as Locale;
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const city = await City.findById(req.params?.id).lean();
  if (!city) throw new ApiError(404, "City not found", { code: "errors.city.not_found" });
  sendResponse(res, locale, { data: { city } });
});

export const createCity = asyncHandler(async (req, res) => {
  const locale = (req.locale ?? getDefaultLocale()) as Locale;
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const body = req.body as { nameEn?: string; nameAr?: string; deliveryFee?: number };
  const nameEn = String(body.nameEn ?? "").trim();
  const nameAr = String(body.nameAr ?? "").trim();
  const existing = await City.findOne({ "name.en": { $regex: new RegExp(`^${escapeRegex(nameEn)}$`, "i") } });
  if (existing) throw new ApiError(409, "City with this name already exists", { code: "errors.city.already_exists" });
  const city = await City.create({
    name: { en: nameEn, ar: nameAr },
    deliveryFee: typeof body.deliveryFee === "number" && body.deliveryFee >= 0 ? body.deliveryFee : 0
  });
  sendResponse(res, locale, { status: 201, message: "success.city.created", data: { city } });
});

export const updateCity = asyncHandler(async (req, res) => {
  const locale = (req.locale ?? getDefaultLocale()) as Locale;
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const body = req.body as { nameEn?: string; nameAr?: string; deliveryFee?: number };
  const updates: { name?: { en: string; ar: string }; deliveryFee?: number } = {};
  if (body.nameEn !== undefined || body.nameAr !== undefined) {
    updates.name = {
      en: String(body.nameEn ?? "").trim(),
      ar: String(body.nameAr ?? "").trim()
    };
  }
  if (typeof body.deliveryFee === "number" && body.deliveryFee >= 0) updates.deliveryFee = body.deliveryFee;
  const city = await City.findByIdAndUpdate(req.params?.id, updates, { new: true });
  if (!city) throw new ApiError(404, "City not found", { code: "errors.city.not_found" });
  sendResponse(res, locale, { message: "success.city.updated", data: { city } });
});

export const deleteCity = asyncHandler(async (req, res) => {
  const locale = (req.locale ?? getDefaultLocale()) as Locale;
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const city = await City.findByIdAndDelete(req.params?.id);
  if (!city) throw new ApiError(404, "City not found", { code: "errors.city.not_found" });
  sendResponse(res, locale, { status: 204 });
});
