import mongoose, { Schema } from "mongoose";

export interface SubscriberDocument {
  email: string;
  createdAt: Date;
}

const subscriberSchema = new Schema<SubscriberDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);
subscriberSchema.index({ email: 1 }, { unique: true });

export const Subscriber = mongoose.model<SubscriberDocument>("Subscriber", subscriberSchema);
