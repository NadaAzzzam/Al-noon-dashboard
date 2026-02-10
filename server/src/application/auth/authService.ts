import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { isDbConnected } from "../../config/db.js";
import { User } from "../../models/User.js";
import { ApiError } from "../../utils/apiError.js";
import { logger } from "../../utils/logger.js";

const DEV_ADMIN_ID = "dev-admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

function signToken(userId: string, role: "ADMIN" | "USER"): string {
  try {
    return jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  } catch (err) {
    logger.error({ err }, "JWT sign error");
    throw new ApiError(503, "Server misconfiguration (auth)");
  }
}

export async function register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }
  const { name, email, password } = input;
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "User already exists", { code: "errors.auth.user_exists" });
  }
  const user = await User.create({ name, email, password });
  const token = signToken(user.id, user.role);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const { email, password } = input;

  if (email === env.adminEmail && password === env.adminPassword) {
    try {
      const token = signToken(DEV_ADMIN_ID, "ADMIN");
      return {
        token,
        user: { id: DEV_ADMIN_ID, name: env.adminName, email: env.adminEmail, role: "ADMIN" }
      };
    } catch (e) {
      logger.error({ err: e }, "Dev login fallback error");
    }
  }

  if (!isDbConnected()) {
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
      logger.error({ err: compareErr }, "Password compare error (invalid hash?)");
      throw new ApiError(503, "Database error", { code: "errors.common.db_error_fallback" });
    }
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials", { code: "errors.auth.invalid_credentials" });
    }
    const token = signToken(user.id, user.role);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    logger.error({ err: e }, "Login error");
    throw new ApiError(503, "Database error", { code: "errors.common.db_error_fallback" });
  }
}

export async function getMe(userId: string): Promise<AuthUser | null> {
  if (!isDbConnected()) {
    return { id: userId, name: env.adminName, email: env.adminEmail, role: "ADMIN" };
  }
  const user = await User.findById(userId).select("name email role").lean();
  if (!user) return null;
  const u = user as { _id: { toString: () => string }; name: string; email: string; role: "ADMIN" | "USER" };
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role
  };
}
