import mongoose, { Schema } from "mongoose";

export interface SettingsDocument {
  storeName: string;
  logo?: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  lowStockThreshold: number;
  updatedAt: Date;
}

const settingsSchema = new Schema<SettingsDocument>(
  {
    storeName: { type: String, default: "Al-noon" },
    logo: { type: String },
    instaPayNumber: { type: String, default: "" },
    paymentMethods: {
      cod: { type: Boolean, default: true },
      instaPay: { type: Boolean, default: true }
    },
    lowStockThreshold: { type: Number, default: 5 }
  },
  { timestamps: true }
);

export const Settings = mongoose.model<SettingsDocument>("Settings", settingsSchema);
