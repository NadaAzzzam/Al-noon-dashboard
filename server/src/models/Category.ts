import mongoose, { Schema } from "mongoose";

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface CategoryDocument {
  name: LocalizedString;
  description?: LocalizedString;
  status: "visible" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const localizedSchema = new Schema({ en: { type: String, default: "" }, ar: { type: String, default: "" } }, { _id: false });

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: localizedSchema, required: true },
    description: { type: localizedSchema },
    status: { type: String, enum: ["visible", "hidden"], default: "visible" }
  },
  { timestamps: true }
);

export const Category = mongoose.model<CategoryDocument>("Category", categorySchema);
