import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Settings } from "../models/Settings.js";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { Subscriber } from "../models/Subscriber.js";

describe("Store API (integration)", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  describe("GET /api/store/home", () => {
    it("returns home page data with expected structure", async () => {
      const res = await request(app).get("/api/store/home");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.home).toBeDefined();
      const home = res.body.data.home;
      expect(home.store).toBeDefined();
      expect(home.hero).toBeDefined();
      expect(Array.isArray(home.newArrivals)).toBe(true);
      expect(Array.isArray(home.homeCollections)).toBe(true);
      expect(home.homeCollectionsDisplayLimit).toBeDefined();
      expect(Array.isArray(home.ourCollectionSectionImages)).toBe(true);
      expect(Array.isArray(home.ourCollectionSectionVideos)).toBe(true);
      expect(typeof home.store?.discountCodeSupported).toBe("boolean");
    });

    it("returns homeCollections with image and video field for each item", async () => {
      await Settings.findOneAndUpdate(
        {},
        {
          $set: {
            homeCollections: [
              { title: { en: "Abayas", ar: "عباءات" }, image: "/a.jpg", video: "/uploads/videos/abaya.mp4", url: "/cat/abayas", order: 0 },
              { title: { en: "Capes", ar: "كابات" }, image: "/b.jpg", url: "/cat/capes", order: 1 },
            ],
          },
        },
        { upsert: true }
      );

      const res = await request(app).get("/api/store/home");
      expect(res.status).toBe(200);
      const collections = res.body.data?.home?.homeCollections ?? [];
      expect(collections.length).toBeGreaterThanOrEqual(2);

      const withVideo = collections.find((c: { url?: string }) => c.url === "/cat/abayas");
      expect(withVideo).toBeDefined();
      expect(withVideo).toHaveProperty("image", "/a.jpg");
      expect(withVideo).toHaveProperty("video", "/uploads/videos/abaya.mp4");
      expect(withVideo).toHaveProperty("hoverVideo", "");
      expect(withVideo).toHaveProperty("defaultMediaType");
      expect(withVideo).toHaveProperty("hoverMediaType");
      expect(withVideo).toHaveProperty("title");
      expect(withVideo).toHaveProperty("url", "/cat/abayas");

      const withoutVideo = collections.find((c: { url?: string }) => c.url === "/cat/capes");
      expect(withoutVideo).toBeDefined();
      expect(withoutVideo).toHaveProperty("image", "/b.jpg");
      expect(withoutVideo).toHaveProperty("video", "");
      expect(withoutVideo).toHaveProperty("hoverVideo", "");
      expect(withoutVideo).toHaveProperty("url", "/cat/capes");
    });

    it("deduplicates homeCollections by url", async () => {
      // Seed settings with duplicate collection URLs
      await Settings.findOneAndUpdate(
        {},
        {
          $set: {
            homeCollections: [
              { title: { en: "A", ar: "أ" }, image: "/a.jpg", url: "/cat/a", order: 0 },
              { title: { en: "B", ar: "ب" }, image: "/b.jpg", url: "/cat/a", order: 1 }, // duplicate url
              { title: { en: "C", ar: "ج" }, image: "/c.jpg", url: "/cat/c", order: 2 },
            ],
          },
        },
        { upsert: true }
      );

      const res = await request(app).get("/api/store/home");
      expect(res.status).toBe(200);
      const collections = res.body.data?.home?.homeCollections ?? [];
      const urls = collections.map((c: { url?: string }) => c.url);
      const uniqueUrls = [...new Set(urls)];
      expect(urls.length).toBe(uniqueUrls.length);
      // Should keep first occurrence per url, so /cat/a appears once
      expect(collections.filter((c: { url?: string }) => c.url === "/cat/a").length).toBe(1);
    });
  });

  describe("GET /api/store/home comingSoon and underConstruction", () => {
    it("returns store.comingSoonMode and store.underConstructionMode in home data", async () => {
      await Settings.findOneAndUpdate(
        {},
        {
          $set: {
            comingSoonMode: true,
            underConstructionMode: false,
            comingSoonMessage: { en: "Soon", ar: "قريباً" },
          },
        },
        { upsert: true }
      );
      const res = await request(app).get("/api/store/home");
      expect(res.status).toBe(200);
      const store = res.body.data?.home?.store;
      expect(store).toBeDefined();
      expect(store.comingSoonMode).toBe(true);
      expect(store.underConstructionMode).toBe(false);
      expect(store.comingSoonMessage).toEqual({ en: "Soon", ar: "قريباً" });
    });
  });

  describe("GET /api/store/settings", () => {
    it("returns store settings without auth", async () => {
      const res = await request(app).get("/api/store/settings");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.settings).toBeDefined();
      const s = res.body.data.settings;
      expect(s.storeName).toBeDefined();
      expect(s.logo).toBeDefined();
      expect(s.announcementBar).toBeDefined();
    });

    it("returns full store settings structure with contentPages, currency, discountCodeSupported", async () => {
      const res = await request(app).get("/api/store/settings");
      expect(res.status).toBe(200);
      const s = res.body.data?.settings;
      expect(Array.isArray(s.contentPages)).toBe(true);
      expect(typeof s.currency).toBe("string");
      expect(typeof s.currencySymbol).toBe("string");
      expect(typeof s.discountCodeSupported).toBe("boolean");
    });

    it("returns comingSoonMode, underConstructionMode and optional messages when set", async () => {
      await Settings.findOneAndUpdate(
        {},
        {
          $set: {
            comingSoonMode: true,
            comingSoonMessage: { en: "Coming soon", ar: "قريباً" },
            underConstructionMode: true,
            underConstructionMessage: { en: "Under construction", ar: "قيد الإنشاء" },
          },
        },
        { upsert: true }
      );
      const res = await request(app).get("/api/store/settings");
      expect(res.status).toBe(200);
      const s = res.body.data?.settings;
      expect(s.comingSoonMode).toBe(true);
      expect(s.comingSoonMessage).toEqual({ en: "Coming soon", ar: "قريباً" });
      expect(s.underConstructionMode).toBe(true);
      expect(s.underConstructionMessage).toEqual({ en: "Under construction", ar: "قيد الإنشاء" });
    });
  });

  describe("GET /api/store/page/:slug", () => {
    it("returns 404 for invalid slug", async () => {
      const res = await request(app).get("/api/store/page/invalid-slug-xyz");
      expect(res.status).toBe(404);
    });

    it("returns page content for valid slug", async () => {
      const res = await request(app).get("/api/store/page/privacy");
      expect(res.status).toBe(200);
      expect(res.body.data?.page).toBeDefined();
      expect(res.body.data.page.slug).toBe("privacy");
      expect(res.body.data.page.title).toBeDefined();
      expect(res.body.data.page.content).toBeDefined();
    });
  });

  describe("POST /api/store/contact", () => {
    it("accepts valid contact form and returns 201", async () => {
      const res = await request(app)
        .post("/api/store/contact")
        .send({
          name: "Test User",
          email: "contact-test@example.com",
          phone: "+1234567890",
          comment: "Test message for integration",
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const created = await ContactSubmission.findOne({ email: "contact-test@example.com" });
      expect(created).toBeTruthy();
      expect(created?.name).toBe("Test User");
      expect(created?.comment).toContain("integration");
    });

    it("rejects missing name", async () => {
      const res = await request(app)
        .post("/api/store/contact")
        .send({ email: "a@b.com", comment: "x" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid email", async () => {
      const res = await request(app)
        .post("/api/store/contact")
        .send({ name: "X", email: "not-email", comment: "x" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/newsletter/subscribe", () => {
    it("subscribes valid email and returns 201", async () => {
      await Settings.findOneAndUpdate({}, { $set: { newsletterEnabled: true } }, { upsert: true });
      const email = `newsletter-${Date.now()}@example.com`;

      const res = await request(app)
        .post("/api/newsletter/subscribe")
        .send({ email });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const sub = await Subscriber.findOne({ email });
      expect(sub).toBeTruthy();
    });

    it("returns 409 when already subscribed", async () => {
      const email = "already-subscribed@example.com";
      await Subscriber.findOneAndUpdate({ email }, { $set: { email } }, { upsert: true });
      await Settings.findOneAndUpdate({}, { $set: { newsletterEnabled: true } }, { upsert: true });

      const res = await request(app)
        .post("/api/newsletter/subscribe")
        .send({ email });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.alreadySubscribed).toBe(true);
    });

    it("returns 400 when newsletter is disabled", async () => {
      await Settings.findOneAndUpdate({}, { $set: { newsletterEnabled: false } }, { upsert: true });
      const res = await request(app)
        .post("/api/newsletter/subscribe")
        .send({ email: "new-subscriber@example.com" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
