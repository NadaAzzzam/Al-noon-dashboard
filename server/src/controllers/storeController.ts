import { Settings } from "../models/Settings.js";
import { Subscriber } from "../models/Subscriber.js";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { ProductFeedback } from "../models/ProductFeedback.js";
import { isDbConnected } from "../config/db.js";
import { t } from "../i18n.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

const heroDefault = {
  images: [] as string[],
  videos: [] as string[],
  title: { en: "", ar: "" },
  subtitle: { en: "", ar: "" },
  ctaLabel: { en: "", ar: "" },
  ctaUrl: ""
};

const storeDefaults = {
  storeName: { en: "Al-noon", ar: "النون" },
  logo: "",
  quickLinks: [] as { label: { en: string; ar: string }; url: string }[],
  socialLinks: { facebook: "", instagram: "" },
  newsletterEnabled: true,
  homeCollections: [] as { title: { en: string; ar: string }; image: string; video?: string; url: string; order: number }[],
  hero: heroDefault,
  heroEnabled: true,
  newArrivalsLimit: 8,
  newArrivalsSectionImages: [] as string[],
  newArrivalsSectionVideos: [] as string[],
  homeCollectionsDisplayLimit: 0,
  ourCollectionSectionImages: [] as string[],
  ourCollectionSectionVideos: [] as string[],
  feedbackSectionEnabled: true,
  feedbackDisplayLimit: 6,
  feedbacks: [] as { _id: string; product: { name: { en: string; ar: string } }; customerName: string; message: string; rating: number; image?: string }[]
};

/** Max hero images to return for storefront (e.g. for slider). */
const HERO_IMAGES_LIMIT = 3;

function normalizeHero(hero: { image?: string; images?: string[]; videos?: string[] } | null | undefined) {
  if (!hero) return heroDefault;
  const images = Array.isArray(hero.images) ? hero.images : (hero.image ? [hero.image] : []);
  const videos = Array.isArray(hero.videos) ? hero.videos : [];
  return { ...hero, images: images.slice(0, HERO_IMAGES_LIMIT), videos };
}

/** Public: used by e-commerce storefront for footer, header, newsletter. */
export const getStore = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { store: storeDefaults } });
  }
  const settings = await Settings.findOne().lean();
  const s = settings ?? null;
  const homeCollections = (s?.homeCollections ?? storeDefaults.homeCollections).sort((a, b) => a.order - b.order);
  const displayLimit = s?.homeCollectionsDisplayLimit ?? storeDefaults.homeCollectionsDisplayLimit;
  const collectionsToShow = displayLimit > 0 ? homeCollections.slice(0, displayLimit) : homeCollections;

  const hero = normalizeHero(s?.hero as { image?: string; images?: string[]; videos?: string[] } | null);
  const newArrivalsImages = Array.isArray((s as { newArrivalsSectionImages?: string[] })?.newArrivalsSectionImages)
    ? (s as { newArrivalsSectionImages: string[] }).newArrivalsSectionImages
    : ((s as unknown as { newArrivalsSectionImage?: string })?.newArrivalsSectionImage ? [(s as unknown as { newArrivalsSectionImage: string }).newArrivalsSectionImage] : storeDefaults.newArrivalsSectionImages);
  const newArrivalsVideos = Array.isArray((s as { newArrivalsSectionVideos?: string[] })?.newArrivalsSectionVideos)
    ? (s as { newArrivalsSectionVideos: string[] }).newArrivalsSectionVideos
    : storeDefaults.newArrivalsSectionVideos;
  const ourCollectionImages = Array.isArray((s as { ourCollectionSectionImages?: string[] })?.ourCollectionSectionImages)
    ? (s as { ourCollectionSectionImages: string[] }).ourCollectionSectionImages
    : ((s as unknown as { ourCollectionSectionImage?: string })?.ourCollectionSectionImage ? [(s as unknown as { ourCollectionSectionImage: string }).ourCollectionSectionImage] : storeDefaults.ourCollectionSectionImages);
  const ourCollectionVideos = Array.isArray((s as { ourCollectionSectionVideos?: string[] })?.ourCollectionSectionVideos)
    ? (s as { ourCollectionSectionVideos: string[] }).ourCollectionSectionVideos
    : storeDefaults.ourCollectionSectionVideos;

  const feedbackSectionEnabled = (s as { feedbackSectionEnabled?: boolean })?.feedbackSectionEnabled ?? storeDefaults.feedbackSectionEnabled;
  const feedbackDisplayLimit = (s as { feedbackDisplayLimit?: number })?.feedbackDisplayLimit ?? storeDefaults.feedbackDisplayLimit;
  let feedbacks = storeDefaults.feedbacks;
  if (feedbackSectionEnabled && isDbConnected()) {
    const limit = feedbackDisplayLimit > 0 ? feedbackDisplayLimit : 50;
    const list = await ProductFeedback.find({ approved: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .populate("product", "name")
      .lean();
    feedbacks = list.map((f: unknown) => {
      const item = f as { _id: unknown; product: unknown; customerName: string; message: string; rating: number; image?: string };
      const prod = item.product as { name?: { en: string; ar: string } } | null | undefined;
      return {
        _id: String(item._id),
        product: prod?.name ? { name: prod.name } : { name: { en: "", ar: "" } },
        customerName: item.customerName,
        message: item.message,
        rating: item.rating,
        image: item.image || undefined
      };
    });
  }

  sendResponse(res, req.locale, {
    data: {
      store: {
        storeName: s?.storeName ?? storeDefaults.storeName,
        logo: s?.logo ?? storeDefaults.logo,
        quickLinks: s?.quickLinks ?? storeDefaults.quickLinks,
        socialLinks: s?.socialLinks ?? storeDefaults.socialLinks,
        newsletterEnabled: s?.newsletterEnabled ?? storeDefaults.newsletterEnabled,
        homeCollections: collectionsToShow,
        hero,
        heroEnabled: s?.heroEnabled ?? storeDefaults.heroEnabled,
        newArrivalsLimit: s?.newArrivalsLimit ?? storeDefaults.newArrivalsLimit,
        newArrivalsSectionImages: newArrivalsImages,
        newArrivalsSectionVideos: newArrivalsVideos,
        homeCollectionsDisplayLimit: displayLimit,
        ourCollectionSectionImages: ourCollectionImages,
        ourCollectionSectionVideos: ourCollectionVideos,
        feedbackSectionEnabled,
        feedbackDisplayLimit,
        feedbacks
      }
    }
  });
});

