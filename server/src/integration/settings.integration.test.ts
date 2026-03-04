import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Settings } from "../models/Settings.js";

describe("Settings API (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    const loginRes = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "admin@localhost", password: "admin123" });
    authToken = loginRes.body?.data?.token ?? loginRes.body?.token ?? "";
  });

  describe("PUT /api/settings homeCollections", () => {
    it("saves and returns homeCollections with video and hoverVideo fields", async () => {
      const collectionsWithVideo = [
        { titleEn: "Abayas", titleAr: "عباءات", image: "/a.jpg", video: "/uploads/abaya.mp4", hoverVideo: "/uploads/abaya-hover.mp4", url: "/collection/abayas", order: 0 },
        { titleEn: "Capes", titleAr: "كابات", image: "/b.jpg", url: "/collection/capes", order: 1 },
      ];

      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ homeCollections: collectionsWithVideo });

      expect(res.status).toBe(200);
      const saved = res.body.data?.settings?.homeCollections ?? [];
      expect(saved.length).toBe(2);

      const withVideo = saved.find((c: { url?: string }) => c.url === "/collection/abayas");
      expect(withVideo).toBeDefined();
      expect(withVideo).toHaveProperty("video", "/uploads/abaya.mp4");
      expect(withVideo).toHaveProperty("hoverVideo", "/uploads/abaya-hover.mp4");
      expect(withVideo).toHaveProperty("image", "/a.jpg");

      const withoutVideo = saved.find((c: { url?: string }) => c.url === "/collection/capes");
      expect(withoutVideo).toBeDefined();
      expect(withoutVideo?.video).toBeUndefined();
      expect(withoutVideo?.hoverVideo).toBeUndefined();
    });

    it("deduplicates homeCollections by url on update", async () => {
      const duplicateCollections = [
        { titleEn: "Abayas", titleAr: "عباءات", image: "/a.jpg", url: "/collection/abayas", order: 0 },
        { titleEn: "Capes", titleAr: "كابات", image: "/b.jpg", url: "/collection/abayas", order: 1 }, // duplicate url
        { titleEn: "Hijab", titleAr: "حجاب", image: "/c.jpg", url: "/collection/hijab", order: 2 },
      ];

      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ homeCollections: duplicateCollections });

      expect(res.status).toBe(200);
      const saved = res.body.data?.settings?.homeCollections ?? [];
      const urls = saved.map((c: { url?: string }) => c.url);
      const uniqueUrls = [...new Set(urls)];
      expect(urls.length).toBe(uniqueUrls.length);
      expect(saved.filter((c: { url?: string }) => c.url === "/collection/abayas").length).toBe(1);

      const dbSettings = await Settings.findOne().lean();
      expect(dbSettings?.homeCollections).toBeDefined();
      const dbUrls = (dbSettings?.homeCollections ?? []).map((c: { url?: string }) => c.url);
      expect(dbUrls.length).toBe([...new Set(dbUrls)].length);
    });
  });

  describe("PUT /api/settings comingSoon and underConstruction", () => {
    it("saves and returns comingSoonMode and comingSoonMessage", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comingSoonMode: true,
          comingSoonMessageEn: "We'll be back soon!",
          comingSoonMessageAr: "سنعود قريباً!",
        });
      expect(res.status).toBe(200);
      const settings = res.body.data?.settings;
      expect(settings).toBeDefined();
      expect(settings.comingSoonMode).toBe(true);
      expect(settings.comingSoonMessage).toEqual({ en: "We'll be back soon!", ar: "سنعود قريباً!" });
    });

    it("saves and returns underConstructionMode and underConstructionMessage", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          underConstructionMode: true,
          underConstructionMessageEn: "Site under construction",
          underConstructionMessageAr: "الموقع قيد الإنشاء",
        });
      expect(res.status).toBe(200);
      const settings = res.body.data?.settings;
      expect(settings).toBeDefined();
      expect(settings.underConstructionMode).toBe(true);
      expect(settings.underConstructionMessage).toEqual({
        en: "Site under construction",
        ar: "الموقع قيد الإنشاء",
      });
    });

    it("GET /api/settings returns comingSoon and underConstruction when set", async () => {
      await Settings.findOneAndUpdate(
        {},
        {
          $set: {
            comingSoonMode: true,
            comingSoonMessage: { en: "Coming soon", ar: "قريباً" },
            underConstructionMode: false,
            underConstructionMessage: { en: "", ar: "" },
          },
        },
        { upsert: true }
      );
      const res = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      const settings = res.body.data?.settings;
      expect(settings).toBeDefined();
      expect(settings.comingSoonMode).toBe(true);
      expect(settings.comingSoonMessage).toEqual({ en: "Coming soon", ar: "قريباً" });
      expect(settings.underConstructionMode).toBe(false);
    });
  });

  describe("PUT /api/settings validation", () => {
    it("accepts empty orderNotificationEmail (200)", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ orderNotificationEmail: "" });
      expect(res.status).toBe(200);
      const settings = res.body.data?.settings;
      expect(settings).toBeDefined();
    });

    it("rejects invalid orderNotificationEmail with 400 and validation details", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ orderNotificationEmail: "not-an-email" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("errors.common.validation_error");
      expect(res.body.details).toBeDefined();
      expect(String(res.body.details)).toMatch(/orderNotificationEmail|Invalid email/i);
    });

    it("accepts valid orderNotificationEmail", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ orderNotificationEmail: "admin@example.com" });
      expect(res.status).toBe(200);
      const settings = res.body.data?.settings;
      expect(settings?.orderNotificationEmail).toBe("admin@example.com");
    });

    it("accepts announcementBar and promoBanner", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          announcementBar: {
            textEn: "Sale!",
            textAr: "تخفيضات",
            enabled: true,
            backgroundColor: "#1a1a2e",
          },
          promoBanner: {
            enabled: false,
            image: "",
            titleEn: "",
            titleAr: "",
            subtitleEn: "",
            subtitleAr: "",
            ctaLabelEn: "",
            ctaLabelAr: "",
            ctaUrl: "",
          },
        });
      expect(res.status).toBe(200);
      const settings = res.body.data?.settings;
      expect(settings?.announcementBar).toBeDefined();
      expect(settings?.announcementBar?.text?.en).toBe("Sale!");
      expect(settings?.announcementBar?.text?.ar).toBe("تخفيضات");
      expect(settings?.promoBanner).toBeDefined();
    });
  });
});
