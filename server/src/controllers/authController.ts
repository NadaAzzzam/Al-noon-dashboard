import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { isDbConnected } from "../config/db.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signToken = (userId: string, role: "ADMIN" | "USER") =>
  jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

const signRefreshToken = (userId: string, role: "ADMIN" | "USER") =>
  jwt.sign({ userId, role, type: "refresh" }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn } as jwt.SignOptions);

/** In-memory store for refresh tokens (invalidated on logout). */
const refreshTokenStore = new Map<string, string>();

const DEV_ADMIN_ID = "dev-admin";

function userResponse(user: { _id?: unknown; id?: string; name: string; email: string; role: string }) {
  const id = user.id ?? (user._id != null ? String(user._id) : "");
  return { id, name: user.name, email: user.email, role: user.role };
}

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
  const refreshToken = signRefreshToken(user.id, user.role);
  refreshTokenStore.set(user.id, refreshToken);
  res.status(201).json({ token, refreshToken, expiresIn: env.jwtExpiresIn, user: userResponse(user) });
});

export const login = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const tryDevLogin = () => {
    if (email === env.adminEmail && password === env.adminPassword) {
      const token = signToken(DEV_ADMIN_ID, "ADMIN");
      const refreshToken = signRefreshToken(DEV_ADMIN_ID, "ADMIN");
      refreshTokenStore.set(DEV_ADMIN_ID, refreshToken);
      res.json({
        token,
        refreshToken,
        expiresIn: env.jwtExpiresIn,
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
    const refreshToken = signRefreshToken(user.id, user.role);
    refreshTokenStore.set(user.id, refreshToken);
    res.json({ token, refreshToken, expiresIn: env.jwtExpiresIn, user: userResponse(user) });
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

export const refresh = asyncHandler(async (req, res) => {
  const refreshTokenRaw = req.body?.refreshToken ?? req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!refreshTokenRaw) {
    throw new ApiError(401, "Refresh token required");
  }
  try {
    const payload = jwt.verify(refreshTokenRaw, env.jwtRefreshSecret) as { userId: string; role: "ADMIN" | "USER"; type?: string };
    if (payload.type !== "refresh") {
      throw new ApiError(401, "Invalid token type");
    }
    const stored = refreshTokenStore.get(payload.userId);
    if (!stored || stored !== refreshTokenRaw) {
      throw new ApiError(401, "Refresh token invalid or expired");
    }
    const token = signToken(payload.userId, payload.role);
    res.json({ token, expiresIn: env.jwtExpiresIn });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (userId) {
    refreshTokenStore.delete(userId);
  }
  res.status(204).send();
});
