import mongoose, { Schema } from "mongoose";

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface CityDocument {
  name: LocalizedString;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
}

const localizedSchema = new Schema({ en: { type: String, default: "" }, ar: { type: String, default: "" } }, { _id: false });

const citySchema = new Schema<CityDocument>(
  {
    name: { type: localizedSchema, required: true },
    deliveryFee: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

citySchema.index({ "name.en": 1 }, { unique: true });

export const City = mongoose.model<CityDocument>("City", citySchema);
