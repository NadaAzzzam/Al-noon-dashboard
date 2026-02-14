import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    storeNameEn: z.string().optional(),
    storeNameAr: z.string().optional(),
    logo: z.string().optional(),
    instaPayNumber: z.string().optional(),
    paymentMethods: z
      .object({
        cod: z.boolean().optional(),
        instaPay: z.boolean().optional()
      })
      .optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    stockInfoThreshold: z.number().int().min(0).optional(),
    googleAnalyticsId: z.string().optional(),
    quickLinks: z.array(z.object({
      labelEn: z.string(),
      labelAr: z.string(),
      url: z.string()
    })).optional(),
    socialLinks: z.object({
      facebook: z.string().optional(),
      instagram: z.string().optional()
    }).optional(),
    newsletterEnabled: z.boolean().optional(),
    homeCollections: z.array(z.object({
      titleEn: z.string(),
      titleAr: z.string(),
      image: z.string(),
      hoverImage: z.string().optional(),
      video: z.string().optional(),
      url: z.string(),
      order: z.number().int().min(0),
      categoryId: z.string().optional()
    })).optional(),
    hero: z.object({
      images: z.array(z.string()).optional(),
      videos: z.array(z.string()).optional(),
      titleEn: z.string().optional(),
      titleAr: z.string().optional(),
      subtitleEn: z.string().optional(),
      subtitleAr: z.string().optional(),
      ctaLabelEn: z.string().optional(),
      ctaLabelAr: z.string().optional(),
      ctaUrl: z.string().optional()
    }).optional(),
    heroEnabled: z.boolean().optional(),
    newArrivalsLimit: z.number().int().min(1).max(24).optional(),
    newArrivalsSectionImages: z.array(z.string()).optional(),
    newArrivalsSectionVideos: z.array(z.string()).optional(),
    homeCollectionsDisplayLimit: z.number().int().min(0).optional(),
    ourCollectionSectionImages: z.array(z.string()).optional(),
    ourCollectionSectionVideos: z.array(z.string()).optional(),
    featuredProductsEnabled: z.boolean().optional(),
    featuredProductsLimit: z.number().int().min(1).max(24).optional(),
    feedbackSectionEnabled: z.boolean().optional(),
    feedbackDisplayLimit: z.number().int().min(0).max(50).optional(),
    contentPages: z.array(z.object({
      slug: z.string(),
      titleEn: z.string(),
      titleAr: z.string(),
      contentEn: z.string(),
      contentAr: z.string()
    })).optional(),
    orderNotificationsEnabled: z.boolean().optional(),
    orderNotificationEmail: z.string().optional(),
    aiAssistant: z.object({
      enabled: z.boolean().optional(),
      geminiApiKey: z.string().optional(),
      assistantName: z.string().optional(),
      greetingEn: z.string().optional(),
      greetingAr: z.string().optional(),
      systemPrompt: z.string().optional(),
      suggestedQuestions: z.array(z.object({ en: z.string(), ar: z.string() })).optional()
    }).optional()
  })
});
