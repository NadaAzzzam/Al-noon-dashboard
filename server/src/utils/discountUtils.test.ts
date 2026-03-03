import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAndComputeDiscount } from "./discountUtils.js";

const findOneMock = vi.fn();

function mockFindOne(result: unknown) {
  return vi.fn().mockReturnValue({
    lean: () => Promise.resolve(result),
  });
}

vi.mock("../models/DiscountCode.js", () => ({
  DiscountCode: {
    get findOne() {
      return findOneMock;
    },
  },
}));

const existsMock = vi.fn().mockResolvedValue(null);
vi.mock("../models/DiscountCodeUsage.js", () => ({
  DiscountCodeUsage: {
    get exists() {
      return existsMock;
    },
  },
}));

describe("discountUtils", () => {
  beforeEach(() => {
    findOneMock.mockReset();
    existsMock.mockResolvedValue(null);
  });

  describe("validateAndComputeDiscount", () => {
    it("throws when code is empty", async () => {
      await expect(validateAndComputeDiscount("", 100)).rejects.toMatchObject({
        statusCode: 400,
        message: "Discount code is required",
      });
    });

    it("throws when code is whitespace only", async () => {
      await expect(validateAndComputeDiscount("   ", 100)).rejects.toMatchObject({
        statusCode: 400,
        message: "Discount code is required",
      });
    });

    it("throws when discount code not found", async () => {
      findOneMock.mockImplementation(mockFindOne(null));
      await expect(validateAndComputeDiscount("BADCODE", 100)).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid discount code",
      });
    });

    it("throws when discount code disabled", async () => {
      findOneMock.mockImplementation(
        mockFindOne({ code: "DISABLED", enabled: false, type: "PERCENT", value: 10 })
      );
      await expect(validateAndComputeDiscount("DISABLED", 100)).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid discount code",
      });
    });

    it("returns PERCENT discount correctly", async () => {
      const discountId = "507f1f77bcf86cd799439011";
      findOneMock.mockImplementation(
        mockFindOne({
          _id: discountId,
          code: "SAVE10",
          enabled: true,
          type: "PERCENT",
          value: 10,
          minOrderAmount: 0,
          validFrom: null,
          validUntil: null,
          usageLimit: null,
          usedCount: 0,
        })
      );
      const result = await validateAndComputeDiscount("save10", 200);
      expect(result).toEqual({
        discountCode: "SAVE10",
        discountCodeId: discountId,
        discountAmount: 20,
        type: "PERCENT",
        value: 10,
      });
    });

    it("returns FIXED discount correctly", async () => {
      const discountId = "507f1f77bcf86cd799439012";
      findOneMock.mockImplementation(
        mockFindOne({
          _id: discountId,
          code: "FLAT50",
          enabled: true,
          type: "FIXED",
          value: 50,
          minOrderAmount: 0,
          validFrom: null,
          validUntil: null,
          usageLimit: null,
          usedCount: 0,
        })
      );
      const result = await validateAndComputeDiscount("flat50", 300);
      expect(result).toEqual({
        discountCode: "FLAT50",
        discountCodeId: discountId,
        discountAmount: 50,
        type: "FIXED",
        value: 50,
      });
    });

    it("throws when subtotal below minOrderAmount", async () => {
      findOneMock.mockImplementation(
        mockFindOne({
          code: "FLAT50",
          enabled: true,
          type: "FIXED",
          value: 50,
          minOrderAmount: 200,
          validFrom: null,
          validUntil: null,
          usageLimit: null,
          usedCount: 0,
        })
      );
      await expect(validateAndComputeDiscount("FLAT50", 100)).rejects.toMatchObject({
        statusCode: 400,
        message: "Order total too low for this discount code",
      });
    });

    it("caps FIXED discount at subtotal", async () => {
      findOneMock.mockImplementation(
        mockFindOne({
          _id: "507f1f77bcf86cd799439013",
          code: "FLAT200",
          enabled: true,
          type: "FIXED",
          value: 200,
          minOrderAmount: 0,
          validFrom: null,
          validUntil: null,
          usageLimit: null,
          usedCount: 0,
        })
      );
      const result = await validateAndComputeDiscount("FLAT200", 150);
      expect(result.discountAmount).toBe(150);
    });

    it("throws when identity has already used the code", async () => {
      const discountId = "507f1f77bcf86cd799439014";
      findOneMock.mockImplementation(
        mockFindOne({
          _id: discountId,
          code: "SAVE10",
          enabled: true,
          type: "PERCENT",
          value: 10,
          minOrderAmount: 0,
          validFrom: null,
          validUntil: null,
          usageLimit: null,
          usedCount: 0,
        })
      );
      existsMock.mockResolvedValue({ _id: "usage123" });
      await expect(
        validateAndComputeDiscount("SAVE10", 200, { email: "guest@example.com" })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "This discount code has already been used with this account or contact",
      });
    });

    it("allows code when identity has not used it", async () => {
      const discountId = "507f1f77bcf86cd799439015";
      findOneMock.mockImplementation(
        mockFindOne({
          _id: discountId,
          code: "SAVE10",
          enabled: true,
          type: "PERCENT",
          value: 10,
          minOrderAmount: 0,
          validFrom: null,
          validUntil: null,
          usageLimit: null,
          usedCount: 0,
        })
      );
      existsMock.mockResolvedValue(null);
      const result = await validateAndComputeDiscount("SAVE10", 200, { email: "new@example.com" });
      expect(result.discountCode).toBe("SAVE10");
      expect(result.discountAmount).toBe(20);
    });
  });
});
