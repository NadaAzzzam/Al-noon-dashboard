import { describe, it, expect } from "vitest";
import { daysSinceOrder, isLongWait, type OrderStatus } from "./orderUtils";

describe("orderUtils", () => {
  describe("daysSinceOrder", () => {
    it("returns null for undefined", () => {
      expect(daysSinceOrder(undefined)).toBeNull();
    });

    it("returns 0 for today", () => {
      const today = new Date().toISOString();
      expect(daysSinceOrder(today)).toBe(0);
    });

    it("returns 1 for yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(daysSinceOrder(yesterday.toISOString())).toBe(1);
    });

    it("returns 7 for a week ago", () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      expect(daysSinceOrder(weekAgo.toISOString())).toBe(7);
    });
  });

  describe("isLongWait", () => {
    it("returns false when days is null", () => {
      expect(isLongWait(null, "PENDING")).toBe(false);
    });

    it("returns false when days < 2", () => {
      expect(isLongWait(0, "PENDING")).toBe(false);
      expect(isLongWait(1, "PENDING")).toBe(false);
    });

    it("returns false for DELIVERED", () => {
      expect(isLongWait(5, "DELIVERED")).toBe(false);
    });

    it("returns false for CANCELLED", () => {
      expect(isLongWait(5, "CANCELLED")).toBe(false);
    });

    it("returns true when 2+ days and status is PENDING", () => {
      expect(isLongWait(2, "PENDING")).toBe(true);
      expect(isLongWait(5, "PENDING")).toBe(true);
    });

    it("returns true when 2+ days and status is CONFIRMED", () => {
      expect(isLongWait(3, "CONFIRMED")).toBe(true);
    });

    it("returns true when 2+ days and status is SHIPPED", () => {
      expect(isLongWait(4, "SHIPPED")).toBe(true);
    });
  });
});
