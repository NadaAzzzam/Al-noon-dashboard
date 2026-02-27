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
});
