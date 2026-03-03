/**
 * Shared discount code validation and computation.
 * Used by apply-discount API and checkout order creation.
 */
import mongoose from "mongoose";
import { DiscountCode } from "../models/DiscountCode.js";
import { DiscountCodeUsage } from "../models/DiscountCodeUsage.js";
import { ApiError } from "./apiError.js";

export interface DiscountValidationResult {
  discountCode: string;
  discountCodeId: string;
  discountAmount: number;
  type: "PERCENT" | "FIXED";
  value: number;
}

/** Identity for per-user usage check. Logged-in: userId. Guest: email and/or phone. */
export interface DiscountIdentity {
  userId?: string;
  email?: string;
  phone?: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

/**
 * Check if this identity has already used the given discount code.
 */
async function hasUsedDiscount(
  discountCodeId: mongoose.Types.ObjectId,
  identity: DiscountIdentity
): Promise<boolean> {
  const checks: { identifierType: "userId" | "email" | "phone"; identifierValue: string }[] = [];
  if (identity.userId && identity.userId.trim()) {
    checks.push({ identifierType: "userId", identifierValue: identity.userId.trim() });
  }
  if (identity.email && identity.email.trim()) {
    checks.push({ identifierType: "email", identifierValue: identity.email.trim().toLowerCase() });
  }
  if (identity.phone && identity.phone.trim()) {
    checks.push({ identifierType: "phone", identifierValue: normalizePhone(identity.phone) });
  }
  if (checks.length === 0) return false;

  const found = await DiscountCodeUsage.exists({
    discountCode: discountCodeId,
    $or: checks.map((c) => ({ identifierType: c.identifierType, identifierValue: c.identifierValue })),
  });
  return !!found;
}

/**
 * Records discount usage for an order. Call after order is created.
 */
export async function recordDiscountUsage(params: {
  discountCodeId: string;
  orderId: string;
  identity: DiscountIdentity;
}): Promise<void> {
  const { discountCodeId, orderId, identity } = params;
  const records: { discountCode: mongoose.Types.ObjectId; identifierType: "userId" | "email" | "phone"; identifierValue: string; order: mongoose.Types.ObjectId }[] = [];

  if (identity.userId && identity.userId.trim()) {
    records.push({
      discountCode: new mongoose.Types.ObjectId(discountCodeId),
      identifierType: "userId",
      identifierValue: identity.userId.trim(),
      order: new mongoose.Types.ObjectId(orderId),
    });
  }
  if (identity.email && identity.email.trim()) {
    records.push({
      discountCode: new mongoose.Types.ObjectId(discountCodeId),
      identifierType: "email",
      identifierValue: identity.email.trim().toLowerCase(),
      order: new mongoose.Types.ObjectId(orderId),
    });
  }
  if (identity.phone && identity.phone.trim()) {
    records.push({
      discountCode: new mongoose.Types.ObjectId(discountCodeId),
      identifierType: "phone",
      identifierValue: normalizePhone(identity.phone),
      order: new mongoose.Types.ObjectId(orderId),
    });
  }

  if (records.length > 0) {
    await DiscountCodeUsage.insertMany(records);
  }
}

/**
 * Validates a discount code against subtotal and returns discount amount.
 * When identity is provided, rejects if this user/email/phone has already used the code.
 * Throws ApiError with appropriate code on validation failure.
 */
export async function validateAndComputeDiscount(
  rawCode: string,
  subtotal: number,
  identity?: DiscountIdentity
): Promise<DiscountValidationResult> {
  const codeUpper = rawCode.trim().toUpperCase();
  if (!codeUpper) {
    throw new ApiError(400, "Discount code is required", { code: "errors.order.invalid_discount_code" });
  }

  const discountDoc = await DiscountCode.findOne({ code: codeUpper }).lean();
  if (!discountDoc) {
    throw new ApiError(400, "Invalid discount code", { code: "errors.order.invalid_discount_code" });
  }
  if (!discountDoc.enabled) {
    throw new ApiError(400, "Invalid discount code", { code: "errors.order.invalid_discount_code" });
  }

  const now = new Date();
  if (discountDoc.validFrom && new Date(discountDoc.validFrom) > now) {
    throw new ApiError(400, "Discount code not yet valid", { code: "errors.order.discount_code_not_valid" });
  }
  if (discountDoc.validUntil && new Date(discountDoc.validUntil) < now) {
    throw new ApiError(400, "Discount code expired", { code: "errors.order.discount_code_expired" });
  }
  if (discountDoc.usageLimit != null && (discountDoc.usedCount ?? 0) >= discountDoc.usageLimit) {
    throw new ApiError(400, "Discount code expired", { code: "errors.order.discount_code_expired" });
  }

  const minAmount = discountDoc.minOrderAmount ?? 0;
  if (minAmount > 0 && subtotal < minAmount) {
    throw new ApiError(400, "Order total too low for this discount code", {
      code: "errors.order.discount_code_min_not_met",
    });
  }

  // Per-identity usage limit: reject if this user/email/phone has already used this code
  if (identity) {
    const discountId = (discountDoc as { _id: mongoose.Types.ObjectId })._id;
    const alreadyUsed = await hasUsedDiscount(discountId, identity);
    if (alreadyUsed) {
      throw new ApiError(400, "This discount code has already been used with this account or contact", {
        code: "errors.discount.already_used",
      });
    }
  }

  const dc = discountDoc as { _id: mongoose.Types.ObjectId; type: string; value: number };
  let discountAmount: number;
  if (dc.type === "PERCENT") {
    discountAmount = Math.min(Math.round((subtotal * dc.value) / 100), subtotal);
  } else {
    discountAmount = Math.min(dc.value, subtotal);
  }

  return {
    discountCode: codeUpper,
    discountCodeId: dc._id.toString(),
    discountAmount,
    type: dc.type as "PERCENT" | "FIXED",
    value: dc.value,
  };
}
