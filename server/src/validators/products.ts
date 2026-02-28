import { z } from "zod";

const localizedBody = z.object({
  nameEn: z.string().min(1, "Name (EN) required"),
  nameAr: z.string().min(1, "Name (AR) required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional()
});

const productBodySchema = z.object({
  body: localizedBody.merge(z.object({
    price: z.number().positive(),
    discountPrice: z.number().positive().optional(),
    costPerItem: z.number().positive().optional(),
    stock: z.number().int().nonnegative(),
    category: z.string().min(1),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
    isNewArrival: z.boolean().optional(),
    images: z.array(z.string()).optional(),
    viewImage: z.string().optional(),
    hoverImage: z.string().optional(),
    imageColors: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    defaultMediaType: z.enum(["image", "video"]).optional(),
    hoverMediaType: z.enum(["image", "video"]).optional(),
    detailsEn: z.string().optional(),
    detailsAr: z.string().optional(),
    stylingTipEn: z.string().optional(),
    stylingTipAr: z.string().optional(),
    sizes: z.array(z.string()).optional(),
    sizeDescriptions: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    /** URL-friendly slug (auto-generated from name.en if omitted). */
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
    /** Free-form tags for filtering/search. */
    tags: z.array(z.string()).optional(),
    /** Brand / manufacturer name. */
    vendor: z.string().optional(),
    /** SEO meta title (EN). */
    metaTitleEn: z.string().optional(),
    /** SEO meta title (AR). */
    metaTitleAr: z.string().optional(),
    /** SEO meta description (EN). */
    metaDescriptionEn: z.string().optional(),
    /** SEO meta description (AR). */
    metaDescriptionAr: z.string().optional(),
    /** Product weight for shipping. */
    weight: z.number().positive().optional(),
    /** Weight unit: grams or kilograms. */
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
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
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
    hasDiscount: z.enum(["true", "false"]).optional()
  })
});

export const productStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]) })
});
