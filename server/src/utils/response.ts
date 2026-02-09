import type { Response } from "express";
import { t, type Locale } from "../i18n.js";

/** Pagination metadata for list endpoints */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SendResponseOptions {
  data?: unknown;
  message?: string;
  status?: number;
  pagination?: PaginationMeta;
  /** Optional applied/handled query params (e.g. list products: sort, availability) */
  appliedFilters?: Record<string, unknown>;
}

/**
 * Consistent success response schema:
 *   { success: true, data?: T, message?: string, pagination?: PaginationMeta }
 * 204 sends no body.
 */
export function sendResponse(
  res: Response,
  locale: Locale,
  options: SendResponseOptions = {}
): void {
  const { data, message, status = 200, pagination, appliedFilters } = options;

  if (status === 204) {
    res.status(204).send();
    return;
  }

  const body: Record<string, unknown> = { success: true };

  if (message) {
    body.message = t(locale, message);
  }

  if (data !== undefined) {
    body.data = data;
  }

  if (pagination) {
    body.pagination = pagination;
  }

  if (appliedFilters && Object.keys(appliedFilters).length > 0) {
    body.appliedFilters = appliedFilters;
  }

  res.status(status).json(body);
}

export interface SendErrorOptions {
  statusCode: number;
  /** i18n key for message (e.g. errors.common.not_found) */
  code: string;
  details?: unknown;
  params?: Record<string, string | number>;
}

/**
 * Consistent error response schema:
 *   { success: false, message: string, code?: string, data: null, details?: unknown }
 * Message is translated using Accept-Language / x-language locale.
 */
export function sendError(
  res: Response,
  locale: Locale,
  options: SendErrorOptions
): void {
  const { statusCode, code, details, params } = options;
  const message = t(locale, code, params);
  const body: Record<string, unknown> = {
    success: false,
    message,
    code,
    data: null
  };
  if (details !== undefined) {
    body.details = details;
  }
  res.status(statusCode).json(body);
}
