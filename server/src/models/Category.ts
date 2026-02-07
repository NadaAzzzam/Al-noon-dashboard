import mongoose, { Schema } from "mongoose";

export interface CategoryDocument {
  name: string;
  description?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    isVisible: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Category = mongoose.model<CategoryDocument>("Category", categorySchema);
