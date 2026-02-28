import mongoose, { Schema } from "mongoose";

export interface LocalizedString {
  en: string;
  ar: string;
}

/** Variant inventory tracking for specific color/size combinations. */
export interface VariantInventory {
  color?: string;
  size?: string;
  stock: number;
  /** When true, this variant is marked as out of stock (overrides stock number). */
  outOfStock?: boolean;
  /** Stock Keeping Unit for this variant (e.g. ABY-BLK-S). */
  sku?: string;
  /** Barcode (EAN/UPC) for this variant. */
  barcode?: string;
}

export interface ProductDocument {
  name: LocalizedString;
  description?: LocalizedString;
  category: mongoose.Types.ObjectId;
  /** URL-friendly slugs per locale (auto-generated from name if not provided). slug.en and slug.ar must be unique. */
  slug: LocalizedString;
  /** Free-form tags for filtering, search, and grouping (e.g. ["summer", "bestseller"]). */
  tags: string[];
  /** Brand or manufacturer name (e.g. "Al-noon Originals"). */
  vendor: string;
  price: number;
  discountPrice?: number;
  /** Cost per item for profit margin calculations. Not shown to customers. */
  costPerItem?: number;
  images: string[];
  /** Main image for product card/listing (defaults to images[0] if not set). */
  viewImage?: string;
  /** Image shown on hover on product card (defaults to images[1] or images[0] if not set). */
  hoverImage?: string;
  /** Same length as images; imageColors[i] is the color name for images[i]. Empty string = default (all colors). */
  imageColors: string[];
  /** Video paths (uploaded files) or external URLs. Shown alongside images on product detail. */
  videos: string[];
  /** Preferred media type for default display on product cards. If "video", first video is used; if "image" (default), first image is used. */
  defaultMediaType: "image" | "video";
  /** Preferred media type for hover display on product cards. If "video", uses video; if "image" (default), uses second image or first image. */
  hoverMediaType: "image" | "video";
  stock: number;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  /** When true, product appears in "New Arrivals" on the storefront. */
  isNewArrival: boolean;
  sizes: string[];
  /** Optional description per size (e.g. weight range), same length as sizes. */
  sizeDescriptions: string[];
  colors: string[];
  /** Variant-specific inventory tracking (color/size combinations). If empty, use global stock field. */
  variants: VariantInventory[];
  /** Optional "Details" section - supports rich text formatting (titles, paragraphs, lists) like Shopify. */
  details?: LocalizedString;
  /** Optional styling tip for storefront. */
  stylingTip?: LocalizedString;
  /** SEO meta title override (falls back to product name if empty). */
  metaTitle?: LocalizedString;
  /** SEO meta description override (falls back to product description if empty). */
  metaDescription?: LocalizedString;
  /** Product weight for shipping calculation. */
  weight?: number;
  /** Weight unit: grams or kilograms. */
  weightUnit?: "g" | "kg";
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const localizedSchema = new Schema({ en: { type: String, default: "" }, ar: { type: String, default: "" } }, { _id: false });

const variantInventorySchema = new Schema({
  color: { type: String },
  size: { type: String },
  stock: { type: Number, required: true, default: 0 },
  outOfStock: { type: Boolean, default: false },
  sku: { type: String },
  barcode: { type: String }
}, { _id: false });

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: localizedSchema, required: true },
    description: { type: localizedSchema },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    slug: { type: localizedSchema },
    tags: { type: [String], default: [] },
    vendor: { type: String, default: "" },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    costPerItem: { type: Number },
    images: { type: [String], default: [] },
    viewImage: { type: String },
    hoverImage: { type: String },
    imageColors: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    defaultMediaType: { type: String, enum: ["image", "video"], default: "image" },
    hoverMediaType: { type: String, enum: ["image", "video"], default: "image" },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "DRAFT"], default: "ACTIVE" },
    isNewArrival: { type: Boolean, default: false },
    sizes: { type: [String], default: [] },
    sizeDescriptions: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    variants: { type: [variantInventorySchema], default: [] },
    details: { type: localizedSchema },
    stylingTip: { type: localizedSchema },
    metaTitle: { type: localizedSchema },
    metaDescription: { type: localizedSchema },
    weight: { type: Number },
    weightUnit: { type: String, enum: ["g", "kg"], default: "g" },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

productSchema.index({ deletedAt: 1 });
productSchema.index({ status: 1, deletedAt: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ "slug.en": 1 }, { unique: true, sparse: true });
productSchema.index({ "slug.ar": 1 }, { unique: true, sparse: true });

/** Generate a URL-friendly slug from a string. */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Auto-generate slug.en and slug.ar from name before saving if not already set. */
productSchema.pre("save", async function (next) {
  const slugObj = this.slug as { en?: string; ar?: string } | string | undefined;
  const hasSlug = slugObj && (typeof slugObj === "string"
    ? slugObj.length > 0
    : ((slugObj.en?.length ?? 0) > 0 || (slugObj.ar?.length ?? 0) > 0));
  if (hasSlug) {
    if (typeof slugObj === "string") {
      this.slug = { en: slugObj, ar: slugify(this.name?.ar || this.name?.en || "product") || slugObj };
    }
    return next();
  }

  const baseEn = slugify(this.name?.en || "product");
  const baseAr = slugify(this.name?.ar || this.name?.en || "product");
  let candidateEn = baseEn;
  let candidateAr = baseAr || baseEn;
  let counter = 1;
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const doc = this;
  const Model = doc.constructor as typeof Product;
  while (true) {
    const existing = await Model.findOne({
      _id: { $ne: doc._id },
      $or: [{ "slug.en": candidateEn }, { "slug.ar": candidateAr }],
    });
    if (!existing) break;
    counter++;
    candidateEn = `${baseEn}-${counter}`;
    candidateAr = (baseAr || baseEn) ? `${(baseAr || baseEn)}-${counter}` : candidateEn;
  }
  this.slug = { en: candidateEn, ar: candidateAr };
  next();
});

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
