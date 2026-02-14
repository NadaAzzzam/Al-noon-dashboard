import { Settings } from "../models/Settings.js";
import { ChatSession } from "../models/ChatSession.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { City } from "../models/City.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { detectIntent } from "../utils/chatIntents.js";
import { buildResponse, type ChatResponseData } from "../utils/chatResponses.js";
import { callGemini, buildSystemPromptFromContext, type ChatTurn } from "../utils/aiService.js";
import { logger } from "../utils/logger.js";

/** Strip HTML tags for plain-text context. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Extract searchable words from message (length >= 2, no numbers only). */
function extractKeywords(message: string): string[] {
  const words = message.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase()).filter((w) => w.length >= 2);
  return [...new Set(words)].slice(0, 10);
}

/** Build content pages summary from settings. */
function buildContentSummary(pages: { slug: string; title?: { en?: string; ar?: string }; content?: { en?: string; ar?: string } }[]): string {
  if (!Array.isArray(pages) || pages.length === 0) return "";
  return pages
    .map((p) => {
      const title = p.title?.en || p.title?.ar || p.slug;
      const content = stripHtml((p.content?.en || p.content?.ar || "") as string);
      return `[${p.slug}] ${title}\n${content}`;
    })
    .join("\n\n");
}

/** Build store info summary (payment, InstaPay, social, quick links, newsletter, announcement, promo). */
function buildStoreInfoSummary(settings: Record<string, unknown> | null): string {
  if (!settings) return "";
  const parts: string[] = [];
  const payment = settings.paymentMethods as { cod?: boolean; instaPay?: boolean } | undefined;
  if (payment) {
    const methods: string[] = [];
    if (payment.cod) methods.push("Cash on Delivery (COD)");
    if (payment.instaPay) methods.push("InstaPay");
    if (methods.length) parts.push(`Payment methods: ${methods.join(", ")}.`);
  }
  const instaPay = (settings.instaPayNumber as string)?.trim();
  if (instaPay) parts.push(`InstaPay number: ${instaPay}.`);
  const contactEmail = (settings.orderNotificationEmail as string)?.trim();
  if (contactEmail) parts.push(`Contact email: ${contactEmail}.`);
  const social = settings.socialLinks as { facebook?: string; instagram?: string } | undefined;
  if (social) {
    if (social.facebook?.trim()) parts.push(`Facebook: ${social.facebook.trim()}.`);
    if (social.instagram?.trim()) parts.push(`Instagram: ${social.instagram.trim()}.`);
  }
  const quickLinks = settings.quickLinks as { label?: { en?: string; ar?: string }; url?: string }[] | undefined;
  if (Array.isArray(quickLinks) && quickLinks.length > 0) {
    parts.push("Quick links: " + quickLinks.map((q) => `${q.label?.en || q.label?.ar || "Link"}: ${q.url || ""}`).filter((s) => s.split(": ")[1]).join("; "));
  }
  if (settings.newsletterEnabled) parts.push("Newsletter signup is available on the storefront.");
  const announcement = settings.announcementBar as { enabled?: boolean; text?: { en?: string; ar?: string } } | undefined;
  if (announcement?.enabled && (announcement.text?.en || announcement.text?.ar)) {
    parts.push(`Announcement: ${(announcement.text?.en || announcement.text?.ar || "").trim()}`);
  }
  const promo = settings.promoBanner as { enabled?: boolean; title?: { en?: string; ar?: string }; subtitle?: { en?: string; ar?: string }; ctaLabel?: { en?: string; ar?: string }; ctaUrl?: string } | undefined;
  if (promo?.enabled) {
    const t = promo.title?.en || promo.title?.ar || "";
    const st = promo.subtitle?.en || promo.subtitle?.ar || "";
    if (t || st) parts.push(`Promo banner: ${[t, st].filter(Boolean).join(" — ")}.`);
    if (promo.ctaUrl?.trim()) parts.push(`Promo CTA: ${promo.ctaLabel?.en || promo.ctaLabel?.ar || "Learn more"} → ${promo.ctaUrl.trim()}`);
  }
  return parts.join(" ");
}

