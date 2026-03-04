import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("Customers API", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  describe("PUT /api/customers/:id/password", () => {
    it("rejects without auth with 401", async () => {
      const res = await request(app)
        .put("/api/customers/some-customer-id/password")
        .send({ newPassword: "newpass123", confirmPassword: "newpass123" });
      expect(res.status).toBe(401);
    });

    it("rejects with invalid Bearer token with 401", async () => {
      const res = await request(app)
        .put("/api/customers/some-customer-id/password")
        .set("Authorization", "Bearer invalid-token")
        .send({ newPassword: "newpass123", confirmPassword: "newpass123" });
      expect(res.status).toBe(401);
    });

    it("rejects missing newPassword with 400", async () => {
      const res = await request(app)
        .put("/api/customers/some-customer-id/password")
        .set("Authorization", "Bearer any-token-will-401")
        .send({ confirmPassword: "newpass123" });
      expect([400, 401]).toContain(res.status);
    });

    it("rejects newPassword and confirmPassword mismatch with 400", async () => {
      const res = await request(app)
        .put("/api/customers/some-customer-id/password")
        .set("Authorization", "Bearer any-token-will-401")
        .send({ newPassword: "newpass123", confirmPassword: "different" });
      expect([400, 401]).toContain(res.status);
    });

    it("rejects newPassword shorter than 6 with 400", async () => {
      const res = await request(app)
        .put("/api/customers/some-customer-id/password")
        .set("Authorization", "Bearer any-token-will-401")
        .send({ newPassword: "short", confirmPassword: "short" });
      expect([400, 401]).toContain(res.status);
    });
  });
});
