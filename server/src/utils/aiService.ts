/**
 * Google Gemini API integration for the AI shopping assistant.
 * Uses generateContent REST API: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * Doc: https://ai.google.dev/gemini-api/docs
 */

import { logger } from "./logger.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
/** Gemini 2.5 Flash-Lite: free tier 15 RPM, 1,000 requests/day */
const MODEL = "gemini-2.5-flash-lite";

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
  /** Optional assistant display name (e.g. alnoon-admin). */
  assistantName?: string;
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
2. For ANY question that is answered by the data below (policies, shipping, returns, payment, products, product sizes/colors, categories, delivery cities, contact, about us, etc.), give the answer DIRECTLY from the data. Do NOT say "contact the store" or "I don't have that information" when the answer is in the context. The Product catalog includes Sizes and Colors when available—use them to answer questions like "what sizes are available" or "what colors does X come in".
3. Only when the customer asks about something that is NOT in the data below (e.g. a specific order number or order status, their personal account, or a question that has no answer in the context), say you cannot access that and suggest they contact the store. When you suggest contacting the store, you MUST end your message with the full contact details from "Store info" above: include Contact email (if present), Instagram, and Facebook. Example ending: "You can reach us at: Email: example@store.com | Instagram: https://instagram.com/... | Facebook: https://facebook.com/...". Use the exact values from Store info; omit only fields that are not provided there.
4. For product recommendations, mention ONLY products that appear in the Product catalog below. Do not invent products.
5. Use the exact policy and store details from the context (delivery fees per city, return window, payment methods, etc.).
6. CRITICAL — Product IDs for images: When you mention or recommend ANY product by name, you MUST add [id:PRODUCT_ID] immediately after that product name, using the exact 24-character ID from the Product catalog. Without [id:PRODUCT_ID], the chat will NOT show product images or links. This applies to: single product answers, lists of products (e.g. "available in burgundy"), size/color answers, and any product name you write. Example single: "We have this abaya [id:507f1f77bcf86cd799439011] at 450 EGP." Example list: <ul><li><strong>Velvet Chemise Abaya</strong> [id:abc123def456789012345678] - متوفرة بمقاسات M, L.</li><li><strong>Cotton Jersey Hijab</strong> [id:def456abc123789012345678] - مقاس واحد.</li></ul>. Never list product names without [id:PRODUCT_ID] for each one.
7. FORMAT — ALWAYS respond with HTML so the ecommerce frontend can render and style your reply. Use only these tags: <p>, <ul>, <li>, <strong>, <br>. For every message: wrap the answer in HTML. Short answers: use <p>...</p>. When listing multiple products (e.g. by color or size): intro in <p>...</p>, then <ul><li><strong>Product Name</strong> [id:PRODUCT_ID] - size/color text.</li>...</ul>. Every <li> that names a product MUST contain [id:PRODUCT_ID]. For "one size" use "مقاس واحد" (Arabic) or "One size" (English). For multiple sizes use "متوفرة بمقاسات S, M, L" (Arabic) or "Available in sizes S, M, L" (English). Do not use Markdown (no * or **)—output HTML only. The response is rendered as HTML in the storefront, so always return valid HTML.

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

## Product catalog (each line has: name, price EGP, ID, Link /product/ID, Sizes, Colors when available, and description; use the ID in [id:ID] when mentioning that product — the chat UI will display the product image and full link automatically. Use Sizes and Colors from the catalog to answer product-detail questions.)
${ctx.productCatalogSummary || "—"}

---`;
  if (ctx.customSystemPrompt.trim()) {
    return `${base}\n## Additional instructions from the store\n${ctx.customSystemPrompt.trim()}\n\nRemember: answer from the data above (including product sizes/colors). Only suggest contacting the store when the answer is not in the data—and when you do, always end with the full contact details: Email (if in Store info), Instagram, Facebook.`;
  }
  return base + "\nRemember: answer from the data above (including product sizes/colors). Only suggest contacting the store when the answer is not in the data—and when you do, always end with the full contact details: Email (if in Store info), Instagram, Facebook.";
}

/**
 * Call Gemini generateContent API. Returns assistant text or throws.
 * Maps system + user/assistant messages to Gemini contents + systemInstruction.
 */
export async function callGemini(
  apiKey: string,
  systemPrompt: string,
  messages: ChatTurn[]
): Promise<string> {
  const url = `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    const role = m.role === "user" ? "user" : "model";
    contents.push({ role, parts: [{ text: m.content }] });
  }

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error: ${msg}`);
  }

  const rawBody = await res.text();
  let data: {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string; code?: number };
  };
  try {
    data = rawBody ? (JSON.parse(rawBody) as typeof data) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data.error?.message || res.statusText || rawBody.slice(0, 200) || "Gemini API error";
    logger.warn({ status: res.status, body: data.error ?? rawBody.slice(0, 500) }, "Gemini API error response");
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 400 && String(msg).toLowerCase().includes("api key")) throw new Error("INVALID_API_KEY");
    if (res.status === 403) throw new Error("INVALID_API_KEY");
    throw new Error(`Gemini ${res.status}: ${msg}`);
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
