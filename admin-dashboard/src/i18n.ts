import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

const LANG_KEY = "al_noon_lang";

export const supportedLangs = ["en", "ar"] as const;
export type Lang = (typeof supportedLangs)[number];

function applyDirection(lng: string) {
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

const saved = typeof localStorage !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
const initial = saved === "ar" || saved === "en" ? saved : "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: initial,
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
});

applyDirection(i18n.language);
i18n.on("languageChanged", applyDirection);

export function setStoredLanguage(lng: Lang) {
  localStorage.setItem(LANG_KEY, lng);
  i18n.changeLanguage(lng);
}

export function getStoredLanguage(): Lang {
  const l = i18n.language?.slice(0, 2);
  return l === "ar" || l === "en" ? l : "en";
}

export default i18n;
