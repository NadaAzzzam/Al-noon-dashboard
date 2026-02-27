import { describe, it, expect } from "vitest";
import { formatPriceEGP } from "./format";

describe("format utils", () => {
  describe("formatPriceEGP", () => {
    it("formats number as EGP price with 2 decimals", () => {
      expect(formatPriceEGP(99.5)).toBe("99.50 EGP");
    });

    it("formats integer as EGP price", () => {
      expect(formatPriceEGP(100)).toBe("100.00 EGP");
    });

    it("formats zero correctly", () => {
      expect(formatPriceEGP(0)).toBe("0.00 EGP");
    });

    it("rounds to 2 decimal places", () => {
      expect(formatPriceEGP(10.999)).toBe("11.00 EGP");
    });
  });
});
