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

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing authorization header");
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    throw new ApiError(401, "Invalid token");
  }
};

export const requireRole = (roles: Array<AuthPayload["role"]>) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized");
  }
  if (!roles.includes(req.auth.role)) {
    throw new ApiError(403, "Forbidden");
  }
  next();
};
