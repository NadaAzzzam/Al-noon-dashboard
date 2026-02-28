/**
 * Storefront product serializer – omits fields never used by the storefront UI.
 * Apply when the API is called with ?for=storefront.
 *
 * Strips:
 * - vendor, imageColors, defaultMediaType, hoverMediaType, weightUnit, sizeDescriptions
 * - variants (root), __v, createdAt, updatedAt, isNewArrival
 * - discountPrice (storefront uses discountPercent + price; raw discountPrice omitted)
 * - category.name, category.status
 * - availability.colors[].imageUrl, hasImage, availableSizeCount (keeps color, available, outOfStock)
 * - availability.availableSizeCount, availability.variantsSource
 */
type UnknownRecord = Record<string, unknown>;

/** Keys to omit from product root for storefront. */
const OMIT_ROOT: ReadonlySet<string> = new Set([
  "vendor",
  "imageColors",
  "defaultMediaType",
  "hoverMediaType",
  "weightUnit",
  "sizeDescriptions",
  "variants",
  "__v",
  "createdAt",
  "updatedAt",
  "isNewArrival",
  "discountPrice",
]);

/** Slim category: only _id for catalog filters. */
function slimCategory(cat: unknown): unknown {
  if (!cat || typeof cat !== "object") return cat;
  const c = cat as Record<string, unknown>;
  return { _id: c._id ?? c.id };
}

/** Slim availability.colors: color, outOfStock, available (drop imageUrl, hasImage, availableSizeCount). */
function slimAvailabilityColors(colors: unknown): unknown[] {
  if (!Array.isArray(colors)) return [];
  return colors.map((item) => {
    if (!item || typeof item !== "object") return item;
    const obj = item as Record<string, unknown>;
    return {
      color: obj.color,
      available: obj.available,
      outOfStock: obj.outOfStock,
    };
  });
}

/** Slim availability: drop variantsSource, availableSizeCount; slim colors. */
function slimAvailability(avail: unknown): UnknownRecord | undefined {
  if (!avail || typeof avail !== "object") return undefined;
  const a = avail as Record<string, unknown>;
  const colors = slimAvailabilityColors(a.colors);
  const sizes = Array.isArray(a.sizes) ? a.sizes : [];
  const variants = Array.isArray(a.variants) ? a.variants : [];
  return {
    colors,
    sizes,
    variants,
  };
}

/**
 * Returns a product object with only storefront-used fields.
 * Use for list and detail responses when ?for=storefront.
 */
export function toStorefrontProduct(product: UnknownRecord): UnknownRecord {
  const out: UnknownRecord = {};
  for (const [key, value] of Object.entries(product)) {
    if (OMIT_ROOT.has(key)) continue;
    if (key === "category") {
      out.category = slimCategory(value);
      continue;
    }
    if (key === "availability") {
      out.availability = slimAvailability(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}
