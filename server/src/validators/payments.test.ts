import { describe, it, expect } from "vitest";
import { paymentProofSchema, paymentConfirmSchema } from "./payments.js";

describe("payments validators", () => {
  describe("paymentProofSchema", () => {
    it("accepts valid proof URL", () => {
      expect(paymentProofSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { instaPayProofUrl: "https://example.com/proof.jpg" },
      }).success).toBe(true);
    });

    it("rejects empty instaPayProofUrl", () => {
      expect(paymentProofSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { instaPayProofUrl: "" },
      }).success).toBe(false);
    });

    it("rejects empty id", () => {
      expect(paymentProofSchema.safeParse({
        params: { id: "" },
        body: { instaPayProofUrl: "https://proof.com/img.jpg" },
      }).success).toBe(false);
    });
  });

  describe("paymentConfirmSchema", () => {
    it("accepts approved true", () => {
      expect(paymentConfirmSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { approved: true },
      }).success).toBe(true);
    });

    it("accepts approved false", () => {
      expect(paymentConfirmSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { approved: false },
      }).success).toBe(true);
    });

    it("rejects missing approved", () => {
      expect(paymentConfirmSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: {},
      }).success).toBe(false);
    });

    it("rejects non-boolean approved", () => {
      expect(paymentConfirmSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { approved: "yes" },
      }).success).toBe(false);
    });

    it("rejects empty id", () => {
      expect(paymentConfirmSchema.safeParse({
        params: { id: "" },
        body: { approved: true },
      }).success).toBe(false);
    });
  });
});
