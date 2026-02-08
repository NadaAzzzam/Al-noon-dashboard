import type { Request, Response, NextFunction } from "express";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logoPath, collectionImagePath, heroImagePath, heroVideoPath, sectionImagePath, sectionVideoPath, promoImagePath } from "../middlewares/upload.js";

const heroDefault = {
  images: [] as string[],
  videos: [] as string[],
  title: { en: "", ar: "" },
  subtitle: { en: "", ar: "" },
  ctaLabel: { en: "", ar: "" },
  ctaUrl: ""
};

const defaults = {
  storeName: { en: "Al-noon", ar: "النون" },
  logo: "",
  instaPayNumber: "",
  paymentMethods: { cod: true, instaPay: true },
  lowStockThreshold: 5,
  quickLinks: [] as { label: { en: string; ar: string }; url: string }[],
  socialLinks: { facebook: "", instagram: "" },
  newsletterEnabled: true,
  homeCollections: [] as { title: { en: string; ar: string }; image: string; url: string; order: number }[],
  hero: heroDefault,
  heroEnabled: true,
  newArrivalsLimit: 8,
  newArrivalsSectionImages: [] as string[],
  newArrivalsSectionVideos: [] as string[],
  homeCollectionsDisplayLimit: 0,
  ourCollectionSectionImages: [] as string[],
  ourCollectionSectionVideos: [] as string[],
  announcementBar: { text: { en: "", ar: "" }, enabled: false, backgroundColor: "#0f172a" },
  promoBanner: { enabled: false, image: "", title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" }, ctaUrl: "" },
  featuredProductsEnabled: false,
  featuredProductsLimit: 8,
  feedbackSectionEnabled: false,
  feedbackDisplayLimit: 6,
  contentPages: [] as { slug: string; title: { en: string; ar: string }; content: { en: string; ar: string } }[]
};

function normalizeSettings(raw: Record<string, unknown> | null): Record<string, unknown> {
  if (!raw) return defaults as unknown as Record<string, unknown>;
  const s = { ...raw };
  const hero = s.hero as { image?: string; images?: string[]; videos?: string[] } | undefined;
  if (hero) {
    if (!Array.isArray(hero.images)) hero.images = hero.image ? [hero.image] : [];
    if (!Array.isArray(hero.videos)) hero.videos = [];
    delete (hero as Record<string, unknown>).image;
  }
  if (!Array.isArray(s.newArrivalsSectionImages)) {
    s.newArrivalsSectionImages = (s.newArrivalsSectionImage && String(s.newArrivalsSectionImage)) ? [String(s.newArrivalsSectionImage)] : [];
  }
  if (!Array.isArray(s.newArrivalsSectionVideos)) s.newArrivalsSectionVideos = [];
  if (!Array.isArray(s.ourCollectionSectionImages)) {
    s.ourCollectionSectionImages = (s.ourCollectionSectionImage && String(s.ourCollectionSectionImage)) ? [String(s.ourCollectionSectionImage)] : [];
  }
  if (!Array.isArray(s.ourCollectionSectionVideos)) s.ourCollectionSectionVideos = [];
  return s;
}

export const getSettings = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ settings: defaults });
    return;
  }
  const settings = await Settings.findOne().lean();
  const normalized = normalizeSettings(settings as Record<string, unknown> | null);
  res.json({ settings: normalized });
  return;
});

