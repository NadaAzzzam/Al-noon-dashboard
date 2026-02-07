import mongoose, { Schema } from "mongoose";

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface SettingsDocument {
  storeName: LocalizedString;
  logo?: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  lowStockThreshold: number;
  updatedAt: Date;
}

const localizedSchema = new Schema({ en: { type: String, default: "" }, ar: { type: String, default: "" } }, { _id: false });

const settingsSchema = new Schema<SettingsDocument>(
  {
    storeName: { type: localizedSchema, default: () => ({ en: "Al-noon", ar: "النون" }) },
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
