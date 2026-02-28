import type { Request, Response, NextFunction } from "express";
import { getIdempotencyResponse, setIdempotencyResponse } from "../utils/idempotencyStore.js";

const IDEMPOTENCY_KEY_HEADER = "idempotency-key";
const MAX_KEY_LENGTH = 128;

/**
 * Middleware for idempotent POST checkout/order creation.
 * When client sends Idempotency-Key header, duplicate requests within 24h return the cached response.
 * Prevents duplicate orders on refresh during payment callback.
 * Place before the checkout/order route handler.
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers[IDEMPOTENCY_KEY_HEADER.toLowerCase()] as string | undefined;
  const rawKey = typeof key === "string" ? key.trim() : "";

  if (!rawKey) {
    next();
    return;
  }

  if (rawKey.length > MAX_KEY_LENGTH) {
    res.status(400).json({
      success: false,
      message: "Idempotency-Key must be at most 128 characters",
      code: "errors.common.validation_error"
    });
    return;
  }

  const cached = getIdempotencyResponse(rawKey);
  if (cached) {
    res.status(cached.statusCode).json(cached.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (res.statusCode >= 200 && res.statusCode < 300 && body && typeof body === "object") {
      const data = body as { data?: { order?: { _id?: unknown } } };
      const orderId = data.data?.order?._id?.toString?.() ?? "";
      if (orderId) {
        setIdempotencyResponse(rawKey, orderId, res.statusCode, body);
      }
    }
    return originalJson(body);
  };

  next();
}
