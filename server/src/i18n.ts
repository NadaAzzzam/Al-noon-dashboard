import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type Locale = "en" | "ar";

const supportedLocales: Locale[] = ["en", "ar"];
const defaultLocale: Locale = "en";

let translations: Record<Locale, Record<string, string>> = {} as Record<Locale, Record<string, string>>;

function loadLocale(locale: Locale): Record<string, string> {
  try {
    const localePath = join(__dirname, "locales", `${locale}.json`);
    const raw = readFileSync(localePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    return flattenKeys(data, "");
  } catch (err) {
    console.warn(`[i18n] Could not load locale ${locale}:`, err instanceof Error ? err.message : err);
    return {};
  }
}

function flattenKeys(obj: Record<string, unknown>, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenKeys(value as Record<string, unknown>, fullKey));
    } else if (typeof value === "string") {
      out[fullKey] = value;
    }
  }
  return out;
}

export function loadTranslations(): void {
  for (const locale of supportedLocales) {
    translations[locale] = loadLocale(locale);
  }
}

export function getSupportedLocales(): Locale[] {
  return [...supportedLocales];
}

export function getDefaultLocale(): Locale {
  return defaultLocale;
}

export function normalizeLocale(lang: string | undefined): Locale {
  if (!lang) return defaultLocale;
  const lower = lang.toLowerCase().slice(0, 2);
  if (lower === "ar") return "ar";
  return "en";
}

/**
 * Translate a key with optional interpolation params.
 * Keys use dot notation, e.g. "errors.auth.invalid_credentials".
 */
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  if (!translations[locale]) {
    loadTranslations();
  }
  let text = translations[locale]?.[key] ?? translations[defaultLocale]?.[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
    }
  }
  return text;
}
