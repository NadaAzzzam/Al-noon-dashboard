import { City } from "../models/City.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCities = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    return res.json({ cities: [] });
  }
  const cities = await City.find().sort({ name: 1 }).lean();
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
  const existing = await City.findOne({ name: { $regex: new RegExp(`^${String(req.body.name).trim()}$`, "i") } });
  if (existing) throw new ApiError(409, "City with this name already exists");
  const city = await City.create({
    name: String(req.body.name).trim(),
    deliveryFee: typeof req.body.deliveryFee === "number" && req.body.deliveryFee >= 0 ? req.body.deliveryFee : 0
  });
  res.status(201).json({ city });
});

export const updateCity = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const updates: { name?: string; deliveryFee?: number } = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
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
