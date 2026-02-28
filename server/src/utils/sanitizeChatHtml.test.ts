import { describe, it, expect } from "vitest";
import { sanitizeChatHtml } from "./sanitizeChatHtml.js";

/** Helper to assert string return type (sanitize-html types may infer unknown). */
function sanitized(html: string): string {
  return sanitizeChatHtml(html) as string;
}

describe("sanitizeChatHtml", () => {
  it("allows safe formatting tags: p, ul, li, strong, br", () => {
    const input = "<p>Hello</p><ul><li><strong>Item</strong></li></ul><br>";
    const out = sanitized(input);
    expect(out.includes("<p>Hello</p>")).toBe(true);
    expect(out.includes("<ul>")).toBe(true);
    expect(out.includes("<li><strong>Item</strong></li>")).toBe(true);
    expect(/<br\s*\/?>/.test(out)).toBe(true);
  });

  it("strips script tags and prevents XSS", () => {
    const input = '<p>Hi</p><script>alert("xss")</script><p>Bye</p>';
    const out = sanitized(input);
    expect(out.includes("<script>")).toBe(false);
    expect(out.includes("alert")).toBe(false);
  });

  it("strips event handlers", () => {
    const input = '<p onclick="alert(1)">Click</p>';
    const out = sanitized(input);
    expect(out.includes("onclick")).toBe(false);
  });

  it("strips img with onerror", () => {
    const input = '<img src=x onerror="alert(1)">';
    expect(sanitizeChatHtml(input)).toBe("");
  });

  it("strips javascript: URLs", () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const out = sanitized(input);
    expect(out.includes("javascript:")).toBe(false);
    expect(out.includes("alert")).toBe(false);
  });

  it("preserves allowed tags with nested content", () => {
    const input = "<p>We have <strong>great</strong> products.</p><ul><li>Item 1</li><li>Item 2</li></ul>";
    expect(sanitizeChatHtml(input)).toContain("<p>");
    expect(sanitizeChatHtml(input)).toContain("<strong>");
    expect(sanitizeChatHtml(input)).toContain("<ul>");
    expect(sanitizeChatHtml(input)).toContain("<li>");
  });

  it("handles empty or whitespace-only input", () => {
    expect(sanitizeChatHtml("")).toBe("");
    expect(sanitizeChatHtml("   ")).toBe("   ");
  });

  it("escapes HTML entities in text content", () => {
    const input = "<p>5 &lt; 10 &amp; 10 &gt; 5</p>";
    expect(sanitizeChatHtml(input)).toContain("&lt;");
    expect(sanitizeChatHtml(input)).toContain("&amp;");
  });
});
