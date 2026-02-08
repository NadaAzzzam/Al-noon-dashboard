import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { getDefaultLocale } from "../i18n.js";
import { ApiError } from "../utils/apiError.js";
import { sendError } from "../utils/response.js";

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const locale = req.locale ?? getDefaultLocale();
  const e = err instanceof Error ? err : new Error(String(err));

  if (err instanceof multer.MulterError) {
    return sendError(res, locale, {
      statusCode: 400,
      code: err.code === "LIMIT_FILE_SIZE" ? "errors.upload.file_too_large" : "errors.common.validation_error"
    });
  }

  if (e instanceof ApiError) {
    return sendError(res, locale, {
      statusCode: e.statusCode,
      code: e.code ?? "errors.common.internal_error",
      params: e.params
    });
  }

  if (e instanceof ZodError) {
    const details = e.errors.map((er) => `${er.path.join(".")}: ${er.message}`).join(", ");
    return sendError(res, locale, {
      statusCode: 400,
      code: "errors.common.validation_error",
      details
    });
  }

  console.error("Unhandled error:", e.message, e.stack);
  return sendError(res, locale, { statusCode: 500, code: "errors.common.internal_error" });
};
