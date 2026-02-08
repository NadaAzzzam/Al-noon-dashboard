/**
 * Google Gemini API integration for the AI shopping assistant.
 * Uses REST API (no SDK). Free tier: 15 RPM, 1M tokens/day.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-1.5-flash";

export type ResponseLocale = "en" | "ar";

export interface AiContext {
  storeNameEn: string;
  storeNameAr: string;
  /** Full store info: payment methods, InstaPay, social links, quick links, newsletter, announcement, promo. */
  storeInfoSummary: string;
  /** Content pages: privacy, return policy, shipping, about, contact (plain text). */
  contentPagesSummary: string;
  /** Categories list (EN/AR) so the AI knows product types. */
  categoriesSummary: string;
  /** Cities and delivery fees. */
  citiesSummary: string;
  /** Product catalog (names, descriptions, prices). */
  productCatalogSummary: string;
  customSystemPrompt: string;
  /** Preferred response language (from user's UI or request). Enables localized AI replies. */
  responseLocale?: ResponseLocale;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Build system prompt so the AI has full store knowledge and only defers when info is not in DB.
 */
function buildSystemPrompt(ctx: AiContext): string {
  const langRule =
    ctx.responseLocale === "ar"
      ? `LANGUAGE: The customer's interface is in Arabic. Always respond in Arabic. If they write in Egyptian Arabic (عامية مصرية), understand and respond in clear Arabic (Egyptian dialect is fine). Treat their question as written—do not ask them to rephrase.`
      : ctx.responseLocale === "en"
        ? `LANGUAGE: The customer's interface is in English. Respond in English.`
        : `LANGUAGE: Answer in the same language the customer uses (English or Arabic). If they write in Egyptian Arabic (عامية), understand and respond in Arabic.`;

  const base = `You are the official AI shopping assistant for this e-commerce store. You have COMPLETE knowledge of the store from the data below. Your job is to answer customer questions using ONLY this data.

${langRule}

RULES:
1. Be helpful and concise. Understand the customer's question even in informal or dialect Arabic (e.g. Egyptian).
2. For ANY question that is answered by the data below (policies, shipping, returns, payment, products, categories, delivery cities, contact, about us, etc.), give the answer DIRECTLY from the data. Do NOT say "contact the store" or "I don't have that information" when the answer is in the context.
3. Only when the customer asks about something that is NOT in the data below (e.g. a specific order number or order status, their personal account, or a question that has no answer in the context), then say you cannot access that and suggest they contact the store or check their email.
4. For product recommendations, mention ONLY products that appear in the Product catalog below. Do not invent products.
5. Use the exact policy and store details from the context (delivery fees per city, return window, payment methods, etc.).
6. When you mention or recommend a specific product, add [id:PRODUCT_ID] immediately after the product name. The chat will then show the product image and full product link for the customer. Use the exact product ID from the catalog (the ID shown in each product line). Example: "We have this abaya [id:507f1f77bcf86cd799439011] at 450 EGP — see the image and link below." You can add multiple [id:xxx] when recommending several products. Always include [id:PRODUCT_ID] for every product you recommend or mention by name, especially when the customer asks to see a product or its image.

---

## Store name
English: ${ctx.storeNameEn}
Arabic: ${ctx.storeNameAr}

## Store info (payment, contact, links, features)
${ctx.storeInfoSummary || "—"}

## Policies and pages (shipping, returns, privacy, about, contact)
${ctx.contentPagesSummary || "—"}

## Product categories (what we sell)
${ctx.categoriesSummary || "—"}

## Delivery cities and fees
${ctx.citiesSummary || "—"}

## Product catalog (each line has: name, price EGP, ID, Link /product/ID, Image path; use the ID in [id:ID] when mentioning that product — the chat UI will display the product image and full link automatically)
${ctx.productCatalogSummary || "—"}

---`;
  if (ctx.customSystemPrompt.trim()) {
    return `${base}\n## Additional instructions from the store\n${ctx.customSystemPrompt.trim()}\n\nRemember: answer from the data above; only suggest contacting the store when the answer is not in the data.`;
  }
  return base + "\nRemember: answer from the data above; only suggest contacting the store when the answer is not in the data.";
}

/**
 * Call Gemini generateContent API. Returns assistant text or throws.
 */
export async function callGemini(
  apiKey: string,
  systemPrompt: string,
  messages: ChatTurn[]
): Promise<string> {
  const url = `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  // Gemini expects contents: array of { role, parts: [{ text }] }. "user" and "model" roles.
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    const role = m.role === "user" ? "user" : "model";
    contents.push({ role, parts: [{ text: m.content }] });
  }
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.95
    }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string; code?: number };
  };
  if (!res.ok) {
    const msg = data.error?.message || res.statusText || "Gemini API error";
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 400 && msg.toLowerCase().includes("api key")) throw new Error("INVALID_API_KEY");
    throw new Error(msg);
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("No response from AI");
  return text;
}

/**
 * Build context for the AI from settings and product catalog.
 */
export function buildSystemPromptFromContext(ctx: AiContext): string {
  return buildSystemPrompt(ctx);
}

export { buildSystemPrompt };
