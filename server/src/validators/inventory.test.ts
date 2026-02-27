import { describe, it, expect } from "vitest";
import { stockUpdateSchema } from "./inventory.js";

describe("inventory validators", () => {
  describe("stockUpdateSchema", () => {
    it("accepts valid stock update", () => {
      const result = stockUpdateSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { stock: 10 },
      });
      expect(result.success).toBe(true);
    });

    it("accepts stock zero", () => {
      expect(stockUpdateSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { stock: 0 },
      }).success).toBe(true);
    });

    it("rejects negative stock", () => {
      expect(stockUpdateSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { stock: -1 },
      }).success).toBe(false);
    });

    it("rejects non-integer stock", () => {
      expect(stockUpdateSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { stock: 10.5 },
      }).success).toBe(false);
    });

    it("rejects empty id", () => {
      expect(stockUpdateSchema.safeParse({
        params: { id: "" },
        body: { stock: 5 },
      }).success).toBe(false);
    });
  });
});
