import { describe, it, expect } from "vitest";
import { parseRichText, serializeRichText, isValidRichTextFormat } from "./richTextFormatter.js";

describe("richTextFormatter", () => {
  describe("parseRichText", () => {
    it("returns empty array for empty string", () => {
      expect(parseRichText("")).toEqual([]);
      expect(parseRichText("   ")).toEqual([]);
    });

    it("parses title lines", () => {
      const result = parseRichText("# Product Details");
      expect(result).toEqual([{ type: "title", text: "Product Details" }]);
    });

    it("parses paragraph lines", () => {
      const result = parseRichText("This is a paragraph.");
      expect(result).toEqual([{ type: "paragraph", text: "This is a paragraph." }]);
    });

    it("parses list items with - prefix", () => {
      const result = parseRichText("- Item 1\n- Item 2\n- Item 3");
      expect(result).toEqual([{ type: "list", items: ["Item 1", "Item 2", "Item 3"] }]);
    });

    it("parses list items with * prefix", () => {
      const result = parseRichText("* First\n* Second");
      expect(result).toEqual([{ type: "list", items: ["First", "Second"] }]);
    });

    it("parses mixed content", () => {
      const input = `# Features
- Premium fabric
- Machine washable

# Care
Wash in cold water.`;
      const result = parseRichText(input);
      expect(result).toHaveLength(4);
      const [r0, r1, r2, r3] = result;
      expect(r0).toEqual({ type: "title", text: "Features" });
      expect(r1).toEqual({ type: "list", items: ["Premium fabric", "Machine washable"] });
      expect(r2).toEqual({ type: "title", text: "Care" });
      expect(r3).toEqual({ type: "paragraph", text: "Wash in cold water." });
    });

    it("handles empty lines between blocks", () => {
      const result = parseRichText("# Title\n\nParagraph text");
      expect(result).toEqual([
        { type: "title", text: "Title" },
        { type: "paragraph", text: "Paragraph text" },
      ]);
    });
  });

  describe("serializeRichText", () => {
    it("returns empty string for empty array", () => {
      expect(serializeRichText([])).toBe("");
    });

    it("serializes title back to # format", () => {
      const blocks = [{ type: "title" as const, text: "Title" }];
      expect(serializeRichText(blocks)).toContain("# Title");
    });

    it("serializes list back to - format", () => {
      const blocks = [{ type: "list" as const, items: ["A", "B"] }];
      expect(serializeRichText(blocks)).toContain("- A");
      expect(serializeRichText(blocks)).toContain("- B");
    });

    it("round-trips parse -> serialize", () => {
      const input = "# Test\n- One\n- Two\n\nParagraph here";
      const blocks = parseRichText(input);
      const serialized = serializeRichText(blocks);
      const reparsed = parseRichText(serialized);
      expect(reparsed).toEqual(blocks);
    });
  });

  describe("isValidRichTextFormat", () => {
    it("returns true for empty string", () => {
      expect(isValidRichTextFormat("")).toBe(true);
    });

    it("returns true for valid format", () => {
      expect(isValidRichTextFormat("# Title\n- Item")).toBe(true);
    });

    it("returns true for plain paragraph", () => {
      expect(isValidRichTextFormat("Just text")).toBe(true);
    });
  });
});
