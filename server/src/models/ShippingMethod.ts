import mongoose, { Document, Schema } from 'mongoose';

export interface IShippingMethod extends Document {
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  estimatedDays: {
    min: number;
    max: number;
  };
  price: number;
  enabled: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const shippingMethodSchema = new Schema<IShippingMethod>(
  {
    name: {
      en: {
        type: String,
        required: true,
        trim: true,
      },
      ar: {
        type: String,
        required: true,
        trim: true,
      },
    },
    description: {
      en: {
        type: String,
        required: true,
      },
      ar: {
        type: String,
        required: true,
      },
    },
    estimatedDays: {
      min: {
        type: Number,
        required: true,
        min: 1,
      },
      max: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for ordering
shippingMethodSchema.index({ order: 1 });

export const ShippingMethod = mongoose.model<IShippingMethod>('ShippingMethod', shippingMethodSchema);
