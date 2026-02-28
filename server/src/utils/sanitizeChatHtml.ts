import sanitizeHtml from "sanitize-html";

/**
 * Allowed HTML tags for AI chat responses. Only safe formatting tags.
 * Prevents XSS from prompt injection or model output (e.g. <script>, onclick, javascript:).
 */
const ALLOWED_TAGS = ["p", "ul", "li", "strong", "br"];

/**
 * Sanitize HTML from AI or rule-based chat response before sending to the client.
 * Allows only safe formatting tags; strips script, event handlers, and unsafe attributes.
 * Use when rendering chat messages on the storefront to prevent XSS attacks.
 */
export function sanitizeChatHtml(html: string): string {
  if (typeof html !== "string" || !html.trim()) return html;
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    allowedSchemes: [],
    textFilter: (text: string) => text,
  }) as string;
}
