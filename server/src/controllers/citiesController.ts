import { City } from "../models/City.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCities = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    return res.json({ cities: [] });
  }
  const cities = await City.find().sort({ "name.en": 1 }).lean();
  res.json({ cities });
});

export const getCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const city = await City.findById(req.params.id).lean();
  if (!city) throw new ApiError(404, "City not found");
  res.json({ city });
});

export const createCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const nameEn = String(req.body.nameEn ?? "").trim();
  const nameAr = String(req.body.nameAr ?? "").trim();
  const existing = await City.findOne({ "name.en": { $regex: new RegExp(`^${nameEn}$`, "i") } });
  if (existing) throw new ApiError(409, "City with this name already exists");
  const city = await City.create({
    name: { en: nameEn, ar: nameAr },
    deliveryFee: typeof req.body.deliveryFee === "number" && req.body.deliveryFee >= 0 ? req.body.deliveryFee : 0
  });
  res.status(201).json({ city });
});

export const updateCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const updates: { name?: { en: string; ar: string }; deliveryFee?: number } = {};
  if (req.body.nameEn !== undefined || req.body.nameAr !== undefined) {
    updates.name = {
      en: String(req.body.nameEn ?? "").trim(),
      ar: String(req.body.nameAr ?? "").trim()
    };
  }
  if (typeof req.body.deliveryFee === "number" && req.body.deliveryFee >= 0) updates.deliveryFee = req.body.deliveryFee;
  const city = await City.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!city) throw new ApiError(404, "City not found");
  res.json({ city });
});

export const deleteCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const city = await City.findByIdAndDelete(req.params.id);
  if (!city) throw new ApiError(404, "City not found");
  res.status(204).send();
});
