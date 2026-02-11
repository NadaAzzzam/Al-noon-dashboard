import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

/** Display names for payment methods (en/ar) for e-commerce storefront. */
const PAYMENT_METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  COD: { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
  INSTAPAY: { en: "InstaPay", ar: "إنستا باي" }
};

/**
 * GET /api/payment-methods
 * Public: returns enabled payment methods for e-commerce (checkout, footer, etc.).
 * Reads from Settings.paymentMethods (cod, instaPay) and returns only enabled methods with id and localized name.
 */
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const defaults = { cod: true, instaPay: true };
  let paymentMethods = defaults;
  let instaPayNumber = "";

  if (isDbConnected()) {
    const settings = await Settings.findOne().select("paymentMethods instaPayNumber").lean();
    if (settings?.paymentMethods) {
      paymentMethods = {
        cod: Boolean(settings.paymentMethods.cod),
        instaPay: Boolean(settings.paymentMethods.instaPay)
      };
    }
    if (settings?.instaPayNumber != null) {
      instaPayNumber = String(settings.instaPayNumber).trim();
    }
  }

  const list: { id: string; name: { en: string; ar: string }; instaPayNumber?: string }[] = [];
  if (paymentMethods.cod) {
    list.push({ id: "COD", name: PAYMENT_METHOD_LABELS.COD });
  }
  if (paymentMethods.instaPay) {
    list.push({
      id: "INSTAPAY",
      name: PAYMENT_METHOD_LABELS.INSTAPAY,
      ...(instaPayNumber ? { instaPayNumber } : {})
    });
  }

  sendResponse(res, req.locale, {
    data: { paymentMethods: list }
  });
});
