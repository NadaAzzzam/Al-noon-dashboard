import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err.name === "ZodError") {
    return res.status(400).json({ message: "Validation error", details: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};
