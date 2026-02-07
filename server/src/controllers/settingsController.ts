import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSettings = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({
      settings: {
        storeName: "Al-noon",
        deliveryFee: 0,
        paymentMethods: { cod: true, instaPay: true },
        lowStockThreshold: 5
      }
    });
    return;
  }
  let settings = await Settings.findOne().lean();
  if (!settings) {
    await Settings.create({
      storeName: "Al-noon",
      deliveryFee: 0,
      paymentMethods: { cod: true, instaPay: true },
      lowStockThreshold: 5
    });
    settings = await Settings.findOne().lean();
  }
  res.json({ settings: settings ?? null });
});

export const updateSettings = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const allowed = [
    "storeName",
    "logo",
    "deliveryFee",
    "instaPayNumber",
    "paymentMethods",
    "lowStockThreshold"
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const settings = await Settings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
  res.json({ settings });
});
