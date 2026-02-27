import { describe, it, expect, beforeEach } from "vitest";
import {
  getUploadsBaseUrl,
  getProductImageUrl,
  getProductVideoUrl,
  isVideoUrl,
  hasPermission,
  setCurrentUser,
  getCurrentUser,
} from "./api";

describe("api utils", () => {
  beforeEach(() => {
    setCurrentUser(null);
  });

  describe("getUploadsBaseUrl", () => {
    it("returns a string (origin or API base without /api)", () => {
      const url = getUploadsBaseUrl();
      expect(typeof url).toBe("string");
      expect(url.length).toBeGreaterThan(0);
    });
  });

  describe("getProductImageUrl", () => {
    it("returns empty string for empty path", () => {
      expect(getProductImageUrl("")).toBe("");
    });

    it("returns absolute URL as-is", () => {
      const url = "https://example.com/image.jpg";
      expect(getProductImageUrl(url)).toBe(url);
    });

    it("prepends base URL for relative path", () => {
      expect(getProductImageUrl("/uploads/products/img.jpg")).toContain("/uploads/products/img.jpg");
    });
  });

  describe("getProductVideoUrl", () => {
    it("returns empty string for empty path", () => {
      expect(getProductVideoUrl("")).toBe("");
    });

    it("returns absolute URL as-is", () => {
      const url = "https://example.com/video.mp4";
      expect(getProductVideoUrl(url)).toBe(url);
    });
  });

  describe("isVideoUrl", () => {
    it("returns true for .mp4", () => {
      expect(isVideoUrl("/path/video.mp4")).toBe(true);
    });

    it("returns true for .webm", () => {
      expect(isVideoUrl("https://example.com/video.webm")).toBe(true);
    });

    it("returns false for .jpg", () => {
      expect(isVideoUrl("/path/image.jpg")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isVideoUrl("")).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("returns false when no user", () => {
      expect(hasPermission("products:read")).toBe(false);
    });

    it("returns true when user has permission", () => {
      setCurrentUser({
        id: "1",
        name: "Admin",
        email: "admin@test.com",
        role: "ADMIN",
        permissions: ["products:read", "products:write"],
      });
      expect(hasPermission("products:read")).toBe(true);
    });

    it("returns false when user lacks permission", () => {
      setCurrentUser({
        id: "1",
        name: "User",
        email: "user@test.com",
        role: "USER",
        permissions: ["products:read"],
      });
      expect(hasPermission("products:write")).toBe(false);
    });
  });

  describe("getCurrentUser / setCurrentUser", () => {
    it("returns null initially", () => {
      expect(getCurrentUser()).toBeNull();
    });

    it("returns user after setCurrentUser", () => {
      const user = { id: "1", name: "Test", email: "test@test.com", role: "ADMIN" };
      setCurrentUser(user);
      expect(getCurrentUser()).toEqual(user);
    });
  });
});