const CONTENT_SLUGS = ["privacy", "return-policy", "shipping-policy", "about", "contact"] as const;

/** Public: get one content page by slug for storefront (e.g. /policy/privacy). */
export const getPageBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug ?? "").trim().toLowerCase();
  if (!CONTENT_SLUGS.includes(slug as typeof CONTENT_SLUGS[number])) {
    throw new ApiError(404, "Page not found", { code: "errors.page.not_found" });
  }
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { page: { slug, title: { en: "", ar: "" }, content: { en: "", ar: "" } } } });
  }
  const settings = await Settings.findOne().lean();
  const list = settings?.contentPages ?? [];
  const page = list.find((p: { slug: string }) => p.slug === slug);
  if (!page) {
    return sendResponse(res, req.locale, { data: { page: { slug, title: { en: "", ar: "" }, content: { en: "", ar: "" } } } });
  }
  sendResponse(res, req.locale, {
    data: {
      page: {
        slug: page.slug,
        title: page.title ?? { en: "", ar: "" },
        content: page.content ?? { en: "", ar: "" }
      }
    }
  });
});

/** Public: submit Contact Us form (name, email, phone, comment). */
export const submitContact = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Service temporarily unavailable", { code: "errors.common.db_unavailable" });
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const phone = String(req.body?.phone ?? "").trim();
  const comment = String(req.body?.comment ?? "").trim();
  if (!name) throw new ApiError(400, "Name is required", { code: "errors.contact.name_required" });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Valid email is required", { code: "errors.contact.email_required" });
  }
  if (!comment) throw new ApiError(400, "Comment is required", { code: "errors.contact.comment_required" });
  await ContactSubmission.create({ name, email, phone: phone || undefined, comment });
  sendResponse(res, req.locale, { status: 201, message: "success.contact.submitted" });
});

/** Public: subscribe to newsletter (e-commerce footer form). */
export const subscribeNewsletter = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Service temporarily unavailable", { code: "errors.common.db_unavailable" });
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Valid email is required", { code: "errors.contact.email_required" });
  }
  const settings = await Settings.findOne().lean();
  if (!settings?.newsletterEnabled) {
    throw new ApiError(400, "Newsletter signup is not available", { code: "errors.newsletter.not_available" });
  }
  try {
    await Subscriber.create({ email });
    sendResponse(res, req.locale, { status: 201, message: "success.newsletter.subscribed" });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      res.status(409).json({
        success: false,
        message: t(req.locale, "errors.newsletter.already_subscribed"),
        code: "CONFLICT",
        data: null,
        alreadySubscribed: true
      });
      return;
    }
    throw err;
  }
});
