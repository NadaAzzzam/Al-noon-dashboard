import mongoose, { Schema } from "mongoose";

export interface LocalizedString {
  en: string;
  ar: string;
}

/** Default announcement bar background: CSS color or gradient (e.g. linear-gradient). */
export const DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND =
  "linear-gradient(90deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e)";

export interface SettingsDocument {
  storeName: LocalizedString;
  logo?: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  lowStockThreshold: number;
  /** Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX) for tracking. */
  googleAnalyticsId?: string;
  /** Footer quick links (label + url) for storefront. */
  quickLinks: { label: LocalizedString; url: string }[];
  /** Social media URLs for storefront footer. */
  socialLinks: { facebook?: string; instagram?: string };
  /** Whether newsletter signup is shown and accepted on storefront. */
  newsletterEnabled: boolean;
  /** Homepage collection cards (title, default image, optional hover image, optional video, link, optional category id) for e-commerce home. */
  homeCollections: { title: LocalizedString; image: string; hoverImage?: string; video?: string; url: string; order: number; categoryId?: mongoose.Types.ObjectId }[];
  /** Hero section (top of e-commerce home): multiple images/videos, title, subtitle, CTA. */
  hero: {
    images: string[];
    videos: string[];
    title: LocalizedString;
    subtitle: LocalizedString;
    ctaLabel: LocalizedString;
    ctaUrl: string;
  };
  /** Whether the hero section is shown on the storefront. */
  heroEnabled: boolean;
  /** Number of products to show in "New Arrivals" on home page. */
  newArrivalsLimit: number;
  /** Section media for "New Arrivals" block on home page. */
  newArrivalsSectionImages: string[];
  newArrivalsSectionVideos: string[];
  /** Max number of collection cards to show in "Our Collection" on home (0 = show all). */
  homeCollectionsDisplayLimit: number;
  /** Section media for "Our Collection" block on home page. */
  ourCollectionSectionImages: string[];
  ourCollectionSectionVideos: string[];
  /** Announcement bar text shown at top of storefront. backgroundColor: CSS color or gradient (e.g. linear-gradient). */
  announcementBar: { text: LocalizedString; enabled: boolean; backgroundColor: string };
  /** Promotional banner for sales / seasonal campaigns. */
  promoBanner: {
    enabled: boolean;
    image: string;
    title: LocalizedString;
    subtitle: LocalizedString;
    ctaLabel: LocalizedString;
    ctaUrl: string;
  };
  /** Whether to show featured/trending products section on storefront home. */
  featuredProductsEnabled: boolean;
  /** Number of featured/trending products to show on home page. */
  featuredProductsLimit: number;
  /** Whether to show product feedback/testimonials section on storefront home. */
  feedbackSectionEnabled: boolean;
  /** Number of feedback items to show on home page (0 = show all approved). */
  feedbackDisplayLimit: number;
  /** Rich-text content for footer pages: Privacy, Return Policy, Shipping, About, Contact. */
  contentPages: { slug: string; title: LocalizedString; content: LocalizedString }[];
  /** Send admin email when a customer places an order. */
  orderNotificationsEnabled?: boolean;
  /** Email address to receive new order notifications (defaults to admin email if not set). */
  orderNotificationEmail?: string;
  /** AI shopping assistant (chatbot) configuration. */
  aiAssistant?: {
    enabled: boolean;
    geminiApiKey: string;
    greeting: LocalizedString;
    systemPrompt: string;
    suggestedQuestions: LocalizedString[];
  };
  updatedAt: Date;
}

const localizedSchema = new Schema({ en: { type: String, default: "" }, ar: { type: String, default: "" } }, { _id: false });

const settingsSchema = new Schema<SettingsDocument>(
  {
    storeName: { type: localizedSchema, default: () => ({ en: "Al-noon", ar: "النون" }) },
    logo: { type: String },
    instaPayNumber: { type: String, default: "" },
    paymentMethods: {
      cod: { type: Boolean, default: true },
      instaPay: { type: Boolean, default: true }
    },
    lowStockThreshold: { type: Number, default: 5 },
    googleAnalyticsId: { type: String },
    quickLinks: {
      type: [{ label: localizedSchema, url: String }],
      default: []
    },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" }
    },
    newsletterEnabled: { type: Boolean, default: true },
    homeCollections: {
      type: [{ title: localizedSchema, image: String, hoverImage: String, video: String, url: String, order: Number, categoryId: Schema.Types.ObjectId }],
      default: []
    },
    hero: {
      images: { type: [String], default: [] },
      videos: { type: [String], default: [] },
      title: { type: localizedSchema, default: () => ({ en: "", ar: "" }) },
      subtitle: { type: localizedSchema, default: () => ({ en: "", ar: "" }) },
      ctaLabel: { type: localizedSchema, default: () => ({ en: "", ar: "" }) },
      ctaUrl: { type: String, default: "" }
    },
    heroEnabled: { type: Boolean, default: true },
    newArrivalsLimit: { type: Number, default: 8 },
    newArrivalsSectionImages: { type: [String], default: [] },
    newArrivalsSectionVideos: { type: [String], default: [] },
    homeCollectionsDisplayLimit: { type: Number, default: 0 },
    ourCollectionSectionImages: { type: [String], default: [] },
    ourCollectionSectionVideos: { type: [String], default: [] },
    announcementBar: {
      text: { type: localizedSchema, default: () => ({ en: "", ar: "" }) },
      enabled: { type: Boolean, default: false },
      backgroundColor: { type: String, default: () => DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND }
    },
    promoBanner: {
      enabled: { type: Boolean, default: false },
      image: { type: String, default: "" },
      title: { type: localizedSchema, default: () => ({ en: "", ar: "" }) },
      subtitle: { type: localizedSchema, default: () => ({ en: "", ar: "" }) },
      ctaLabel: { type: localizedSchema, default: () => ({ en: "", ar: "" }) },
      ctaUrl: { type: String, default: "" }
    },
    featuredProductsEnabled: { type: Boolean, default: false },
    featuredProductsLimit: { type: Number, default: 8 },
    feedbackSectionEnabled: { type: Boolean, default: false },
    feedbackDisplayLimit: { type: Number, default: 6 },
    contentPages: {
      type: [{
        slug: String,
        title: localizedSchema,
        content: localizedSchema
      }],
      default: []
    },
    orderNotificationsEnabled: { type: Boolean, default: false },
    orderNotificationEmail: { type: String, default: "" },
    aiAssistant: {
      enabled: { type: Boolean, default: false },
      geminiApiKey: { type: String, default: "" },
      greeting: { type: localizedSchema, default: () => ({ en: "Hi! How can I help you today?", ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟" }) },
      systemPrompt: { type: String, default: "" },
      suggestedQuestions: {
        type: [localizedSchema],
        default: () => [
          { en: "What are your shipping options?", ar: "ما خيارات الشحن لديكم؟" },
          { en: "How can I return an item?", ar: "كيف أستطيع إرجاع منتج؟" },
          { en: "Show me new arrivals", ar: "أرني الوصول الجديد" }
        ]
      }
    }
  },
  { timestamps: true }
);

export const Settings = mongoose.model<SettingsDocument>("Settings", settingsSchema);
