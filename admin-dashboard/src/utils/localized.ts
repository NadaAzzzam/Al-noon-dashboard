import { useTranslation } from "react-i18next";
import type { Lang } from "../i18n";

/** API can return either { en, ar } or legacy string. */
export type LocalizedValue = { en: string; ar: string } | string;

/** Get display string for given language. Handles both localized object and legacy string. */
export function getLocalized(
  value: LocalizedValue | undefined | null,
  lang: Lang
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const text = value[lang] ?? value.en ?? value.ar;
  return text ?? "";
}

/** Hook: returns (value) => display string for current UI language. Re-renders when language changes. */
export function useLocalized(): (value: LocalizedValue | undefined | null) => string {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.slice(0, 2) === "ar" ? "ar" : "en") as Lang;
  return (value: LocalizedValue | undefined | null) => getLocalized(value, lang);
}
