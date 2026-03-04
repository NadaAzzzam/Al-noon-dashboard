import type { Response } from "express";
import { env } from "../config/env.js";
import { getDefaultLocale } from "../i18n.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import * as authService from "../application/auth/authService.js";

const AUTH_COOKIE_NAME = "al_noon_token";
const AUTH_ADMIN_COOKIE_NAME = "al_noon_admin_token";

/** Parse JWT expiresIn (e.g. "1d", "24h") to seconds for cookie maxAge */
function expiresInToSeconds(expiresIn: string): number {
  const match = /^(\d+)([dhms])?$/.exec(expiresIn.trim());
  if (!match) return 86400;
  const n = parseInt(match[1], 10);
  const unit = match[2] ?? "d";
  if (unit === "d") return n * 86400;
  if (unit === "h") return n * 3600;
  if (unit === "m") return n * 60;
  return n; // seconds
}

function setAuthCookie(res: Response, token: string, admin: boolean): void {
  const isProduction = process.env.NODE_ENV === "production";
  const name = admin ? AUTH_ADMIN_COOKIE_NAME : AUTH_COOKIE_NAME;
  res.cookie(name, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: expiresInToSeconds(env.jwtExpiresIn) * 1000,
    path: "/"
  });
}

export const register = asyncHandler(async (req, res) => {
  const body = req.body as { name?: string; email?: string; password?: string };
  const { name, email, password } = body;
  const result = await authService.register({ name: name ?? "", email: email ?? "", password: password ?? "" });
  setAuthCookie(res, result.token, false);
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    status: 201,
    message: "success.auth.register",
    data: { token: result.token, user: result.user }
  });
});

export const login = asyncHandler(async (req, res) => {
  const b = (req.body || {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const admin = b.admin === true;

  try {
    const result = await authService.login({ email, password });
    setAuthCookie(res, result.token, admin);
    sendResponse(res, req.locale ?? getDefaultLocale(), {
      message: "success.auth.login",
      data: { token: result.token, user: result.user }
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const devResult = await authService.login({ email: env.adminEmail, password: env.adminPassword }).catch(() => null);
    if (devResult) {
      setAuthCookie(res, devResult.token, admin);
      sendResponse(res, req.locale ?? getDefaultLocale(), {
        message: "success.auth.login",
        data: { token: devResult.token, user: devResult.user }
      });
      return;
    }
    throw new ApiError(503, "Database error", { code: "errors.common.db_error_fallback" });
  }
});

export const me = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" });
  }
  const user = await authService.getMe(req.auth.userId);
  if (!user) {
    throw new ApiError(404, "User not found", { code: "errors.auth.user_not_found" });
  }
  const isCustomer = req.auth.source === "customer";
  const payload = isCustomer
    ? { id: user.id, name: user.name, email: user.email }
    : { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions };
  sendResponse(res, req.locale ?? getDefaultLocale(), { data: { user: payload } });
});

/**
 * Storefront profile: customer token only (al_noon_token or Bearer), returns id, name, email.
 * Use GET /api/store/profile from the storefront so both cookies don't cause admin profile to be returned.
 */
export const meStorefront = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" });
  }
  const user = await authService.getMe(req.auth.userId);
  if (!user) {
    throw new ApiError(404, "User not found", { code: "errors.auth.user_not_found" });
  }
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    data: { user: { id: user.id, name: user.name, email: user.email } }
  });
});

/** POST /auth/forgot-password – request reset email (sitefront; no auth). */
export const forgotPassword = asyncHandler(async (req, res) => {
  const b = (req.body || {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  await authService.requestPasswordReset(email);
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    message: "success.auth.forgot_password_sent",
    data: { sent: true }
  });
});

/** POST /auth/reset-password – set new password with token from email (sitefront; no auth). */
export const resetPassword = asyncHandler(async (req, res) => {
  const b = (req.body || {}) as Record<string, unknown>;
  const token = typeof b.token === "string" ? b.token.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const confirmPassword = typeof b.confirmPassword === "string" ? b.confirmPassword : "";
  await authService.resetPassword({ token, password, confirmPassword });
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    message: "success.auth.password_reset",
    data: { reset: true }
  });
});

/** POST /auth/change-password – change password when logged in (current + new + confirm). */
export const changePassword = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" });
  }
  const b = (req.body || {}) as Record<string, unknown>;
  const currentPassword = typeof b.currentPassword === "string" ? b.currentPassword : "";
  const newPassword = typeof b.newPassword === "string" ? b.newPassword : "";
  const confirmPassword = typeof b.confirmPassword === "string" ? b.confirmPassword : "";
  await authService.changePassword(req.auth.userId, {
    currentPassword,
    newPassword,
    confirmPassword
  });
  sendResponse(res, req.locale ?? getDefaultLocale(), {
    message: "success.auth.password_changed",
    data: { changed: true }
  });
});

export const signOut = asyncHandler(async (req, res) => {
  const body = req.body as { admin?: boolean } | undefined;
  const admin = body?.admin === true;
  const name = admin ? AUTH_ADMIN_COOKIE_NAME : AUTH_COOKIE_NAME;
  res.clearCookie(name, { path: "/" });
  sendResponse(res, req.locale ?? getDefaultLocale(), { status: 204 });
});
