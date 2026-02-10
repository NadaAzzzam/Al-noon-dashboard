/**
 * Rich Text Formatter for Product Details
 * =========================================
 * Provides Shopify-style formatting support for product details field.
 * Allows titles, paragraphs, and lists within the details field.
 *
 * Format conventions:
 * - Lines starting with "# " are treated as titles/headers
 * - Lines starting with "- " or "* " are treated as list items
 * - Empty lines separate paragraphs
 * - Regular text lines are paragraphs
 *
 * Example input (stored in DB):
 * ```
 * # Product Details
 * This is a beautiful product made with high-quality materials.
 *
 * # Features
 * - Premium fabric
 * - Machine washable
 * - Available in multiple colors
 *
 * # Care Instructions
 * Wash in cold water. Tumble dry low.
 * ```
 *
 * Output structure (for frontend rendering):
 * ```json
 * [
 *   { "type": "title", "text": "Product Details" },
 *   { "type": "paragraph", "text": "This is a beautiful product made with high-quality materials." },
 *   { "type": "title", "text": "Features" },
 *   { "type": "list", "items": ["Premium fabric", "Machine washable", "Available in multiple colors"] },
 *   { "type": "title", "text": "Care Instructions" },
 *   { "type": "paragraph", "text": "Wash in cold water. Tumble dry low." }
 * ]
 * ```
 */

export interface RichTextTitle {
  type: "title";
  text: string;
}

export interface RichTextParagraph {
  type: "paragraph";
  text: string;
}

export interface RichTextList {
  type: "list";
  items: string[];
}

export type RichTextBlock = RichTextTitle | RichTextParagraph | RichTextList;

/**
 * Parses plain text with formatting conventions into structured rich text blocks.
 * Supports titles (# prefix), lists (- or * prefix), and paragraphs.
 */
export function parseRichText(text: string): RichTextBlock[] {
  if (!text || typeof text !== "string") return [];

  const lines = text.split("\n");
  const blocks: RichTextBlock[] = [];
  let currentList: string[] | null = null;
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(" ").trim();
      if (paragraphText) {
        blocks.push({ type: "paragraph", text: paragraphText });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: "list", items: [...currentList] });
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Empty line: flush current paragraph or list and continue
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    // Title line (starts with #)
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      const titleText = line.substring(2).trim();
      if (titleText) {
        blocks.push({ type: "title", text: titleText });
      }
      continue;
    }

    // List item (starts with - or *)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      const itemText = line.substring(2).trim();
      if (itemText) {
        if (!currentList) {
          currentList = [];
        }
        currentList.push(itemText);
      }
      continue;
    }

    // Regular paragraph line
    flushList();
    currentParagraph.push(line);
  }

  // Flush remaining content
  flushParagraph();
  flushList();

  return blocks;
}

/**
 * Converts structured rich text blocks back to plain text format (for editing).
 */
export function serializeRichText(blocks: RichTextBlock[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";

  const lines: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === "title") {
      lines.push(`# ${block.text}`);
      lines.push(""); // Add empty line after title
    } else if (block.type === "paragraph") {
      lines.push(block.text);
      lines.push(""); // Add empty line after paragraph
    } else if (block.type === "list") {
      for (const item of block.items) {
        lines.push(`- ${item}`);
      }
      lines.push(""); // Add empty line after list
    }
  }

  // Remove trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

/**
 * Validates that the text format is valid for rich text parsing.
 * Returns true if valid, false otherwise.
 */
export function isValidRichTextFormat(text: string): boolean {
  if (!text || typeof text !== "string") return true; // Empty is valid

  try {
    const blocks = parseRichText(text);
    return blocks.length === 0 || blocks.some(b => b.type && (b.type === "title" || b.type === "paragraph" || b.type === "list"));
  } catch {
    return false;
  }
}
