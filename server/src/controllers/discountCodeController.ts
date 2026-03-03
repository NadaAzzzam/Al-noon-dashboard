import { DiscountCode } from "../models/DiscountCode.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { getDefaultLocale } from "../i18n.js";

const locale = (req: unknown) =>
  (req as { locale?: string }).locale ?? getDefaultLocale();

function toDate(v: string | Date | null | undefined): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export const listDiscountCodes = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, locale(req), { data: { discountCodes: [] } });
  }
  const codes = await DiscountCode.find().sort({ code: 1 }).lean();
  sendResponse(res, locale(req), {
    data: {
      discountCodes: codes.map((c) => ({
        ...c,
        id: (c as { _id: unknown })._id?.toString?.(),
      })),
    },
  });
});

export const getDiscountCode = asyncHandler(async (req, res) => {
  if (!isDbConnected())
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const doc = await DiscountCode.findById(req.params?.id).lean();
  if (!doc) throw new ApiError(404, "Discount code not found", { code: "errors.common.not_found" });
  sendResponse(res, locale(req), {
    data: {
      discountCode: { ...doc, id: (doc as { _id: unknown })._id?.toString?.() },
    },
  });
});

export const createDiscountCode = asyncHandler(async (req, res) => {
  if (!isDbConnected())
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const body = req.body as {
    code?: string;
    type?: "PERCENT" | "FIXED";
    value?: number;
    minOrderAmount?: number | null;
    validFrom?: string | Date | null;
    validUntil?: string | Date | null;
    usageLimit?: number | null;
    enabled?: boolean;
  };
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) throw new ApiError(400, "Code is required", { code: "errors.common.validation_error" });
  const existing = await DiscountCode.findOne({ code });
  if (existing)
    throw new ApiError(409, "Discount code already exists", { code: "errors.discount.exists" });
  const type = body.type === "FIXED" ? "FIXED" : "PERCENT";
  const value = typeof body.value === "number" && body.value >= 0 ? body.value : 0;
  if (type === "PERCENT" && value > 100)
    throw new ApiError(400, "Percent value must be 0–100", { code: "errors.common.validation_error" });
  const doc = await DiscountCode.create({
    code,
    type,
    value,
    minOrderAmount: body.minOrderAmount ?? null,
    validFrom: toDate(body.validFrom) ?? undefined,
    validUntil: toDate(body.validUntil) ?? undefined,
    usageLimit: body.usageLimit ?? null,
    usedCount: 0,
    enabled: body.enabled !== false,
  });
  sendResponse(res, locale(req), {
    status: 201,
    message: "success.discount_code.created",
    data: { discountCode: { ...doc.toObject(), id: doc._id.toString() } },
  });
});

export const updateDiscountCode = asyncHandler(async (req, res) => {
  if (!isDbConnected())
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const body = req.body as {
    code?: string;
    type?: "PERCENT" | "FIXED";
    value?: number;
    minOrderAmount?: number | null;
    validFrom?: string | Date | null;
    validUntil?: string | Date | null;
    usageLimit?: number | null;
    enabled?: boolean;
  };
  const doc = await DiscountCode.findById(req.params?.id);
  if (!doc) throw new ApiError(404, "Discount code not found", { code: "errors.common.not_found" });
  if (body.code !== undefined) {
    const code = String(body.code).trim().toUpperCase();
    if (!code) throw new ApiError(400, "Code is required", { code: "errors.common.validation_error" });
    const existing = await DiscountCode.findOne({ code, _id: { $ne: doc._id } });
    if (existing)
      throw new ApiError(409, "Discount code already exists", { code: "errors.discount.exists" });
    doc.code = code;
  }
  if (body.type !== undefined) doc.type = body.type;
  if (body.value !== undefined) {
    if (body.value < 0) throw new ApiError(400, "Value cannot be negative", { code: "errors.common.validation_error" });
    if (doc.type === "PERCENT" && body.value > 100)
      throw new ApiError(400, "Percent value must be 0–100", { code: "errors.common.validation_error" });
    doc.value = body.value;
  }
  if (body.minOrderAmount !== undefined) doc.minOrderAmount = body.minOrderAmount ?? undefined;
  if (body.validFrom !== undefined) doc.validFrom = toDate(body.validFrom) ?? undefined;
  if (body.validUntil !== undefined) doc.validUntil = toDate(body.validUntil) ?? undefined;
  if (body.usageLimit !== undefined) doc.usageLimit = body.usageLimit ?? undefined;
  if (body.enabled !== undefined) doc.enabled = body.enabled;
  await doc.save();
  sendResponse(res, locale(req), {
    message: "success.discount_code.updated",
    data: { discountCode: { ...doc.toObject(), id: doc._id.toString() } },
  });
});

export const deleteDiscountCode = asyncHandler(async (req, res) => {
  if (!isDbConnected())
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const doc = await DiscountCode.findByIdAndDelete(req.params?.id);
  if (!doc) throw new ApiError(404, "Discount code not found", { code: "errors.common.not_found" });
  sendResponse(res, locale(req), { status: 204 });
});
