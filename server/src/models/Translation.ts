import mongoose, { Document, Schema } from 'mongoose';

export interface ITranslation extends Document {
  key: string; // e.g., "nav.home", "button.add_to_cart"
  en: string;
  ar: string;
  category: 'navigation' | 'button' | 'form' | 'message' | 'validation' | 'page' | 'common';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const translationSchema = new Schema<ITranslation>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    en: {
      type: String,
      required: true,
    },
    ar: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['navigation', 'button', 'form', 'message', 'validation', 'page', 'common'],
      default: 'common',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (key already has unique:true)
translationSchema.index({ category: 1 });

export const Translation = mongoose.model<ITranslation>('Translation', translationSchema);
