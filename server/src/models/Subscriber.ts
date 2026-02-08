import mongoose, { Schema } from "mongoose";

export interface SubscriberDocument {
  email: string;
  createdAt: Date;
}

const subscriberSchema = new Schema<SubscriberDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);

export const Subscriber = mongoose.model<SubscriberDocument>("Subscriber", subscriberSchema);
