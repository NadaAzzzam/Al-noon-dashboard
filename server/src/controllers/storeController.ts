import { Settings, DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND } from "../models/Settings.js";
import { Subscriber } from "../models/Subscriber.js";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { ProductFeedback } from "../models/ProductFeedback.js";
import { Product } from "../models/Product.js";
import { isDbConnected } from "../config/db.js";
import { withProductMedia } from "../types/productMedia.js";
import type { ProductMedia } from "../types/productMedia.js";
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

/** Default logo path (always used when no custom logo is set). */
export const DEFAULT_LOGO_PATH = "/uploads/logos/default-logo.png";

const storeDefaults = {
  storeName: { en: "Al-noon", ar: "النون" },
  logo: DEFAULT_LOGO_PATH,
  quickLinks: [] as { label: { en: string; ar: string }; url: string }[],
  socialLinks: { facebook: "", instagram: "" },
  newsletterEnabled: true,
  homeCollections: [] as { title: { en: string; ar: string }; image: string; hoverImage?: string; video?: string; url: string; order: number; categoryId?: string }[],
  hero: heroDefault,
  heroEnabled: true,
  newArrivalsLimit: 8,
  newArrivals: [] as unknown[],
  newArrivalsSectionImages: [] as string[],
  newArrivalsSectionVideos: [] as string[],
  homeCollectionsDisplayLimit: 0,
  ourCollectionSectionImages: [] as string[],
  ourCollectionSectionVideos: [] as string[],
  feedbackSectionEnabled: true,
  feedbackDisplayLimit: 6,
  feedbacks: [] as { product: { name: { en: string; ar: string } }; customerName: string; message: string; rating: number; image?: string }[]
};

/** Max hero images to return for storefront (e.g. for slider). */
const HERO_IMAGES_LIMIT = 3;

/** Store-facing product (newArrivals): only fields needed for listing cards. No __v, createdAt, updatedAt, isNewArrival, stock, status, sizeDescriptions, details, stylingTip. */
function toStoreProductShape(p: Record<string, unknown>): {
  _id: unknown;
  name: unknown;
  description: unknown;
  category: { _id: unknown; name: unknown };
  price: number;
  discountPrice?: number;
  media: ProductMedia;
  sizes: string[];
  colors: string[];
} {
  const category = p.category as { _id?: unknown; name?: unknown } | null | undefined;
  return {
    _id: p._id,
    name: p.name,
    description: p.description,
    category: category
      ? { _id: category._id, name: category.name }
      : { _id: null, name: { en: "", ar: "" } },
    price: Number(p.price) ?? 0,
    ...(p.discountPrice != null && p.discountPrice !== "" ? { discountPrice: Number(p.discountPrice) } : {}),
    media: p.media as ProductMedia,
    sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
    colors: Array.isArray(p.colors) ? (p.colors as string[]) : []
  };
}

/** Store-facing home collection: title, default image, optional hover image, optional video, url, order, optional categoryId. */
function toStoreCollectionShape(c: { title?: unknown; image?: string; hoverImage?: string; video?: string; url?: string; order?: number; categoryId?: unknown }): {
  title: unknown;
  image: string;
  hoverImage?: string;
  video?: string;
  url: string;
  order: number;
  categoryId?: string;
} {
  const out: { title: unknown; image: string; hoverImage?: string; video?: string; url: string; order: number; categoryId?: string } = {
    title: c.title ?? { en: "", ar: "" },
    image: typeof c.image === "string" ? c.image : "",
    url: typeof c.url === "string" ? c.url : "",
    order: typeof c.order === "number" ? c.order : 0
  };
  if (typeof c.hoverImage === "string" && c.hoverImage.trim() !== "") out.hoverImage = c.hoverImage.trim();
  if (typeof c.video === "string" && c.video.trim() !== "") out.video = c.video.trim();
  const catId = c.categoryId;
  if (catId != null && catId !== "") {
    const idStr = typeof catId === "string" ? catId : String(catId);
    if (idStr && idStr !== "undefined" && idStr !== "[object Object]") out.categoryId = idStr;
  }
  return out;
}

/** Store-facing quick link: only label and url (no _id). */
function toStoreQuickLinkShape(q: { label?: unknown; url?: string }): { label: unknown; url: string } {
  return {
    label: q.label ?? { en: "", ar: "" },
    url: typeof q.url === "string" ? q.url : ""
  };
}

/** Store-facing feedback: only product name, customerName, message, rating, image (no _id). */
function toStoreFeedbackShape(f: { product?: { name?: unknown }; customerName?: string; message?: string; rating?: number; image?: string }): {
  product: { name: { en: string; ar: string } };
  customerName: string;
  message: string;
  rating: number;
  image?: string;
} {
  const prod = f.product as { name?: unknown } | null | undefined;
  const nameRaw = prod?.name;
  const name: { en: string; ar: string } =
    nameRaw != null && typeof nameRaw === "object" && "en" in nameRaw && "ar" in nameRaw
      ? { en: String((nameRaw as { en?: unknown }).en ?? ""), ar: String((nameRaw as { ar?: unknown }).ar ?? "") }
      : { en: "", ar: "" };
  return {
    product: { name },
    customerName: typeof f.customerName === "string" ? f.customerName : "",
    message: typeof f.message === "string" ? f.message : "",
    rating: typeof f.rating === "number" ? f.rating : 0,
    ...(f.image ? { image: f.image } : {})
  };
}

