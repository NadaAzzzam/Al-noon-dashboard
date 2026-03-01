import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = string;

export interface UserDocument {
  name: string;
  email: string;
  password: string;
  /** Role key, e.g. "ADMIN", "USER", or any custom role. */
  role: UserRole;
  /** Optional department reference. */
  department?: Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, required: true, default: "USER" },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: false },
    avatar: { type: String, required: false, maxlength: 2000 }
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
