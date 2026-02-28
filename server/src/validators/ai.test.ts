import { describe, it, expect } from "vitest";
import { chatRequestSchema } from "./ai.js";

describe("chatRequestSchema", () => {
  it("accepts valid message and optional sessionId and locale", () => {
    const result = chatRequestSchema.safeParse({
      body: { message: "Hello", sessionId: "sess_123", locale: "en" }
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = chatRequestSchema.safeParse({ body: { message: "" } });
    expect(result.success).toBe(false);
  });

  it("rejects message longer than 4000 chars (prevents oversized payload)", () => {
    const longMessage = "x".repeat(4001);
    const result = chatRequestSchema.safeParse({ body: { message: longMessage } });
    expect(result.success).toBe(false);
  });

  it("accepts message at exactly 4000 chars", () => {
    const maxMessage = "x".repeat(4000);
    const result = chatRequestSchema.safeParse({ body: { message: maxMessage } });
    expect(result.success).toBe(true);
  });

  it("rejects invalid locale", () => {
    const result = chatRequestSchema.safeParse({ body: { message: "Hi", locale: "fr" } });
    expect(result.success).toBe(false);
  });

  it("accepts valid locale en and ar", () => {
    expect(chatRequestSchema.safeParse({ body: { message: "Hi", locale: "en" } }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ body: { message: "مرحبا", locale: "ar" } }).success).toBe(true);
  });

  it("rejects body without message", () => {
    const result = chatRequestSchema.safeParse({ body: { sessionId: "sess_1" } });
    expect(result.success).toBe(false);
  });

  it("rejects non-string message", () => {
    const result = chatRequestSchema.safeParse({ body: { message: 123 } });
    expect(result.success).toBe(false);
  });
});
