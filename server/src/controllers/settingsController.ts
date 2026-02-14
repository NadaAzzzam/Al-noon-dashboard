import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Settings, DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logoPath, collectionImagePath, heroImagePath, heroVideoPath, sectionImagePath, sectionVideoPath, promoImagePath } from "../middlewares/upload.js";
import { sendResponse } from "../utils/response.js";
import { sendMail } from "../utils/email.js";

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
  stockInfoThreshold: 10,
  quickLinks: [] as { label: { en: string; ar: string }; url: string }[],
  socialLinks: { facebook: "", instagram: "" },
  newsletterEnabled: true,
  homeCollections: [] as { title: { en: string; ar: string }; image: string; hoverImage?: string; video?: string; url: string; order: number; categoryId?: string }[],
  hero: heroDefault,
  heroEnabled: true,
  newArrivalsLimit: 8,
  newArrivalsSectionImages: [] as string[],
  newArrivalsSectionVideos: [] as string[],
  homeCollectionsDisplayLimit: 0,
  ourCollectionSectionImages: [] as string[],
  ourCollectionSectionVideos: [] as string[],
  announcementBar: { text: { en: "", ar: "" }, enabled: false, backgroundColor: DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND },
  promoBanner: { enabled: false, image: "", title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" }, ctaUrl: "" },
  featuredProductsEnabled: false,
  featuredProductsLimit: 8,
  feedbackSectionEnabled: false,
  feedbackDisplayLimit: 6,
  contentPages: [] as { slug: string; title: { en: string; ar: string }; content: { en: string; ar: string } }[],
  orderNotificationsEnabled: false,
  orderNotificationEmail: "",
  aiAssistant: {
    enabled: false,
    geminiApiKey: "",
    assistantName: "alnoon-admin",
    greeting: { en: "Hi! How can I help you today?", ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟" },
    systemPrompt: "",
    suggestedQuestions: [
      { en: "What are your shipping options?", ar: "ما خيارات الشحن لديكم؟" },
      { en: "How can I return an item?", ar: "كيف أستطيع إرجاع منتج؟" },
      { en: "Show me new arrivals", ar: "أرني الوصول الجديد" }
    ]
  }
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
  if (s && typeof s === "object" && !s.aiAssistant) {
    (s as Record<string, unknown>).aiAssistant = defaults.aiAssistant;
  }
  if (typeof (s as { stockInfoThreshold?: number }).stockInfoThreshold !== "number") {
    (s as Record<string, unknown>).stockInfoThreshold = defaults.stockInfoThreshold;
  }
  const ab = (s as { announcementBar?: { text?: { en?: string; ar?: string }; enabled?: boolean; backgroundColor?: string } }).announcementBar;
  (s as Record<string, unknown>).announcementBar = {
    text: { en: ab?.text?.en ?? "", ar: ab?.text?.ar ?? "" },
    enabled: Boolean(ab?.enabled),
    backgroundColor: (ab?.backgroundColor && String(ab.backgroundColor).trim()) || DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND
  };
  return s;
}

/** Public subset of settings for storefront (no auth). Used when GET /api/settings is called without ADMIN. */
export const getPublicSettings = asyncHandler(async (req, res) => {
  const currencyDefaults = { currency: "EGP", currencySymbol: "LE" };
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: {
        settings: {
          storeName: defaults.storeName,
          logo: defaults.logo || "/uploads/logos/default-logo.png",
          announcementBar: defaults.announcementBar,
          socialLinks: defaults.socialLinks,
          newsletterEnabled: defaults.newsletterEnabled,
          contentPages: (defaults.contentPages as { slug: string; title: { en: string; ar: string } }[]).map((p) => ({ slug: p.slug, title: p.title })),
          currency: currencyDefaults.currency,
          currencySymbol: currencyDefaults.currencySymbol
        }
      }
    });
  }
  const settings = await Settings.findOne()
    .select("storeName logo announcementBar socialLinks newsletterEnabled contentPages advancedSettings")
    .lean();
  const s = settings as Record<string, unknown> | null;
  const storeName = s?.storeName ?? defaults.storeName;
  const logo = (s?.logo && String(s.logo).trim() !== "") ? String(s.logo) : "/uploads/logos/default-logo.png";
  const announcementBar = (s as { announcementBar?: { text?: { en?: string; ar?: string }; enabled?: boolean; backgroundColor?: string } })?.announcementBar ?? defaults.announcementBar;
  const socialLinks = s?.socialLinks ?? defaults.socialLinks;
  const newsletterEnabled = s?.newsletterEnabled ?? defaults.newsletterEnabled;
  const contentPages = ((s?.contentPages as { slug?: string; title?: { en?: string; ar?: string } }[]) ?? []).map((p) => ({
    slug: p?.slug ?? "",
    title: p?.title ?? { en: "", ar: "" }
  }));
  const advanced = s?.advancedSettings as { currency?: string; currencySymbol?: string } | undefined;
  const currency = (advanced?.currency && String(advanced.currency).trim()) || currencyDefaults.currency;
  const currencySymbol = (advanced?.currencySymbol && String(advanced.currencySymbol).trim()) || currencyDefaults.currencySymbol;
  sendResponse(res, req.locale, {
    data: {
      settings: {
        storeName,
        logo,
        announcementBar,
        socialLinks,
        newsletterEnabled,
        contentPages,
        currency,
        currencySymbol
      }
    }
  });
});

