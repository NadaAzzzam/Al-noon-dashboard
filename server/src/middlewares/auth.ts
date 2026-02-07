import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export type AuthPayload = {
  userId: string;
  role: "ADMIN" | "USER";
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

export const requireRole = (roles: Array<AuthPayload["role"]>) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) {
    return next(new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" }));
  }
  if (!roles.includes(req.auth.role)) {
    return next(new ApiError(403, "Forbidden", { code: "errors.common.forbidden" }));
  }
  next();
};
