import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { ShippingMethod } from "../models/ShippingMethod.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { validateAndComputeDiscount, type DiscountIdentity } from "../utils/discountUtils.js";
import { getDefaultLocale } from "../i18n.js";

/**
 * Check if discount codes are enabled in store settings.
 * Not exposed to store front APIs; used by apply-discount and checkout.
 */
async function getDiscountCodeSupported(): Promise<boolean> {
  if (!isDbConnected()) return false;
  const s = await Settings.findOne().select("advancedSettings").lean();
  const advanced = (s?.advancedSettings ?? {}) as { discountCodeSupported?: boolean };
  return advanced.discountCodeSupported ?? true;
}

/**
 * POST /api/checkout/apply-discount
 * Validates a discount code against subtotal and returns discount amount.
 * Does NOT apply the discount (that happens at checkout).
 * Returns 403 when discountCodeSupported is false in settings.
 */
export const applyDiscount = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }

  const supported = await getDiscountCodeSupported();
  if (!supported) {
    throw new ApiError(403, "Discount codes are not enabled", {
      code: "errors.discount.not_enabled",
    });
  }

  const { discountCode, subtotal, email, phone } = req.body as {
    discountCode: string;
    subtotal: number;
    email?: string;
    phone?: string;
  };
  const auth = (req as { auth?: { userId?: string } }).auth;
  const identity: DiscountIdentity | undefined =
    auth?.userId
      ? { userId: auth.userId }
      : (email?.trim() || phone?.trim())
        ? {
            email: typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined,
            phone: typeof phone === "string" && phone.trim() ? phone.trim() : undefined,
          }
        : undefined;
  const result = await validateAndComputeDiscount(discountCode, subtotal, identity);

  sendResponse(res, req.locale ?? getDefaultLocale(), {
    data: {
      valid: true,
      discountCode: result.discountCode,
      discountAmount: result.discountAmount,
      type: result.type,
      value: result.value,
      subtotalAfterDiscount: Math.max(0, subtotal - result.discountAmount),
    },
  });
});

/**
 * GET /api/shipping-methods
 * Returns available shipping methods with prices from database.
 */
export const listShippingMethods = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }
  // Fetch enabled shipping methods from database
  const methods = await ShippingMethod.find({ enabled: true }).sort({ order: 1 });

  // Transform to match expected format
  const formattedMethods = methods.map((method) => ({
    id: method._id.toString(),
    name: method.name,
    description: method.description,
    estimatedDays: `${method.estimatedDays.min}-${method.estimatedDays.max}`,
    price: method.price,
  }));

  sendResponse(res, req.locale ?? getDefaultLocale(), { data: formattedMethods });
});

