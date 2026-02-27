import { Schema, model } from "mongoose";

export interface DepartmentDocument {
  name: string;
  /** Stable key, e.g. "MARKETING", "ADMIN". */
  key: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<DepartmentDocument>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Department = model<DepartmentDocument>("Department", departmentSchema);
