import type { Request, Response, NextFunction } from "express";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logoPath } from "../middlewares/upload.js";

const defaults = {
  storeName: { en: "Al-noon", ar: "النون" },
  logo: "",
  instaPayNumber: "",
  paymentMethods: { cod: true, instaPay: true },
  lowStockThreshold: 5
};

export const getSettings = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ settings: defaults });
    return;
  }
  const settings = await Settings.findOne().lean();
  res.json({ settings: settings ?? defaults });
  return;
});

export const updateSettings = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const updates = req.body;
  const toSet: Record<string, unknown> = {};
  if (updates.storeNameEn !== undefined || updates.storeNameAr !== undefined) {
    toSet.storeName = {
      en: String(updates.storeNameEn ?? "").trim(),
      ar: String(updates.storeNameAr ?? "").trim()
    };
  }
  if (updates.logo !== undefined) toSet.logo = String(updates.logo);
  if (updates.instaPayNumber !== undefined) toSet.instaPayNumber = String(updates.instaPayNumber);
  if (updates.paymentMethods !== undefined) {
    toSet.paymentMethods = {
      cod: Boolean(updates.paymentMethods?.cod),
      instaPay: Boolean(updates.paymentMethods?.instaPay)
    };
  }
  if (updates.lowStockThreshold !== undefined) {
    toSet.lowStockThreshold = Math.max(0, Math.floor(Number(updates.lowStockThreshold)));
  }
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: toSet },
    { new: true, upsert: true }
  ).lean();
  res.json({ settings });
});

export const uploadLogo = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file uploaded. Please select an image (PNG, JPG, GIF, WEBP).");
  const pathUrl = logoPath(file.filename);
  await Settings.findOneAndUpdate({}, { $set: { logo: pathUrl } }, { new: true, upsert: true });
  res.json({ logo: pathUrl });
  return;
});