export const getSettings = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { settings: defaults } });
  }
  const settings = await Settings.findOne().lean();
  const normalized = normalizeSettings(settings as Record<string, unknown> | null);
  sendResponse(res, req.locale, { data: { settings: normalized } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
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
  if (updates.stockInfoThreshold !== undefined) {
    toSet.stockInfoThreshold = Math.max(0, Math.floor(Number(updates.stockInfoThreshold)));
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
      .map((item: { titleEn?: string; titleAr?: string; image?: string; hoverImage?: string; video?: string; url?: string; order?: number; categoryId?: string }, idx: number) => {
        const entry: { title: { en: string; ar: string }; image: string; hoverImage?: string; video?: string; url: string; order: number; categoryId?: mongoose.Types.ObjectId } = {
          title: {
            en: String(item.titleEn ?? "").trim(),
            ar: String(item.titleAr ?? "").trim()
          },
          image: String(item.image ?? "").trim(),
          hoverImage: String(item.hoverImage ?? "").trim() || undefined,
          video: String(item.video ?? "").trim() || undefined,
          url: String(item.url ?? "").trim(),
          order: typeof item.order === "number" ? item.order : idx
        };
        const catId = item.categoryId;
        if (catId != null && String(catId).trim() !== "" && mongoose.isValidObjectId(catId)) {
          entry.categoryId = new mongoose.Types.ObjectId(catId);
        }
        return entry;
      })
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
      backgroundColor: String(ab.backgroundColor ?? DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND).trim()
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
  if (updates.orderNotificationsEnabled !== undefined) {
    toSet.orderNotificationsEnabled = Boolean(updates.orderNotificationsEnabled);
  }
  if (updates.orderNotificationEmail !== undefined) {
    const v = String(updates.orderNotificationEmail ?? "").trim().toLowerCase();
    toSet.orderNotificationEmail = v || "";
  }
  if (updates.aiAssistant !== undefined && typeof updates.aiAssistant === "object") {
    const ai = updates.aiAssistant;
    toSet.aiAssistant = {
      enabled: Boolean(ai.enabled),
      geminiApiKey: String(ai.geminiApiKey ?? "").trim(),
      assistantName: String(ai.assistantName ?? "alnoon-admin").trim() || "alnoon-admin",
      greeting: {
        en: String(ai.greetingEn ?? ai.greeting?.en ?? "").trim(),
        ar: String(ai.greetingAr ?? ai.greeting?.ar ?? "").trim()
      },
      systemPrompt: String(ai.systemPrompt ?? "").trim(),
      suggestedQuestions: Array.isArray(ai.suggestedQuestions)
        ? ai.suggestedQuestions.map((q: { en?: string; ar?: string }) => ({
          en: String(q.en ?? "").trim(),
          ar: String(q.ar ?? "").trim()
        })).filter((q: { en: string; ar: string }) => q.en || q.ar)
        : []
    };
  }
  if (updates.currency !== undefined || updates.currencySymbol !== undefined) {
    const current = await Settings.findOne().select("advancedSettings").lean();
    const adv = (current?.advancedSettings as Record<string, unknown>) ?? {};
    toSet.advancedSettings = {
      ...adv,
      ...(updates.currency !== undefined && { currency: String(updates.currency).trim() || "EGP" }),
      ...(updates.currencySymbol !== undefined && { currencySymbol: String(updates.currencySymbol).trim() || "LE" })
    };
  }
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: toSet },
    { new: true, upsert: true }
  ).lean();
  sendResponse(res, req.locale, { message: "success.settings.updated", data: { settings } });
});

