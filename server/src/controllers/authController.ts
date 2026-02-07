import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { isDbConnected } from "../config/db.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

const signToken = (userId: string, role: "ADMIN" | "USER") =>
  jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

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
    throw new ApiError(503, "Database not available (dev mode). Register when MongoDB is connected.");
  }
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "User already exists");
  }
  const user = await User.create({ name, email, password });
  const token = signToken(user.id, user.role);
  setAuthCookie(res, token);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export const login = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const tryDevLogin = () => {
    if (email === env.adminEmail && password === env.adminPassword) {
      const token = signToken(DEV_ADMIN_ID, "ADMIN");
      setAuthCookie(res, token);
      res.json({
        token,
        user: { id: DEV_ADMIN_ID, name: env.adminName, email: env.adminEmail, role: "ADMIN" as const }
      });
      return true;
    }
    return false;
  };

  if (!isDbConnected()) {
    if (tryDevLogin()) return;
    throw new ApiError(401, "Invalid credentials");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }
    const token = signToken(user.id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error("Login DB error (falling back to dev login):", e);
    if (tryDevLogin()) return;
    throw new ApiError(503, "Database error. Try again or use admin@localhost / admin123.");
  }
});

export const me = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized");
  }
  if (!isDbConnected()) {
    res.json({
      user: { id: req.auth.userId, name: env.adminName, email: env.adminEmail, role: req.auth.role }
    });
    return;
  }
  const user = await User.findById(req.auth.userId).select("name email role");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.json({ user });
});

export const signOut = asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.status(204).send();
});
