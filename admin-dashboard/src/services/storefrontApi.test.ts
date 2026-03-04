import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitStoreContact,
  StorefrontApiError,
  requestForgotPassword,
  resetPassword,
  changePassword,
} from "./storefrontApi";

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

  describe("requestForgotPassword", () => {
    it("posts to /auth/forgot-password and returns success", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, message: "OK", data: { sent: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await requestForgotPassword("user@example.com");

      expect(result.success).toBe(true);
      expect(result.data?.sent).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/forgot-password"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          credentials: "include",
        })
      );
    });

    it("trims and lowercases email", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { sent: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await requestForgotPassword("  User@Example.COM  ");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ email: "user@example.com" }),
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

      await expect(requestForgotPassword("bad")).rejects.toThrow(StorefrontApiError);
    });
  });

  describe("resetPassword", () => {
    it("posts to /auth/reset-password with token, password, confirmPassword", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, message: "OK", data: { reset: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await resetPassword({
        token: "abc123",
        password: "newpass123",
        confirmPassword: "newpass123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.reset).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/reset-password"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            token: "abc123",
            password: "newpass123",
            confirmPassword: "newpass123",
          }),
          credentials: "include",
        })
      );
    });

    it("throws StorefrontApiError on 400", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Invalid or expired reset link", code: "errors.auth.reset_token_invalid" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      );

      await expect(
        resetPassword({ token: "bad", password: "newpass123", confirmPassword: "newpass123" })
      ).rejects.toThrow(StorefrontApiError);
    });
  });

  describe("changePassword", () => {
    it("posts to /auth/change-password with credentials", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, message: "OK", data: { changed: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await changePassword({
        currentPassword: "oldpass",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.changed).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/change-password"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            currentPassword: "oldpass",
            newPassword: "newpass123",
            confirmPassword: "newpass123",
          }),
          credentials: "include",
        })
      );
    });

    it("throws StorefrontApiError on 401", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized", code: "errors.auth.unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      await expect(
        changePassword({
          currentPassword: "old",
          newPassword: "newpass123",
          confirmPassword: "newpass123",
        })
      ).rejects.toThrow(StorefrontApiError);
    });
  });
});
