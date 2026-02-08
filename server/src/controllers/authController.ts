import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { isDbConnected } from "../config/db.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

const AUTH_COOKIE_NAME = "al_noon_token";

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

function signToken(userId: string, role: "ADMIN" | "USER"): string {
  try {
    return jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  } catch (err) {
    console.error("JWT sign error:", err instanceof Error ? err.message : err);
    throw new ApiError(503, "Server misconfiguration (auth)");
  }
}

function setAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: expiresInToSeconds(env.jwtExpiresIn) * 1000,
    path: "/"
  });
}

const DEV_ADMIN_ID = "dev-admin";

export const register = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "User already exists", { code: "errors.auth.user_exists" });
  }
  const user = await User.create({ name, email, password });
  const token = signToken(user.id, user.role);
  setAuthCookie(res, token);
  sendResponse(res, req.locale, {
    status: 201,
    message: "success.auth.register",
    data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  });
});

export const login = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const tryDevLogin = (): boolean => {
    try {
      if (email === env.adminEmail && password === env.adminPassword) {
        const token = signToken(DEV_ADMIN_ID, "ADMIN");
        setAuthCookie(res, token);
        sendResponse(res, req.locale, {
          message: "success.auth.login",
          data: { token, user: { id: DEV_ADMIN_ID, name: env.adminName, email: env.adminEmail, role: "ADMIN" as const } }
        });
        return true;
      }
    } catch (e) {
      console.error("Dev login fallback error:", e instanceof Error ? e.message : e);
    }
    return false;
  };

  if (!isDbConnected()) {
    if (tryDevLogin()) return;
    throw new ApiError(401, "Invalid credentials", { code: "errors.auth.invalid_credentials" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Invalid credentials", { code: "errors.auth.invalid_credentials" });
    }
    let isValid = false;
    try {
      isValid = await user.comparePassword(password);
    } catch (compareErr) {
      console.error("Password compare error (invalid hash?):", compareErr instanceof Error ? compareErr.message : compareErr);
      if (tryDevLogin()) return;
      throw new ApiError(503, "Database error", { code: "errors.common.db_error_fallback" });
    }
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials", { code: "errors.auth.invalid_credentials" });
    }
    const token = signToken(user.id, user.role);
    setAuthCookie(res, token);
    sendResponse(res, req.locale, {
      message: "success.auth.login",
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error("Login error (falling back to dev login):", e instanceof Error ? e.message : e);
    if (tryDevLogin()) return;
    throw new ApiError(503, "Database error", { code: "errors.common.db_error_fallback" });
  }
});

export const me = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" });
  }
  if (!isDbConnected()) {
    sendResponse(res, req.locale, {
      data: { user: { id: req.auth.userId, name: env.adminName, email: env.adminEmail, role: req.auth.role } }
    });
    return;
  }
  const user = await User.findById(req.auth.userId).select("name email role");
  if (!user) {
    throw new ApiError(404, "User not found", { code: "errors.auth.user_not_found" });
  }
  sendResponse(res, req.locale, { data: { user } });
});

export const signOut = asyncHandler(async (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  sendResponse(res, req.locale, { status: 204 });
});
