import { Schema, model, Types } from "mongoose";

export type RoleStatus = "ACTIVE" | "INACTIVE";

export interface RoleDocument {
  name: string;
  /** Stable key stored on the user & JWT payload (e.g. "ADMIN"). */
  key: string;
  description?: string;
  /** Whether role can be used for new users. */
  status: RoleStatus;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Role = model<RoleDocument>("Role", roleSchema);

export interface PermissionDocument {
  /** Human friendly label, e.g. "View products list & details". */
  name: string;
  /** Stable key, e.g. "products.view". */
  key: string;
  group: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<PermissionDocument>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    group: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Permission = model<PermissionDocument>("Permission", permissionSchema);

export interface RolePermissionDocument {
  roleId: Types.ObjectId;
  permissionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rolePermissionSchema = new Schema<RolePermissionDocument>(
  {
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true, index: true },
    permissionId: { type: Schema.Types.ObjectId, ref: "Permission", required: true, index: true },
  },
  { timestamps: true }
);

rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

export const RolePermission = model<RolePermissionDocument>("RolePermission", rolePermissionSchema);

