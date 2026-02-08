import mongoose, { Schema } from "mongoose";

export interface ContactSubmissionDocument {
  name: string;
  email: string;
  phone?: string;
  comment: string;
  createdAt: Date;
}

const contactSubmissionSchema = new Schema<ContactSubmissionDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    comment: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

contactSubmissionSchema.index({ createdAt: -1 });

export const ContactSubmission = mongoose.model<ContactSubmissionDocument>(
  "ContactSubmission",
  contactSubmissionSchema
);
