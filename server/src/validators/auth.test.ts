import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "./auth.js";

describe("auth validators", () => {
  describe("registerSchema", () => {
    it("accepts valid registration data", () => {
      const result = registerSchema.safeParse({
        body: { name: "John Doe", email: "john@example.com", password: "password123" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects short name", () => {
      const result = registerSchema.safeParse({
        body: { name: "J", email: "john@example.com", password: "password123" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        body: { name: "John Doe", email: "invalid-email", password: "password123" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = registerSchema.safeParse({
        body: { name: "John Doe", email: "john@example.com", password: "12345" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid email login", () => {
      const result = loginSchema.safeParse({
        body: { email: "admin@example.com", password: "password123" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts admin@localhost for dev", () => {
      const result = loginSchema.safeParse({
        body: { email: "admin@localhost", password: "admin123" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        body: { email: "not-an-email", password: "password123" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = loginSchema.safeParse({
        body: { email: "admin@example.com", password: "12345" },
      });
      expect(result.success).toBe(false);
    });
  });
});