/** Send a test "New order" email to the configured notification address (or admin). */
export const sendTestOrderEmail = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const settings = await Settings.findOne().lean();
  const orderNotificationEmail = (settings as { orderNotificationEmail?: string } | null)?.orderNotificationEmail?.trim();
  const to = (orderNotificationEmail || env.adminEmail || "").toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new ApiError(400, "No notification email configured. Set notification email in settings or ADMIN_EMAIL in server config.", { code: "errors.settings.no_notification_email" });
  }
  const subject = "Test: New order notification (Al-noon)";
  const html = `
    <h2>Test order notification</h2>
    <p>This is a test email. When a customer places an order, you will receive a similar email with real order details.</p>
    <p><strong>Order ID:</strong> TEST-ORDER-002</p>
    <p><strong>Customer:</strong> Nura & Tooz Feki (nura.tooz@example.com)</p>
    <p><strong>Payment:</strong> COD</p>
    <p><strong>Shipping:</strong> 123 Test St, Cairo</p>
    <p><strong>Total:</strong> 750 EGP</p>
    <h3>Items</h3>
    <ul><li>Sample Product A × 1 = 400 EGP</li><li>Sample Product B × 1 = 350 EGP</li></ul>
    <p><em>If you received this, order notifications are working.</em></p>
  `;
  const result = await sendMail(to, subject, html);
  if (!result.ok) {
    throw new ApiError(503, result.error || "Email could not be sent.", { code: "errors.settings.email_send_failed" });
  }
  sendResponse(res, req.locale, { message: "success.settings.test_email_sent", data: { to } });
});

export const uploadLogo = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const file = req.file;
  if (!file) throw new ApiError(400, "No image file uploaded", { code: "errors.upload.no_image" });
  const pathUrl = logoPath(file.filename);
  await Settings.findOneAndUpdate({}, { $set: { logo: pathUrl } }, { new: true, upsert: true });
  sendResponse(res, req.locale, { message: "success.settings.logo_uploaded", data: { logo: pathUrl } });
});

/**
 * Unified media upload handler for home page settings.
 * Accepts mediaType query parameter: 'hero' | 'section' | 'collection' | 'promo'
 * Returns { image: "path" } for images or { video: "path" } for videos.
 */
export const uploadHomePageMedia = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const file = req.file;
  if (!file) {
    const isVideo = req.path.includes('video');
    throw new ApiError(400, isVideo ? "No video file uploaded" : "No image file uploaded", {
      code: isVideo ? "errors.upload.no_video" : "errors.upload.no_image"
    });
  }

  const mediaType = req.query.type as string || 'section';
  const isVideo = file.mimetype.startsWith('video/');

  let pathUrl: string;

  // Determine the correct path helper based on media type and file type
  if (isVideo) {
    if (mediaType === 'hero') {
      pathUrl = heroVideoPath(file.filename);
    } else {
      pathUrl = sectionVideoPath(file.filename);
    }
  } else {
    switch (mediaType) {
      case 'hero':
        pathUrl = heroImagePath(file.filename);
        break;
      case 'collection':
        pathUrl = collectionImagePath(file.filename);
        break;
      case 'promo':
        pathUrl = promoImagePath(file.filename);
        break;
      case 'section':
      default:
        pathUrl = sectionImagePath(file.filename);
        break;
    }
  }

  const message = isVideo ? "success.settings.video_uploaded" : "success.settings.image_uploaded";
  const dataKey = isVideo ? 'video' : 'image';

  sendResponse(res, req.locale, { message, data: { [dataKey]: pathUrl } });
});

// Backward compatibility - keep old endpoints but delegate to unified handler
/** @deprecated Use uploadHomePageMedia with type=collection */
export const uploadCollectionImage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  req.query.type = 'collection';
  return uploadHomePageMedia(req, res, next);
});

/** @deprecated Use uploadHomePageMedia with type=hero */
export const uploadHeroImage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  req.query.type = 'hero';
  return uploadHomePageMedia(req, res, next);
});

/** @deprecated Use uploadHomePageMedia with type=section */
export const uploadSectionImage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  req.query.type = 'section';
  return uploadHomePageMedia(req, res, next);
});

/** @deprecated Use uploadHomePageMedia with type=hero */
export const uploadHeroVideo = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  req.query.type = 'hero';
  return uploadHomePageMedia(req, res, next);
});

/** @deprecated Use uploadHomePageMedia with type=section */
export const uploadSectionVideo = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  req.query.type = 'section';
  return uploadHomePageMedia(req, res, next);
});

/** @deprecated Use uploadHomePageMedia with type=promo */
export const uploadPromoImage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  req.query.type = 'promo';
  return uploadHomePageMedia(req, res, next);
});
