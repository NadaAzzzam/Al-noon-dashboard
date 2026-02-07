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
  /** Same length as images; imageColors[i] is the color name for images[i]. Empty string = default (all colors). */
  imageColors: string[];
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  sizes: string[];
  /** Optional description per size (e.g. weight range), same length as sizes. */
  sizeDescriptions: string[];
  colors: string[];
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
    imageColors: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    sizes: { type: [String], default: [] },
    sizeDescriptions: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

productSchema.index({ deletedAt: 1 });
productSchema.index({ status: 1, deletedAt: 1 });

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
