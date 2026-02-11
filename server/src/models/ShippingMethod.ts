import mongoose, { Document, Schema } from 'mongoose';

/** Per-city delivery price. When set, storefront can resolve price by cityId; otherwise use method's default price. */
export interface IShippingMethodCityPrice {
  city: mongoose.Types.ObjectId;
  price: number;
}

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
  /** Default delivery price (EGP). Used when no city match in cityPrices. */
  price: number;
  /** Optional per-city delivery prices. When customer selects a city, use matching entry or fall back to price. */
  cityPrices?: IShippingMethodCityPrice[];
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
    cityPrices: {
      type: [
        {
          city: { type: Schema.Types.ObjectId, ref: 'City', required: true },
          price: { type: Number, required: true, min: 0 },
        },
      ],
      default: undefined,
      _id: false,
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
