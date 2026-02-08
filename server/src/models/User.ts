import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "ADMIN" | "USER";

export interface UserDocument {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
    avatar: { type: String, required: false }
  },
  { timestamps: true }
);
userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<UserDocument>("User", userSchema);
