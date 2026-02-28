import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Settings } from "../models/Settings.js";
import { Category } from "../models/Category.js";

describe("AI Chat API (integration)", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    app = createApp();
    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          aiAssistant: {
            enabled: true,
            greeting: { en: "Hi!", ar: "مرحبا!" },
            suggestedQuestions: []
          }
        }
      },
      { upsert: true, new: true }
    );
    await Category.findOneAndUpdate(
      {},
      { name: { en: "Test", ar: "تجربة" }, status: "visible" },
      { upsert: true, new: true }
    );
  });

  describe("GET /api/ai/settings", () => {
    it("returns enabled and greeting when AI is on", async () => {
      const res = await request(app).get("/api/ai/settings");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.greeting).toBeDefined();
      expect(res.body.data.greeting.en).toBeDefined();
      expect(res.body.data.greeting.ar).toBeDefined();
    });
  });

  describe("POST /api/ai/chat", () => {
    it("returns sessionId and response for valid message (rule-based when no API key)", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "Hello" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.response).toBeDefined();
      expect(typeof res.body.data.response).toBe("string");
      expect(res.body.data.responseFormat).toBe("html");
      expect(res.body.data.productCards).toBeDefined();
      expect(Array.isArray(res.body.data.productCards)).toBe(true);
    });

    it("rejects empty message (validation)", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "" });
      expect(res.status).toBe(400);
    });

    it("rejects message longer than 4000 chars", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "x".repeat(4001) });
      expect(res.status).toBe(400);
    });

    it("sanitizes response and never returns raw script tags (XSS prevention)", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "مرحبا" });
      expect(res.status).toBe(200);
      const response = (res.body.data?.response ?? "") as string;
      expect(/<script/i.test(response)).toBe(false);
      expect(/onerror\s*=/i.test(response)).toBe(false);
      expect(/onclick\s*=/i.test(response)).toBe(false);
      expect(/javascript:/i.test(response)).toBe(false);
    });

    it("returns 400 when AI assistant is disabled", async () => {
      await Settings.findOneAndUpdate({}, { $set: { "aiAssistant.enabled": false } });
      const res = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "Hello" });
      expect(res.status).toBe(400);
      const msg = ((res.body.message as string) ?? "").toLowerCase();
      expect(/disabled|chat/i.test(msg)).toBe(true);
      await Settings.findOneAndUpdate({}, { $set: { "aiAssistant.enabled": true } });
    });

    it("accepts locale en and ar", async () => {
      const resEn = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "Hi", locale: "en" });
      const resAr = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "مرحبا", locale: "ar" });
      expect(resEn.status).toBe(200);
      expect(resAr.status).toBe(200);
    });

    it("reuses session when sessionId is provided", async () => {
      const first = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "Hi" });
      const sessionId = first.body.data?.sessionId;
      expect(sessionId).toBeDefined();

      const second = await request(app)
        .post("/api/ai/chat")
        .set("Content-Type", "application/json")
        .send({ message: "Thanks", sessionId });
      expect(second.status).toBe(200);
      expect(second.body.data.sessionId).toBe(sessionId);
    });
  });
});