export const updateSettings = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const updates = req.body;
  const toSet: Record<string, unknown> = {};
  if (updates.storeNameEn !== undefined || updates.storeNameAr !== undefined) {
    toSet.storeName = {
      en: String(updates.storeNameEn ?? "").trim(),
      ar: String(updates.storeNameAr ?? "").trim()
    };
  }
  if (updates.logo !== undefined) toSet.logo = String(updates.logo);
  if (updates.instaPayNumber !== undefined) toSet.instaPayNumber = String(updates.instaPayNumber);
  if (updates.paymentMethods !== undefined) {
    toSet.paymentMethods = {
      cod: Boolean(updates.paymentMethods?.cod),
      instaPay: Boolean(updates.paymentMethods?.instaPay)
    };
  }
  if (updates.lowStockThreshold !== undefined) {
    toSet.lowStockThreshold = Math.max(0, Math.floor(Number(updates.lowStockThreshold)));
  }
  if (updates.googleAnalyticsId !== undefined) {
    const v = String(updates.googleAnalyticsId ?? "").trim();
    toSet.googleAnalyticsId = v || undefined;
  }
  if (updates.quickLinks !== undefined && Array.isArray(updates.quickLinks)) {
    toSet.quickLinks = updates.quickLinks.map((item: { labelEn?: string; labelAr?: string; url?: string }) => ({
      label: {
        en: String(item.labelEn ?? "").trim(),
        ar: String(item.labelAr ?? "").trim()
      },
      url: String(item.url ?? "").trim()
    })).filter((item: { url: string }) => item.url);
  }
  if (updates.socialLinks !== undefined && typeof updates.socialLinks === "object") {
    toSet.socialLinks = {
      facebook: String(updates.socialLinks.facebook ?? "").trim(),
      instagram: String(updates.socialLinks.instagram ?? "").trim()
    };
  }
  if (updates.newsletterEnabled !== undefined) toSet.newsletterEnabled = Boolean(updates.newsletterEnabled);
  if (updates.homeCollections !== undefined && Array.isArray(updates.homeCollections)) {
    const items = updates.homeCollections
      .map((item: { titleEn?: string; titleAr?: string; image?: string; url?: string; order?: number }, idx: number) => ({
        title: {
          en: String(item.titleEn ?? "").trim(),
          ar: String(item.titleAr ?? "").trim()
        },
        image: String(item.image ?? "").trim(),
        url: String(item.url ?? "").trim(),
        order: typeof item.order === "number" ? item.order : idx
      }))
      .filter((item: { image: string; url: string }) => item.image || item.url);
    toSet.homeCollections = items.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
  }
  if (updates.hero !== undefined && typeof updates.hero === "object") {
    const h = updates.hero;
    const images = Array.isArray(h.images) ? h.images.map((x: unknown) => String(x ?? "").trim()).filter(Boolean) : [];
    const videos = Array.isArray(h.videos) ? h.videos.map((x: unknown) => String(x ?? "").trim()).filter(Boolean) : [];
    toSet.hero = {
      images,
      videos,
      title: {
        en: String(h.titleEn ?? "").trim(),
        ar: String(h.titleAr ?? "").trim()
      },
      subtitle: {
        en: String(h.subtitleEn ?? "").trim(),
        ar: String(h.subtitleAr ?? "").trim()
      },
      ctaLabel: {
        en: String(h.ctaLabelEn ?? "").trim(),
        ar: String(h.ctaLabelAr ?? "").trim()
      },
      ctaUrl: String(h.ctaUrl ?? "").trim()
    };
  }
  if (updates.heroEnabled !== undefined) toSet.heroEnabled = Boolean(updates.heroEnabled);
  if (updates.newArrivalsLimit !== undefined) {
    toSet.newArrivalsLimit = Math.max(1, Math.min(24, Math.floor(Number(updates.newArrivalsLimit))));
  }
  if (updates.newArrivalsSectionImages !== undefined && Array.isArray(updates.newArrivalsSectionImages)) {
    toSet.newArrivalsSectionImages = updates.newArrivalsSectionImages.map((x: unknown) => String(x ?? "").trim()).filter(Boolean);
  }
  if (updates.newArrivalsSectionVideos !== undefined && Array.isArray(updates.newArrivalsSectionVideos)) {
    toSet.newArrivalsSectionVideos = updates.newArrivalsSectionVideos.map((x: unknown) => String(x ?? "").trim()).filter(Boolean);
  }
  if (updates.homeCollectionsDisplayLimit !== undefined) {
    toSet.homeCollectionsDisplayLimit = Math.max(0, Math.floor(Number(updates.homeCollectionsDisplayLimit)));
  }
  if (updates.ourCollectionSectionImages !== undefined && Array.isArray(updates.ourCollectionSectionImages)) {
    toSet.ourCollectionSectionImages = updates.ourCollectionSectionImages.map((x: unknown) => String(x ?? "").trim()).filter(Boolean);
  }
  if (updates.ourCollectionSectionVideos !== undefined && Array.isArray(updates.ourCollectionSectionVideos)) {
    toSet.ourCollectionSectionVideos = updates.ourCollectionSectionVideos.map((x: unknown) => String(x ?? "").trim()).filter(Boolean);
  }
  if (updates.announcementBar !== undefined && typeof updates.announcementBar === "object") {
    const ab = updates.announcementBar;
    toSet.announcementBar = {
      text: { en: String(ab.textEn ?? "").trim(), ar: String(ab.textAr ?? "").trim() },
      enabled: Boolean(ab.enabled),
      backgroundColor: String(ab.backgroundColor ?? "#0f172a").trim()
    };
  }
  if (updates.promoBanner !== undefined && typeof updates.promoBanner === "object") {
    const pb = updates.promoBanner;
    toSet.promoBanner = {
      enabled: Boolean(pb.enabled),
      image: String(pb.image ?? "").trim(),
      title: { en: String(pb.titleEn ?? "").trim(), ar: String(pb.titleAr ?? "").trim() },
      subtitle: { en: String(pb.subtitleEn ?? "").trim(), ar: String(pb.subtitleAr ?? "").trim() },
      ctaLabel: { en: String(pb.ctaLabelEn ?? "").trim(), ar: String(pb.ctaLabelAr ?? "").trim() },
      ctaUrl: String(pb.ctaUrl ?? "").trim()
    };
  }
  if (updates.featuredProductsEnabled !== undefined) toSet.featuredProductsEnabled = Boolean(updates.featuredProductsEnabled);
  if (updates.featuredProductsLimit !== undefined) {
    toSet.featuredProductsLimit = Math.max(1, Math.min(24, Math.floor(Number(updates.featuredProductsLimit))));
  }
  if (updates.feedbackSectionEnabled !== undefined) toSet.feedbackSectionEnabled = Boolean(updates.feedbackSectionEnabled);
  if (updates.feedbackDisplayLimit !== undefined) {
    toSet.feedbackDisplayLimit = Math.max(0, Math.min(50, Math.floor(Number(updates.feedbackDisplayLimit))));
  }
  if (updates.contentPages !== undefined && Array.isArray(updates.contentPages)) {
    const allowedSlugs = ["privacy", "return-policy", "shipping-policy", "about", "contact"];
    toSet.contentPages = updates.contentPages
      .map((item: { slug?: string; titleEn?: string; titleAr?: string; contentEn?: string; contentAr?: string }) => {
        const slug = String(item.slug ?? "").trim().toLowerCase();
        if (!allowedSlugs.includes(slug)) return null;
        return {
          slug,
          title: {
            en: String(item.titleEn ?? "").trim(),
            ar: String(item.titleAr ?? "").trim()
          },
          content: {
            en: String(item.contentEn ?? "").trim(),
            ar: String(item.contentAr ?? "").trim()
          }
        };
      })
      .filter(Boolean);
  }
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: toSet },
    { new: true, upsert: true }
  ).lean();
  res.json({ settings });
});

