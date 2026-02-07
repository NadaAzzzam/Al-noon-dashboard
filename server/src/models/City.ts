import mongoose, { Schema } from "mongoose";

export interface CityDocument {
  name: string;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<CityDocument>(
  {
    name: { type: String, required: true, trim: true },
    deliveryFee: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

citySchema.index({ name: 1 }, { unique: true });

export const City = mongoose.model<CityDocument>("City", citySchema);