function normalizeHero(hero: { image?: string; images?: string[]; videos?: string[] } | null | undefined) {
  if (!hero) return heroDefault;
  const images = Array.isArray(hero.images) ? hero.images : (hero.image ? [hero.image] : []);
  const videos = Array.isArray(hero.videos) ? hero.videos : [];
  return { ...hero, images: images.slice(0, HERO_IMAGES_LIMIT), videos };
}


/** Public: single home page API – returns all sections (store meta, hero, newArrivals products, collections, feedbacks). */
export const getStoreHome = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: {
        home: {
          store: { storeName: storeDefaults.storeName, logo: storeDefaults.logo, quickLinks: storeDefaults.quickLinks, socialLinks: storeDefaults.socialLinks, newsletterEnabled: storeDefaults.newsletterEnabled },
          hero: heroDefault,
          heroEnabled: storeDefaults.heroEnabled,
          newArrivals: [],
          homeCollections: storeDefaults.homeCollections,
          feedbackSectionEnabled: storeDefaults.feedbackSectionEnabled,
          feedbackDisplayLimit: storeDefaults.feedbackDisplayLimit,
          feedbacks: storeDefaults.feedbacks,
          announcementBar: { text: { en: "", ar: "" }, enabled: false, backgroundColor: DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND },
          promoBanner: { enabled: false, image: "", title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" }, ctaUrl: "" }
        }
      }
    });
  }
  const settings = await Settings.findOne().lean();
  const s = settings ?? null;
  const homeCollections = (s?.homeCollections ?? storeDefaults.homeCollections).sort((a, b) => a.order - b.order);
  const displayLimit = s?.homeCollectionsDisplayLimit ?? storeDefaults.homeCollectionsDisplayLimit;
  const collectionsToShow = displayLimit > 0 ? homeCollections.slice(0, displayLimit) : homeCollections;
  const hero = normalizeHero(s?.hero as { image?: string; images?: string[]; videos?: string[] } | null);
  const feedbackSectionEnabled = (s as { feedbackSectionEnabled?: boolean })?.feedbackSectionEnabled ?? storeDefaults.feedbackSectionEnabled;
  const feedbackDisplayLimit = (s as { feedbackDisplayLimit?: number })?.feedbackDisplayLimit ?? storeDefaults.feedbackDisplayLimit;
  const newArrivalsLimit = Math.max(1, Math.min(24, s?.newArrivalsLimit ?? storeDefaults.newArrivalsLimit));

  let feedbacks = storeDefaults.feedbacks;
  if (feedbackSectionEnabled) {
    const limit = feedbackDisplayLimit > 0 ? feedbackDisplayLimit : 50;
    const list = await ProductFeedback.find({ approved: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .populate("product", "name")
      .lean();
    feedbacks = list.map((f: unknown) => toStoreFeedbackShape(f as { product?: { name?: unknown }; customerName?: string; message?: string; rating?: number; image?: string }));
  }

  const newArrivalProducts = await Product.find({ isNewArrival: true, status: "ACTIVE", deletedAt: null })
    .populate("category", "name status")
    .sort({ createdAt: -1 })
    .limit(newArrivalsLimit)
    .lean();
  const newArrivals = (newArrivalProducts as Record<string, unknown>[]).map((p) => {
    const withMedia = withProductMedia(p as { images?: string[]; videos?: string[]; viewImage?: string; hoverImage?: string }, { forList: true });
    return toStoreProductShape(withMedia as Record<string, unknown>);
  });

  const announcementBar = (s as { announcementBar?: { text: { en: string; ar: string }; enabled: boolean; backgroundColor: string } })?.announcementBar ?? { text: { en: "", ar: "" }, enabled: false, backgroundColor: DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND };
  const promoBanner = (s as { promoBanner?: { enabled: boolean; image: string; title: { en: string; ar: string }; subtitle: { en: string; ar: string }; ctaLabel: { en: string; ar: string }; ctaUrl: string } })?.promoBanner ?? { enabled: false, image: "", title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" }, ctaUrl: "" };

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

  const quickLinks = (s?.quickLinks ?? storeDefaults.quickLinks).map((q) => toStoreQuickLinkShape(q));
  const homeCollectionsStripped = collectionsToShow.map((c) => toStoreCollectionShape(c));

  sendResponse(res, req.locale, {
    data: {
      home: {
        store: {
          storeName: s?.storeName ?? storeDefaults.storeName,
          logo: (s?.logo && s.logo.trim() !== "") ? s.logo : DEFAULT_LOGO_PATH,
          quickLinks,
          socialLinks: s?.socialLinks ?? storeDefaults.socialLinks,
          newsletterEnabled: s?.newsletterEnabled ?? storeDefaults.newsletterEnabled
        },
        hero,
        heroEnabled: s?.heroEnabled ?? storeDefaults.heroEnabled,
        newArrivalsLimit,
        newArrivals,
        newArrivalsSectionImages: newArrivalsImages,
        newArrivalsSectionVideos: newArrivalsVideos,
        homeCollections: homeCollectionsStripped,
        homeCollectionsDisplayLimit: displayLimit,
        ourCollectionSectionImages: ourCollectionImages,
        ourCollectionSectionVideos: ourCollectionVideos,
        feedbackSectionEnabled,
        feedbackDisplayLimit,
        feedbacks,
        announcementBar,
        promoBanner
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