export const uploadLogo = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file uploaded. Please select an image (PNG, JPG, GIF, WEBP).");
  const pathUrl = logoPath(file.filename);
  await Settings.findOneAndUpdate({}, { $set: { logo: pathUrl } }, { new: true, upsert: true });
  res.json({ logo: pathUrl });
  return;
});

/** Upload a collection image for homepage. Returns { image: "/uploads/collections/..." }. Does not update settings. */
export const uploadCollectionImage = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file uploaded. Please select an image (PNG, JPG, GIF, WEBP).");
  const pathUrl = collectionImagePath(file.filename);
  res.json({ image: pathUrl });
});

/** Upload hero image. Returns { image: "/uploads/hero/..." }. Does not update settings. */
export const uploadHeroImage = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file uploaded. Please select an image (PNG, JPG, GIF, WEBP).");
  const pathUrl = heroImagePath(file.filename);
  res.json({ image: pathUrl });
});

/** Upload section image (New Arrivals or Our Collection banner). Returns { image: "/uploads/sections/..." }. */
export const uploadSectionImage = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file uploaded. Please select an image (PNG, JPG, GIF, WEBP).");
  const pathUrl = sectionImagePath(file.filename);
  res.json({ image: pathUrl });
});

/** Upload hero video. Returns { video: "/uploads/hero/videos/..." }. */
export const uploadHeroVideo = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const file = req.file;
  if (!file) throw new ApiError(400, "No video file uploaded. Please select a video (MP4, WebM, MOV, OGG).");
  const pathUrl = heroVideoPath(file.filename);
  res.json({ video: pathUrl });
});

/** Upload section video (New Arrivals or Our Collection). Returns { video: "/uploads/sections/videos/..." }. */
export const uploadSectionVideo = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const file = req.file;
  if (!file) throw new ApiError(400, "No video file uploaded. Please select a video (MP4, WebM, MOV, OGG).");
  const pathUrl = sectionVideoPath(file.filename);
  res.json({ video: pathUrl });
});

/** Upload promotional banner image. Returns { image: "/uploads/promo/..." }. */
export const uploadPromoImage = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file uploaded. Please select an image (PNG, JPG, GIF, WEBP).");
  const pathUrl = promoImagePath(file.filename);
  res.json({ image: pathUrl });
});
