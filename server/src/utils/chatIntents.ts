/**
 * Rule-based intent detection for chat (no AI, zero cost).
 * Detects intent from Egyptian Arabic, formal Arabic, and English.
 */

export type ChatIntent =
  | "greeting"
  | "thanks"
  | "shipping_policy"
  | "return_policy"
  | "payment_methods"
  | "delivery_fees"
  | "delivery_city"
  | "contact_info"
  | "about_us"
  | "privacy_policy"
  | "order_status"
  | "product_search"
  | "category_list"
  | "help"
  | "unknown";

export interface IntentMatch {
  intent: ChatIntent;
  confidence: number;
  extractedData?: {
    cityName?: string;
    productKeywords?: string[];
    categoryName?: string;
  };
}

/**
 * Normalize message: lowercase, remove diacritics, trim.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "") // Arabic diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Intent patterns (Egyptian Arabic, formal Arabic, English).
 * Order matters: more specific patterns first.
 */
const INTENT_PATTERNS: { intent: ChatIntent; keywords: string[]; weight?: number }[] = [
  // Greetings
  {
    intent: "greeting",
    keywords: [
      "hello", "hi", "hey", "good morning", "good evening",
      "مرحبا", "السلام عليكم", "صباح الخير", "مساء الخير",
      "ازيك", "ازيكم", "اهلا", "هاي", "هلو"
    ],
    weight: 0.9
  },

  // Thanks
  {
    intent: "thanks",
    keywords: [
      "thanks", "thank you", "thx", "appreciate",
      "شكرا", "شكرا جزيلا", "تسلم", "ربنا يخليك", "جزاك الله", "مشكور"
    ],
    weight: 0.9
  },

  // Shipping policy
  {
    intent: "shipping_policy",
    keywords: [
      "shipping", "delivery time", "ship", "deliver", "how long",
      "الشحن", "التوصيل", "وقت التوصيل", "مدة الشحن", "متى يوصل",
      "شحن", "هيوصل امتى", "بتوصلوا في كام يوم", "الطلب هيجي امتى"
    ],
    weight: 1.0
  },

  // Return policy
  {
    intent: "return_policy",
    keywords: [
      "return", "refund", "exchange", "cancel order",
      "الاسترجاع", "الاستبدال", "استرداد", "ارجاع", "الغاء",
      "لو عايز ارجع", "ممكن استبدل", "الغي الطلب"
    ],
    weight: 1.0
  },

  // Payment methods
  {
    intent: "payment_methods",
    keywords: [
      "payment", "pay", "cash", "cod", "instapay", "visa", "card",
      "الدفع", "طريقة الدفع", "كاش", "كارت", "فيزا", "انستاباي",
      "بدفع ازاي", "ادفع ازاي", "عندكم كاش", "فيه دفع عند الاستلام"
    ],
    weight: 1.0
  },

  // Delivery fees & city-specific
  {
    intent: "delivery_fees",
    keywords: [
      "delivery fee", "shipping cost", "delivery price", "how much delivery",
      "مصاريف الشحن", "سعر التوصيل", "تكلفة الشحن", "رسوم التوصيل",
      "التوصيل بكام", "الشحن بكام", "التوصيل كام"
    ],
    weight: 1.0
  },

  {
    intent: "delivery_city",
    keywords: [
      "deliver to", "ship to", "delivery area",
      "بتوصلوا ل", "بتشحنوا ل", "توصيل ل", "عندكم توصيل",
      "بتوصلوا فين", "توصيل لحد فين"
    ],
    weight: 0.95
  },

  // Contact
  {
    intent: "contact_info",
    keywords: [
      "contact", "phone", "email", "whatsapp", "reach you", "call",
      "التواصل", "رقم", "ايميل", "واتس", "اتصال", "كلمكم",
      "ازاي اتواصل", "رقمكم", "ممكن رقم", "فيه واتس"
    ],
    weight: 1.0
  },

  // About us
  {
    intent: "about_us",
    keywords: [
      "about", "who are you", "your story", "about store",
      "من نحن", "عن المتجر", "من انتم", "عنكم",
      "انتو مين", "ايه قصتكم"
    ],
    weight: 0.9
  },

  // Privacy
  {
    intent: "privacy_policy",
    keywords: [
      "privacy", "data", "personal info", "secure",
      "الخصوصية", "البيانات", "المعلومات الشخصية", "سرية",
      "بياناتي امنة", "بتحفظوا بياناتي"
    ],
    weight: 0.9
  },

  // Order status (can't answer - redirect)
  {
    intent: "order_status",
    keywords: [
      "order status", "track order", "where is my order", "order number",
      "حالة الطلب", "تتبع", "فين طلبي", "رقم الطلب",
      "الطلب بتاعي فين", "طلبي وصل فين", "عايز اعرف طلبي فين"
    ],
    weight: 1.0
  },

  // Product search
  {
    intent: "product_search",
    keywords: [
      "show me", "looking for", "want to buy", "product", "item", "available",
      "عندكم", "عايز", "عاوز", "ابحث عن", "اشوف", "موجود",
      "عايز اشوف", "فيه عندكم", "موجود عندكم", "ورني"
    ],
    weight: 0.8
  },

  // Categories
  {
    intent: "category_list",
    keywords: [
      "category", "categories", "what do you sell", "types",
      "الفئات", "الاقسام", "ايه عندكم", "بتبيعوا ايه",
      "عندكم ايه", "فيه ايه"
    ],
    weight: 0.85
  },

  // Help
  {
    intent: "help",
    keywords: [
      "help", "how", "can you", "assist",
      "مساعدة", "ساعدني", "ممكن", "عايز مساعدة",
      "محتاج مساعدة"
    ],
    weight: 0.7
  }
];

/**
 * Detect intent from user message.
 * Matches if message contains any keyword, or if any keyword contains the message (for one-word queries like "شحن").
 */
export function detectIntent(message: string): IntentMatch {
  const normalized = normalize(message);
  const words = normalized.split(/\s+/).filter((w) => w.length > 0);

  let bestMatch: IntentMatch = { intent: "unknown", confidence: 0 };

  for (const pattern of INTENT_PATTERNS) {
    let matched = false;

    for (const keyword of pattern.keywords) {
      const normalizedKeyword = normalize(keyword);
      // Message contains keyword, or keyword contains message (one-word like "شحن" matches "الشحن")
      if (normalized.includes(normalizedKeyword) || normalizedKeyword.includes(normalized)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      const confidence = pattern.weight ?? 1.0;
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          intent: pattern.intent,
          confidence,
          extractedData: extractData(pattern.intent, normalized, words)
        };
      }
    }
  }

  if (bestMatch.confidence < 0.05) {
    return { intent: "unknown", confidence: 0 };
  }

  return bestMatch;
}

/**
 * Extract data based on intent (e.g. city name, product keywords).
 */
function extractData(intent: ChatIntent, normalized: string, words: string[]): Record<string, unknown> | undefined {
  if (intent === "delivery_city") {
    const afterTo = normalized.match(/(?:to|ل)\s+([^\s]+)/);
    if (afterTo?.[1]) {
      return { cityName: afterTo[1] };
    }
  }

  if (intent === "product_search") {
    const stopWords = ["show", "me", "looking", "for", "want", "to", "buy", "عندكم", "عايز", "عاوز", "فيه", "موجود", "اشوف", "ورني"];
    const keywords = words.filter((w) => w.length > 1 && !stopWords.includes(w));
    if (keywords.length > 0) {
      return { productKeywords: keywords.slice(0, 5) };
    }
  }

  return undefined;
}
