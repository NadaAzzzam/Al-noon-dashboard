import mongoose, { Schema } from "mongoose";

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface ProductDocument {
  name: LocalizedString;
  description?: LocalizedString;
  category: mongoose.Types.ObjectId;
  price: number;
  discountPrice?: number;
  images: string[];
  /** Main image for product card/listing (defaults to images[0] if not set). */
  viewImage?: string;
  /** Image shown on hover on product card (defaults to images[1] or images[0] if not set). */
  hoverImage?: string;
  /** Same length as images; imageColors[i] is the color name for images[i]. Empty string = default (all colors). */
  imageColors: string[];
  /** Video paths (uploaded files) or external URLs. Shown alongside images on product detail. */
  videos: string[];
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  /** When true, product appears in "New Arrivals" on the storefront. */
  isNewArrival: boolean;
  sizes: string[];
  /** Optional description per size (e.g. weight range), same length as sizes. */
  sizeDescriptions: string[];
  colors: string[];
  /** Optional "Details" section (e.g. Fabric, Color, Style, Season). */
  details?: LocalizedString;
  /** Optional styling tip for storefront. */
  stylingTip?: LocalizedString;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const localizedSchema = new Schema({ en: { type: String, default: "" }, ar: { type: String, default: "" } }, { _id: false });

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: localizedSchema, required: true },
    description: { type: localizedSchema },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    images: { type: [String], default: [] },
    viewImage: { type: String },
    hoverImage: { type: String },
    imageColors: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    isNewArrival: { type: Boolean, default: false },
    sizes: { type: [String], default: [] },
    sizeDescriptions: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    details: { type: localizedSchema },
    stylingTip: { type: localizedSchema },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

productSchema.index({ deletedAt: 1 });
productSchema.index({ status: 1, deletedAt: 1 });

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
