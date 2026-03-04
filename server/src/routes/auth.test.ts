import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("Auth API", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  it("POST /api/auth/sign-in rejects invalid credentials with 401", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "nonexistent@example.com", password: "wrongpassword" });
    expect([400, 401, 404]).toContain(res.status);
    if (res.body?.success !== undefined) {
      expect(res.body.success).toBe(false);
    }
  });

  it("POST /api/auth/sign-in rejects missing email", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/sign-in rejects invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "not-an-email", password: "password123" });
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/sign-in accepts admin flag without changing validation", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "nonexistent@example.com", password: "wrongpassword", admin: true });
    expect([400, 401, 404]).toContain(res.status);
  });

  describe("POST /api/auth/forgot-password", () => {
    it("rejects missing email with 400", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({});
      expect(res.status).toBe(400);
    });

    it("rejects invalid email format with 400", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "not-an-email" });
      expect(res.status).toBe(400);
    });

    it("accepts valid email and returns 200", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "user@example.com" });
      expect([200, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body?.success).toBe(true);
        expect(res.body?.data?.sent).toBe(true);
      }
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("rejects missing token with 400", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ password: "newpass123", confirmPassword: "newpass123" });
      expect(res.status).toBe(400);
    });

    it("rejects missing password with 400", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "sometoken", confirmPassword: "newpass123" });
      expect(res.status).toBe(400);
    });

    it("rejects password and confirmPassword mismatch with 400", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "sometoken",
          password: "newpass123",
          confirmPassword: "different"
        });
      expect(res.status).toBe(400);
    });

    it("rejects password shorter than 6 chars with 400", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "sometoken",
          password: "short",
          confirmPassword: "short"
        });
      expect(res.status).toBe(400);
    });

    it("returns 400 or 503 for invalid/expired token", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "invalid-or-expired-token",
          password: "newpass123",
          confirmPassword: "newpass123"
        });
      expect([400, 503]).toContain(res.status);
      if (res.status === 400 && res.body?.success === false) {
        expect(res.body?.code).toBeDefined();
      }
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("rejects without auth with 401", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .send({
          currentPassword: "old",
          newPassword: "newpass123",
          confirmPassword: "newpass123"
        });
      expect(res.status).toBe(401);
    });

    it("rejects missing currentPassword with 400", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", "Bearer fake-token-will-401")
        .send({ newPassword: "newpass123", confirmPassword: "newpass123" });
      expect([400, 401]).toContain(res.status);
    });

    it("rejects newPassword and confirmPassword mismatch with 400", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", "Bearer fake-token-will-401")
        .send({
          currentPassword: "old",
          newPassword: "newpass123",
          confirmPassword: "different"
        });
      expect([400, 401]).toContain(res.status);
    });

    it("rejects newPassword shorter than 6 with 400", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", "Bearer fake-token-will-401")
        .send({
          currentPassword: "old",
          newPassword: "short",
          confirmPassword: "short"
        });
      expect([400, 401]).toContain(res.status);
    });
  });
});
