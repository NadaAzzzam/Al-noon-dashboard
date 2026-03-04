import mongoose, { Schema, Types } from "mongoose";

export interface PasswordResetDocument {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const passwordResetSchema = new Schema<PasswordResetDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

passwordResetSchema.index({ token: 1 }, { unique: true });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.model<PasswordResetDocument>("PasswordReset", passwordResetSchema);
