import { z } from "zod";

/** Settings use partial updates; all fields optional. When provided, validate format. */
const quickLinkSchema = z.object({
  labelEn: z.string().trim().min(1),
  labelAr: z.string().trim().min(1),
  url: z.string().trim().min(1).max(2000)
});

const homeCollectionSchema = z.object({
  titleEn: z.string().trim().min(1),
  titleAr: z.string().trim().min(1),
  image: z.string().trim().min(1),
  hoverImage: z.string().trim().max(2000).optional(),
  video: z.string().trim().max(2000).optional(),
  url: z.string().trim().min(1).max(2000),
  order: z.number().int().min(0),
  categoryId: z.string().trim().optional()
});

export const updateSettingsSchema = z.object({
  body: z.object({
    storeNameEn: z.string().trim().max(200).optional(),
    storeNameAr: z.string().trim().max(200).optional(),
    logo: z.string().trim().max(2000).optional(),
    instaPayNumber: z.string().trim().max(50).optional(),
    paymentMethods: z
      .object({
        cod: z.boolean().optional(),
        instaPay: z.boolean().optional()
      })
      .optional(),
    lowStockThreshold: z.number().int().min(0).max(100000).optional(),
    stockInfoThreshold: z.number().int().min(0).max(100000).optional(),
    googleAnalyticsId: z.string().trim().max(50).optional(),
    quickLinks: z.array(quickLinkSchema).max(20).optional(),
    socialLinks: z.object({
      facebook: z.string().trim().max(500).optional(),
      instagram: z.string().trim().max(500).optional()
    }).optional(),
    newsletterEnabled: z.boolean().optional(),
    discountCodeSupported: z.boolean().optional(),
    homeCollections: z.array(homeCollectionSchema).max(20).optional(),
    hero: z.object({
      images: z.array(z.string().max(2000)).max(10).optional(),
      videos: z.array(z.string().max(2000)).max(5).optional(),
      titleEn: z.string().trim().max(200).optional(),
      titleAr: z.string().trim().max(200).optional(),
      subtitleEn: z.string().trim().max(300).optional(),
      subtitleAr: z.string().trim().max(300).optional(),
      ctaLabelEn: z.string().trim().max(50).optional(),
      ctaLabelAr: z.string().trim().max(50).optional(),
      ctaUrl: z.string().trim().max(2000).optional()
    }).optional(),
    heroEnabled: z.boolean().optional(),
    featuredProductsEnabled: z.boolean().optional(),
    featuredProductsLimit: z.number().int().min(1).max(24).optional(),
    feedbackSectionEnabled: z.boolean().optional(),
    feedbackDisplayLimit: z.number().int().min(0).max(50).optional(),
    contentPages: z.array(z.object({
      slug: z.string().trim().min(1).max(100),
      titleEn: z.string().trim().min(1).max(200),
      titleAr: z.string().trim().min(1).max(200),
      contentEn: z.string().max(100000),
      contentAr: z.string().max(100000)
    })).max(50).optional(),
    orderNotificationsEnabled: z.boolean().optional(),
    orderNotificationEmail: z.string().trim().email().max(254).optional(),
    aiAssistant: z.object({
      enabled: z.boolean().optional(),
      geminiApiKey: z.string().trim().max(200).optional(),
      assistantName: z.string().trim().max(100).optional(),
      greetingEn: z.string().trim().max(500).optional(),
      greetingAr: z.string().trim().max(500).optional(),
      systemPrompt: z.string().max(10000).optional(),
      suggestedQuestions: z.array(z.object({ en: z.string().trim().max(200), ar: z.string().trim().max(200) })).max(10).optional()
    }).optional(),
    currency: z.string().trim().max(10).optional(),
    currencySymbol: z.string().trim().max(10).optional()
  })
});