/** Build categories list (visible only). */
async function getCategoriesSummary(): Promise<string> {
  if (!isDbConnected()) return "";
  const categories = await Category.find({ status: "visible" }).select("name").lean();
  if (categories.length === 0) return "";
  return categories
    .map((c) => {
      const name = (c as { name?: { en?: string; ar?: string } }).name;
      const en = name?.en?.trim() || "";
      const ar = name?.ar?.trim() || "";
      return en || ar ? `- ${en}${en && ar ? " / " : ""}${ar}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

/** Build cities and delivery fees summary. */
async function getCitiesSummary(): Promise<string> {
  if (!isDbConnected()) return "";
  const cities = await City.find().select("name deliveryFee").sort({ "name.en": 1 }).lean();
  if (cities.length === 0) return "Delivery areas: Egypt (fees may vary; shown at checkout).";
  return cities
    .map((c) => {
      const name = (c as { name?: { en?: string; ar?: string } }).name;
      const n = name?.en || name?.ar || "City";
      const fee = (c as { deliveryFee?: number }).deliveryFee ?? 0;
      return `- ${n}: ${fee} EGP`;
    })
    .join("\n");
}

/** Product catalog line includes ID, image, sizes, colors so AI can answer product-detail questions. */
type ProductForCatalog = {
  _id?: unknown;
  name?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  price?: number;
  discountPrice?: number;
  images?: string[];
  sizes?: string[];
  colors?: string[];
};

/** Search products by keywords and return catalog summary with ID, image, sizes, colors for each product. */
async function getProductCatalogSummary(keywords: string[]): Promise<string> {
  if (!isDbConnected()) return "";
  const select = "name description price discountPrice images sizes colors";
  if (keywords.length === 0) {
    const products = await Product.find({ deletedAt: null, status: "ACTIVE" })
      .select(select)
      .limit(80)
      .lean();
    return formatProductSummary(products as ProductForCatalog[]);
  }
  const orConditions = keywords.flatMap((k) => [
    { "name.en": { $regex: k, $options: "i" } },
    { "name.ar": { $regex: k, $options: "i" } },
    { "description.en": { $regex: k, $options: "i" } },
    { "description.ar": { $regex: k, $options: "i" } }
  ]);
  const products = await Product.find({
    deletedAt: null,
    status: "ACTIVE",
    $or: orConditions
  })
    .select(select)
    .limit(40)
    .lean();
  if (products.length === 0) {
    const fallback = await Product.find({ deletedAt: null, status: "ACTIVE" })
      .select(select)
      .limit(30)
      .lean();
    return formatProductSummary(fallback as ProductForCatalog[]);
  }
  return formatProductSummary(products as ProductForCatalog[]);
}

function formatProductSummary(products: ProductForCatalog[]): string {
  return products
    .map((p) => {
      const id = p._id != null ? String(p._id) : "";
      const name = p.name?.en || p.name?.ar || "Product";
      const desc = stripHtml((p.description?.en || p.description?.ar || "") as string).slice(0, 120);
      const price = p.discountPrice ?? p.price ?? 0;
      const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
      const link = id ? `/product/${id}` : "";
      const sizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes.join(", ") : "";
      const colors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors.join(", ") : "";
      const extra = [sizes && `Sizes: ${sizes}`, colors && `Colors: ${colors}`].filter(Boolean).join(" | ");
      return `- ${name} | Price: ${price} EGP | ID: ${id} | Link: ${link}${img ? ` | Image: ${img}` : ""}${extra ? ` | ${extra}` : ""}${desc ? ` | ${desc}` : ""}`;
    })
    .join("\n");
}

/** Extract product IDs from AI response [id:24hexchars] and return unique list. */
function extractProductIdsFromResponse(text: string): string[] {
  const re = /\[id:([a-f0-9]{24})\]/gi;
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const id = m[1];
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Remove [id:xxx] tags from response so the user sees clean text. */
function stripProductIdTags(text: string): string {
  return text.replace(/\s*\[id:[a-f0-9]{24}\]/gi, "").replace(/\s{2,}/g, " ").trim();
}

/** Fetch products by IDs and return cards with id, name, image, productUrl for chat display (order preserved by ids). */
async function getProductCardsForIds(ids: string[]): Promise<{ id: string; name: { en: string; ar: string }; image: string; productUrl: string }[]> {
  if (!isDbConnected() || ids.length === 0) return [];
  const products = await Product.find({
    _id: { $in: ids },
    deletedAt: null,
    status: "ACTIVE"
  })
    .select("_id name images")
    .lean();
  const order = new Map(ids.map((id, i) => [id, i]));
  const cards = products.map((p) => {
    const id = String((p as { _id: unknown })._id);
    const name = (p as { name?: { en?: string; ar?: string } }).name ?? { en: "", ar: "" };
    const img = Array.isArray((p as { images?: string[] }).images) && (p as { images: string[] }).images[0]
      ? (p as { images: string[] }).images[0]
      : "";
    return {
      id,
      name: { en: name.en ?? "", ar: name.ar ?? "" },
      image: img,
      productUrl: `/product/${id}`,
      order: order.get(id) ?? 999
    };
  });
  cards.sort((a, b) => a.order - b.order);
  return cards.map(({ id, name, image, productUrl }) => ({ id, name, image, productUrl }));
}

/** Public: get AI widget config (enabled, greeting, suggested questions). No API key returned. */
export const getAiSettings = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: {
        enabled: false,
        greeting: { en: "Hi! How can I help you today?", ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟" },
        suggestedQuestions: []
      }
    });
  }
  const settings = await Settings.findOne().select("aiAssistant").lean();
  const ai = (settings as { aiAssistant?: { enabled?: boolean; greeting?: { en?: string; ar?: string }; suggestedQuestions?: { en?: string; ar?: string }[] } } | null)?.aiAssistant;
  sendResponse(res, req.locale, {
    data: {
      enabled: Boolean(ai?.enabled),
      greeting: ai?.greeting ?? { en: "Hi! How can I help you today?", ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟" },
      suggestedQuestions: Array.isArray(ai?.suggestedQuestions) ? ai.suggestedQuestions : []
    }
  });
});

/** Public: send a chat message and get response. Uses Gemini AI when API key is set, otherwise rule-based. */
export const postChat = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    throw new ApiError(503, "Service unavailable", { code: "errors.common.db_unavailable" });
  }
  const { sessionId: clientSessionId, message, locale: bodyLocale } = req.body as {
    sessionId?: string;
    message: string;
    locale?: "en" | "ar";
  };
  const responseLocale = bodyLocale ?? req.locale;

  const settings = await Settings.findOne().lean();
  const ai = (settings as { aiAssistant?: { enabled?: boolean } } | null)?.aiAssistant;
  if (!ai?.enabled) {
    throw new ApiError(400, "Chat assistant is disabled", { code: "errors.ai.disabled" });
  }

  const storeName = (settings as { storeName?: { en?: string; ar?: string } })?.storeName ?? { en: "Store", ar: "المتجر" };
  const contentPages = (settings as { contentPages?: { slug: string; title?: { en?: string; ar?: string }; content?: { en?: string; ar?: string } }[] })?.contentPages ?? [];
  const paymentMethods = (settings as { paymentMethods?: { cod?: boolean; instaPay?: boolean } })?.paymentMethods ?? { cod: true, instaPay: false };
  const instaPayNumber = ((settings as { instaPayNumber?: string })?.instaPayNumber ?? "").trim();
  const socialLinks = (settings as { socialLinks?: { facebook?: string; instagram?: string } })?.socialLinks ?? {};

  const [cities, categories] = await Promise.all([
    City.find().select("name deliveryFee").sort({ "name.en": 1 }).lean(),
    Category.find({ status: "visible" }).select("name").lean()
  ]);

  let session = clientSessionId
    ? await ChatSession.findOne({ sessionId: clientSessionId }).lean()
    : null;
  if (!session) {
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const created = await ChatSession.create({
      sessionId: newSessionId,
      messages: [],
      status: "active"
    });
    session = created.toObject();
  }

  const apiKey = (
    String((ai as { geminiApiKey?: string }).geminiApiKey ?? "").trim() ||
    String(process.env.GEMINI_API_KEY ?? "").trim()
  ).trim();
  if (apiKey) {
    const keywords = extractKeywords(message);
    const [contentSummary, storeInfoSummary, categoriesSummary, citiesSummary, productCatalogSummary] = await Promise.all([
      Promise.resolve(buildContentSummary(contentPages)),
      Promise.resolve(buildStoreInfoSummary(settings as Record<string, unknown>)),
      getCategoriesSummary(),
      getCitiesSummary(),
      getProductCatalogSummary(keywords)
    ]);
    const storeNameEn = storeName?.en ?? "Store";
    const storeNameAr = storeName?.ar ?? "المتجر";
    const aiCfg = ai as { systemPrompt?: string; assistantName?: string };
    const ctx = {
      storeNameEn,
      storeNameAr,
      storeInfoSummary,
      contentPagesSummary: contentSummary,
      categoriesSummary,
      citiesSummary,
      productCatalogSummary,
      customSystemPrompt: aiCfg.systemPrompt ?? "",
      responseLocale,
      assistantName: aiCfg.assistantName ?? "alnoon-admin"
    };
    const systemPrompt = buildSystemPromptFromContext(ctx);
    const existingMessages = (session as { messages?: { role: string; content: string }[] }).messages ?? [];
    const maxTurns = 10;
    const recent = existingMessages.slice(-maxTurns);
    const messages: ChatTurn[] = recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    messages.push({ role: "user", content: message });
    let assistantText: string;
    try {
      assistantText = await callGemini(apiKey, systemPrompt, messages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ err, message: msg }, "Gemini API error in chat");
      if (msg === "INVALID_API_KEY") throw new ApiError(401, "Invalid API key", { code: "errors.ai.invalid_api_key" });
      if (msg === "RATE_LIMIT") throw new ApiError(429, "Too many requests", { code: "errors.ai.rate_limit" });
      throw new ApiError(502, "AI service temporarily unavailable", { code: "errors.ai.unavailable" });
    }
    const productIds = extractProductIdsFromResponse(assistantText);
    const productCards = await getProductCardsForIds(productIds);
    const displayText = stripProductIdTags(assistantText);
    const sessionId = (session as { sessionId: string }).sessionId;
    await ChatSession.updateOne(
      { sessionId },
      {
        $push: {
          messages: [
            { role: "user", content: message, timestamp: new Date() },
            {
              role: "assistant",
              content: displayText,
              timestamp: new Date(),
              ...(productCards.length > 0 && { productCards })
            }
          ]
        },
        $set: { updatedAt: new Date() }
      }
    );
    return sendResponse(res, req.locale, {
      data: { sessionId, response: displayText, productCards, responseFormat: "html" }
    });
  }

  const responseData: ChatResponseData = {
    storeName: { en: storeName.en ?? "Store", ar: storeName.ar ?? "المتجر" },
    contentPages: contentPages.map((p) => ({
      slug: p.slug,
      title: { en: p.title?.en, ar: p.title?.ar },
      content: { en: p.content?.en, ar: p.content?.ar }
    })),
    paymentMethods: { cod: Boolean(paymentMethods.cod), instaPay: Boolean(paymentMethods.instaPay) },
    instaPayNumber,
    socialLinks: { facebook: socialLinks.facebook, instagram: socialLinks.instagram },
    cities: cities.map((c) => ({
      name: { en: (c as { name?: { en?: string } }).name?.en, ar: (c as { name?: { ar?: string } }).name?.ar },
      deliveryFee: (c as { deliveryFee?: number }).deliveryFee ?? 0
    })),
    categories: categories.map((c) => ({
      name: { en: (c as { name?: { en?: string } }).name?.en, ar: (c as { name?: { ar?: string } }).name?.ar }
    }))
  };

  const intentMatch = detectIntent(message);

  const assistantText = buildResponse(intentMatch.intent, responseData, responseLocale, intentMatch.extractedData);

  let productCards: { id: string; name: { en: string; ar: string }; image: string; productUrl: string }[] = [];
  if (intentMatch.intent === "product_search" && intentMatch.extractedData?.productKeywords) {
    const keywords = intentMatch.extractedData.productKeywords as string[];
    const products = await Product.find({
      deletedAt: null,
      status: "ACTIVE",
      $or: keywords.flatMap((k) => [
        { "name.en": { $regex: k, $options: "i" } },
        { "name.ar": { $regex: k, $options: "i" } },
        { "description.en": { $regex: k, $options: "i" } },
        { "description.ar": { $regex: k, $options: "i" } }
      ])
    })
      .select("_id name images")
      .limit(6)
      .lean();

    productCards = products.map((p) => {
      const id = String((p as { _id: unknown })._id);
      const name = (p as { name?: { en?: string; ar?: string } }).name ?? { en: "", ar: "" };
      const img = Array.isArray((p as { images?: string[] }).images) && (p as { images: string[] }).images[0]
        ? (p as { images: string[] }).images[0]
        : "";
      return {
        id,
        name: { en: name.en ?? "", ar: name.ar ?? "" },
        image: img,
        productUrl: `/product/${id}`
      };
    });
  }

  const sessionId = (session as { sessionId: string }).sessionId;
  await ChatSession.updateOne(
    { sessionId },
    {
      $push: {
        messages: [
          { role: "user", content: message, timestamp: new Date() },
          {
            role: "assistant",
            content: assistantText,
            timestamp: new Date(),
            ...(productCards.length > 0 && { productCards })
          }
        ]
      },
      $set: { updatedAt: new Date() }
    }
  );

  sendResponse(res, req.locale, {
    data: {
      sessionId,
      response: assistantText,
      productCards,
      responseFormat: "html"
    }
  });
});

/** Admin: list chat sessions with pagination. */
export const listSessions = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    ChatSession.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).select("sessionId messages customerName customerEmail status createdAt updatedAt").lean(),
    ChatSession.countDocuments()
  ]);
  const list = sessions.map((s) => ({
    id: (s as { _id: unknown })._id,
    sessionId: (s as { sessionId: string }).sessionId,
    messageCount: ((s as { messages?: unknown[] }).messages ?? []).length,
    customerName: (s as { customerName?: string }).customerName,
    customerEmail: (s as { customerEmail?: string }).customerEmail,
    status: (s as { status: string }).status,
    createdAt: (s as { createdAt: Date }).createdAt,
    updatedAt: (s as { updatedAt: Date }).updatedAt
  }));
  sendResponse(res, req.locale, {
    data: { sessions: list, total, page, limit }
  });
});

/** Admin: get one session by MongoDB _id with all messages. */
export const getSessionById = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const session = await ChatSession.findById(req.params.id).lean();
  if (!session) throw new ApiError(404, "Chat session not found", { code: "errors.ai.session_not_found" });
  sendResponse(res, req.locale, {
    data: {
      id: (session as { _id: unknown })._id,
      sessionId: (session as { sessionId: string }).sessionId,
      messages: (session as { messages: unknown[] }).messages ?? [],
      customerName: (session as { customerName?: string }).customerName,
      customerEmail: (session as { customerEmail?: string }).customerEmail,
      status: (session as { status: string }).status,
      createdAt: (session as { createdAt: Date }).createdAt,
      updatedAt: (session as { updatedAt: Date }).updatedAt
    }
  });
});

/** Admin: delete a chat session. */
export const deleteSession = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const deleted = await ChatSession.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Chat session not found", { code: "errors.ai.session_not_found" });
  sendResponse(res, req.locale, { message: "success.ai.session_deleted" });
});
