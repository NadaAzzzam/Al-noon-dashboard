import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

/** General API: 100 requests per 15 minutes per IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction || isTest
});

/** Auth routes: 10 attempts per 15 minutes per IP (brute-force protection) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction || isTest
});

/** AI chat: 20 requests per 15 minutes per IP (prevents abuse, prompt injection spam) */
export const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production" || isTest
});

/** Checkout/orders: 15 requests per 15 minutes per IP (prevents abuse) */
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction || isTest
});
