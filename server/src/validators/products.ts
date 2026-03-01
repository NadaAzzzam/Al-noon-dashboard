import { z } from "zod";

/** Shared string constraints for localized fields */
const MAX_NAME = 500;
const MAX_DESCRIPTION = 10000;
const MAX_META = 70;
const MAX_META_DESC = 160;

const localizedBody = z.object({
  /** Required: Product name in English (display, search, SEO). */
  nameEn: z.string().trim().min(1, "Name (EN) is required").max(MAX_NAME, `Name (EN) must be at most ${MAX_NAME} characters`),
  /** Required: Product name in Arabic (display, search, SEO). */
  nameAr: z.string().trim().min(1, "Name (AR) is required").max(MAX_NAME, `Name (AR) must be at most ${MAX_NAME} characters`),
  /** Optional: Product description in English. */
  descriptionEn: z.string().trim().max(MAX_DESCRIPTION).optional(),
  /** Optional: Product description in Arabic. */
  descriptionAr: z.string().trim().max(MAX_DESCRIPTION).optional()
});

const productBodySchema = z.object({
  body: localizedBody.merge(z.object({
    /** Required: Base price in EGP. */
    price: z.number().positive("Price must be greater than 0"),
    /** Optional: Discounted price (must be less than price). */
    discountPrice: z.number().positive().optional(),
    /** Optional: Cost per item for margin calculation. */
    costPerItem: z.number().positive().optional(),
    /** Required: Available stock quantity. */
    stock: z.number().int().nonnegative("Stock must be 0 or greater"),
    /** Required: Category ID. */
    category: z.string().trim().min(1, "Category is required"),
    /** Optional: Product status. */
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
    /** Optional: Show in New Arrivals. */
    isNewArrival: z.boolean().optional(),
    /** Optional: Product image paths/URLs. */
    images: z.array(z.string().min(1).max(2000)).max(20).optional(),
    /** Optional: Main display image. */
    viewImage: z.string().max(2000).optional(),
    /** Optional: Hover image. */
    hoverImage: z.string().max(2000).optional(),
    /** Optional: Color labels for images. */
    imageColors: z.array(z.string().max(50)).max(20).optional(),
    /** Optional: Product video URLs. */
    videos: z.array(z.string().max(2000)).max(10).optional(),
    /** Optional: Default media type for listing. */
    defaultMediaType: z.enum(["image", "video"]).optional(),
    /** Optional: Hover media type. */
    hoverMediaType: z.enum(["image", "video"]).optional(),
    /** Optional: Details content (rich text). */
    detailsEn: z.string().max(50000).optional(),
    detailsAr: z.string().max(50000).optional(),
    /** Optional: Styling tip. */
    stylingTipEn: z.string().max(1000).optional(),
    stylingTipAr: z.string().max(1000).optional(),
    /** Optional: Available sizes. */
    sizes: z.array(z.string().max(50)).max(50).optional(),
    /** Optional: Size descriptions. */
    sizeDescriptions: z.array(z.string().max(200)).max(50).optional(),
    /** Optional: Available colors. */
    colors: z.array(z.string().max(50)).max(30).optional(),
    /** Optional: URL-friendly slug (EN). Auto-generated from name if omitted. */
    slugEn: z.string().regex(/^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/, "Slug (EN) must be lowercase alphanumeric with hyphens").max(200).optional(),
    /** Optional: URL-friendly slug (AR). Auto-generated from name if omitted. */
    slugAr: z.string().regex(/^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/u, "Slug (AR) must be alphanumeric with hyphens").max(200).optional(),
    /** Optional: Tags for filtering/search. */
    tags: z.array(z.string().trim().max(50)).max(30).optional(),
    /** Optional: Brand/vendor name. */
    vendor: z.string().trim().max(200).optional(),
    /** Optional: SEO meta title (EN). */
    metaTitleEn: z.string().trim().max(MAX_META).optional(),
    /** Optional: SEO meta title (AR). */
    metaTitleAr: z.string().trim().max(MAX_META).optional(),
    /** Optional: SEO meta description (EN). */
    metaDescriptionEn: z.string().trim().max(MAX_META_DESC).optional(),
    /** Optional: SEO meta description (AR). */
    metaDescriptionAr: z.string().trim().max(MAX_META_DESC).optional(),
    /** Optional: Product weight for shipping (g or kg). */
    weight: z.number().positive().max(1000000).optional(),
    /** Optional: Weight unit. */
    weightUnit: z.enum(["g", "kg"]).optional()
  }))
});

const discountPriceRefine = (data: { body: { discountPrice?: number; price: number } }) => {
  const { discountPrice, price } = data.body;
  if (discountPrice == null) return true;
  return discountPrice < price;
};

export const productParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const productSchema = productBodySchema.refine(
  discountPriceRefine,
  { message: "Discount price must be less than regular price", path: ["body", "discountPrice"] }
);

/** Combined schema for PUT /:id (body + params.id) */
export const productUpdateSchema = productBodySchema
  .merge(productParamsSchema)
  .refine(
    discountPriceRefine,
    { message: "Discount price must be less than regular price", path: ["body", "discountPrice"] }
  );

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(500).optional().default(20),
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
    category: z.string().optional(),
    newArrival: z.enum(["true", "false"]).optional(),
    /** E-commerce: inStock | outOfStock | all */
    availability: z.enum(["inStock", "outOfStock", "all"]).optional(),
    /** E-commerce: filter by color (e.g. Black, Navy). Case-insensitive match on product.colors */
    color: z.string().optional(),
    /** E-commerce: min price (EGP) */
    minPrice: z.coerce.number().min(0).optional(),
    /** E-commerce: max price (EGP) */
    maxPrice: z.coerce.number().min(0).optional(),
    /** E-commerce: Shopify-style (BEST_SELLING, CREATED_DESC, PRICE_ASC, PRICE_DESC, TITLE_ASC, TITLE_DESC, MANUAL) or legacy (newest, priceAsc, …) */
    sort: z.string().optional(),
    /** Admin: only products with average rating (approved feedback) >= this value (1-5) */
    minRating: z.coerce.number().min(1).max(5).optional(),
    /** Filter by tags (comma-separated, e.g. "summer,bestseller"). Matches products with ANY of the tags. */
    tags: z.string().optional(),
    /** Filter by vendor/brand name (case-insensitive partial match). */
    vendor: z.string().optional(),
    /** Filter products that have a discount price set. */
    hasDiscount: z.enum(["true", "false"]).optional(),
    /** Lookup by slug (e.g. embroidered-malhafa-sale). Returns products with exact slug match. Use "*" to list all. Optional; defaults to "*" when omitted (storefront-friendly). */
    slug: z.string().min(1).optional().default("*"),
    /** Return slim product (omit unused storefront fields) when "storefront". */
    for: z.enum(["storefront"]).optional()
  })
});

export const productStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]) })
});
