import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { ShippingMethod } from "../models/ShippingMethod.js";

/**
 * GET /api/shipping-methods
 * Returns available shipping methods with prices from database.
 */
export const listShippingMethods = asyncHandler(async (req, res) => {
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

  sendResponse(res, req.locale, { data: formattedMethods });
});

