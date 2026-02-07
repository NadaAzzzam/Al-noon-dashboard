import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { t } from "../i18n.js";
import { ApiError } from "../utils/apiError.js";

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const locale = (req as Request & { locale?: string }).locale ?? "en";
  const e = err instanceof Error ? err : new Error(String(err));

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 2MB)" : err.message;
    return res.status(400).json({ message, code: "upload_error" });
  }

  if (e instanceof ApiError) {
    const message = e.code
      ? t(locale, e.code, e.params)
      : e.message;
    return res.status(e.statusCode).json({
      message,
      code: e.code ?? undefined
    });
  }

  if (e instanceof ZodError) {
    const validationMessage = t(locale, "errors.common.validation_error");
    const details = e.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
    return res.status(400).json({
      message: validationMessage,
      code: "validation_error",
      details
    });
  }

  console.error("Unhandled error:", e.message, e.stack);
  const internalMessage = t(locale, "errors.common.internal_error");
  return res.status(500).json({ message: internalMessage, code: "internal_error" });
};
