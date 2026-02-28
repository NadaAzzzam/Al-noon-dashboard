import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const isProduction = process.env.NODE_ENV === "production";

/** General API: 100 requests per 15 minutes per IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction
});

/** Auth routes: 10 attempts per 15 minutes per IP (brute-force protection) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction
});

/** Checkout/orders: 15 requests per 15 minutes per IP (prevents abuse) */
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction
});
