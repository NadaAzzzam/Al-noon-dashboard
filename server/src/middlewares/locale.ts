import type { NextFunction, Request, Response } from "express";
import { loadTranslations, normalizeLocale, type Locale } from "../i18n.js";

declare global {
  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

const LOCALE_HEADER = "x-language";
const QUERY_LANG = "lang";

export function initLocales(): void {
  loadTranslations();
}

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const fromHeader = req.get(LOCALE_HEADER) ?? req.get("accept-language")?.split(",")[0]?.trim();
  const fromQuery = req.query[QUERY_LANG];
  const lang = (fromQuery as string) ?? fromHeader;
  req.locale = normalizeLocale(lang);
  next();
}
