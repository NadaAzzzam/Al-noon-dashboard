import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isDbConnected } from "../config/db.js";
import { Permission, Role, RolePermission } from "../models/Role.js";

export type AuthPayload = {
  userId: string;
  /** Role key stored on the user (e.g. "ADMIN", "USER", "STAFF"). */
  role: string;
};

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthPayload;
  }
}

const AUTH_COOKIE_NAME = "al_noon_token";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    const header = req.headers.authorization;
    const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : undefined;
    const token = cookieToken ?? bearerToken;
    if (!token) {
      return next(new ApiError(401, "Missing authorization", { code: "errors.auth.unauthorized" }));
    }
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    next(new ApiError(401, "Invalid token", { code: "errors.auth.unauthorized" }));
  }
};

/**
 * Optional authentication: sets req.auth when a valid token is present;
 * does not fail when no token or invalid token (req.auth stays undefined).
 * Use for routes that support both authenticated and guest access (e.g. POST /api/orders).
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    const header = req.headers.authorization;
    const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : undefined;
    const token = cookieToken ?? bearerToken;
    if (!token) {
      return next();
    }
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    next();
  }
};

export const requireRole = (roles: Array<AuthPayload["role"]>) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) {
    return next(new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" }));
  }
  if (!roles.includes(req.auth.role)) {
    return next(new ApiError(403, "Forbidden", { code: "errors.common.forbidden" }));
  }
  next();
};

/**
 * Require that the current user's role has at least one of the given permission keys.
 * Falls back to allowing access when the database is not connected (DEV_WITHOUT_DB mode).
 */
export const requirePermission = (permissions: string[]) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.auth) {
      throw new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" });
    }

    if (!isDbConnected()) {
      // In dev-without-db mode we cannot look up roles; allow and rely on JWT role only.
      return next();
    }

    const role = await Role.findOne({ key: req.auth.role }).lean<{ _id: typeof Role.prototype._id } | null>();
    if (!role) {
      throw new ApiError(403, "Forbidden", { code: "errors.common.forbidden" });
    }
    const rolePerms = await RolePermission.find({ roleId: role._id }).lean<{ permissionId: typeof Permission.prototype._id }[]>();
    const ids = rolePerms.map((rp) => rp.permissionId);
    const userPermissions = await Permission.find({ _id: { $in: ids } }).lean<{ key: string }[]>();
    const hasAny = userPermissions.some((p) => permissions.includes(p.key));
    if (!hasAny) {
      throw new ApiError(403, "Forbidden", { code: "errors.common.forbidden" });
    }
    next();
  });

