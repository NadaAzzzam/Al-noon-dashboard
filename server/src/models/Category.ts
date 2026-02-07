import mongoose, { Schema } from "mongoose";

export interface CategoryDocument {
  name: string;
  description?: string;
  status: "visible" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["visible", "hidden"], default: "visible" }
  },
  { timestamps: true }
);

export const Category = mongoose.model<CategoryDocument>("Category", categorySchema);
