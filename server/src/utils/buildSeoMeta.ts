/**
 * Build SEO meta title and description from product name and description.
 * Used by product seeders to populate metaTitle and metaDescription.
 */

const STORE_NAME_EN = "Al-noon";
const STORE_NAME_AR = "النون";

const MAX_TITLE_LEN = 60;
const MAX_DESC_LEN = 160;

export interface LocalizedNameDesc {
  en: string;
  ar: string;
}

export interface SeoMetaResult {
  metaTitle: { en: string; ar: string };
  metaDescription: { en: string; ar: string };
}

export function buildSeoMeta(
  name: LocalizedNameDesc,
  description: LocalizedNameDesc
): SeoMetaResult {
  const nameEn = name?.en?.trim() || "product";
  const nameAr = name?.ar?.trim() || "منتج";
  const descEn = description?.en?.trim() || nameEn;
  const descAr = description?.ar?.trim() || nameAr;

  const metaTitleEn =
    nameEn.length + 4 <= MAX_TITLE_LEN
      ? `${nameEn} | ${STORE_NAME_EN}`
      : nameEn.slice(0, MAX_TITLE_LEN - 3) + "...";
  const metaTitleAr =
    nameAr.length + 4 <= MAX_TITLE_LEN
      ? `${nameAr} | ${STORE_NAME_AR}`
      : nameAr.slice(0, MAX_TITLE_LEN - 3) + "...";

  return {
    metaTitle: { en: metaTitleEn, ar: metaTitleAr },
    metaDescription: {
      en: descEn.length <= MAX_DESC_LEN ? descEn : descEn.slice(0, MAX_DESC_LEN - 3) + "...",
      ar: descAr.length <= MAX_DESC_LEN ? descAr : descAr.slice(0, MAX_DESC_LEN - 3) + "..."
    }
  };
}
