import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitStoreContact, StorefrontApiError } from "./storefrontApi";

describe("storefrontApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("submitStoreContact", () => {
    it("posts to /store/contact and returns success", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, message: "Sent" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await submitStoreContact({
        name: "Jane",
        email: "jane@example.com",
        comment: "Hello",
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/store/contact"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Jane",
            email: "jane@example.com",
            phone: undefined,
            comment: "Hello",
          }),
        })
      );
    });

    it("trims and normalizes payload", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await submitStoreContact({
        name: "  Jane  ",
        email: "  Jane@Example.COM  ",
        phone: "  +123  ",
        comment: "  Hello  ",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            name: "Jane",
            email: "jane@example.com",
            phone: "+123",
            comment: "Hello",
          }),
        })
      );
    });

    it("throws StorefrontApiError on 400", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid email", code: "validation_error" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      );

      try {
        await submitStoreContact({ name: "x", email: "bad", comment: "x" });
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(StorefrontApiError);
        expect((e as StorefrontApiError).status).toBe(400);
        expect((e as StorefrontApiError).code).toBe("validation_error");
      }
    });

    it("uses baseUrl and locale from options", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await submitStoreContact(
        { name: "J", email: "j@j.com", comment: "x" },
        { baseUrl: "https://api.example.com", locale: "ar" }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/store/contact",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept-Language": "ar",
          }),
        })
      );
    });
  });
});
