import { describe, it, expect, vi } from "vitest";
import type { Response } from "express";
import { sendResponse, sendError } from "./response.js";

// Mock i18n
vi.mock("../i18n.js", () => ({
  t: (_locale: string, key: string) => key,
}));

describe("response utils", () => {
  const mockRes = (): Response => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res) as NonNullable<Response["status"]>;
    res.json = vi.fn().mockReturnValue(res) as NonNullable<Response["json"]>;
    res.send = vi.fn().mockReturnValue(res) as NonNullable<Response["send"]>;
    return res;
  };

  const locale = "en";

  describe("sendResponse", () => {
    it("sends 200 with data", () => {
      const res = mockRes();
      sendResponse(res, locale, { data: { id: "1" } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: "1" } })
      );
    });

    it("sends 204 with no body", () => {
      const res = mockRes();
      sendResponse(res, locale, { status: 204 });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
    });

    it("includes pagination when provided", () => {
      const res = mockRes();
      sendResponse(res, locale, {
        data: [],
        pagination: { total: 10, page: 1, limit: 5, totalPages: 2 },
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: { total: 10, page: 1, limit: 5, totalPages: 2 },
        })
      );
    });
  });

  describe("sendError", () => {
    it("sends error with status and message", () => {
      const res = mockRes();
      sendError(res, locale, { statusCode: 404, code: "errors.common.not_found" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "errors.common.not_found",
          code: "errors.common.not_found",
          data: null,
        })
      );
    });

    it("includes details when provided", () => {
      const res = mockRes();
      sendError(res, locale, {
        statusCode: 400,
        code: "errors.validation",
        details: { field: "email" },
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ details: { field: "email" } })
      );
    });
  });
});
