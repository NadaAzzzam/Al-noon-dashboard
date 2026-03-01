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
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true, maxlength: 50 },
    comment: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 }
  },
  { timestamps: true }
);

contactSubmissionSchema.index({ createdAt: -1 });

export const ContactSubmission = mongoose.model<ContactSubmissionDocument>(
  "ContactSubmission",
  contactSubmissionSchema
);
