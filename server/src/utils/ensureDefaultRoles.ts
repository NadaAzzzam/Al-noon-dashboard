import { isDbConnected } from "../config/db.js";
import { PERMISSIONS } from "../config/permissions.js";
import { Permission, Role, RolePermission } from "../models/Role.js";
import { logger } from "./logger.js";

const DEFAULT_ROLES = [
  {
    key: "ADMIN",
    name: "Administrator",
    description: "Full access to all features.",
    status: "ACTIVE" as const,
    permissionKeys: PERMISSIONS.map((p) => p.key),
  },
  {
    key: "USER",
    name: "Staff",
    description: "Limited staff role. Start with no permissions and grant only what is needed.",
    status: "ACTIVE" as const,
    permissionKeys: [] as string[],
  },
];

export async function ensureDefaultRoles(): Promise<void> {
  if (!isDbConnected()) {
    logger.warn("Skipping default roles initialization because database is not connected");
    return;
  }

  // 1) Ensure permissions table (one row per permission key)
  const existingPermissions = await Permission.find().lean<{ key: string; _id: unknown }[]>();
  const existingByKey = new Map(existingPermissions.map((p) => [p.key, p]));

  for (const def of PERMISSIONS) {
    const current = existingByKey.get(def.key);
    if (!current) {
      await Permission.create({
        key: def.key,
        name: def.label,
        group: def.group,
        description: def.description,
      });
      logger.info({ permissionKey: def.key }, "Created permission");
    } else {
      await Permission.updateOne(
        { _id: current._id },
        {
          $set: {
            name: def.label,
            group: def.group,
            description: def.description,
          },
        }
      );
    }
  }

  const allPermissions = await Permission.find().lean<{ key: string; _id: typeof Permission.prototype._id }[]>();
  const permissionIdByKey = new Map(allPermissions.map((p) => [p.key, p._id]));

  // 2) Ensure roles table
  const rolesByKey = new Map<string, { _id: typeof Role.prototype._id }>();
  for (const def of DEFAULT_ROLES) {
    let role = await Role.findOne({ key: def.key });
    if (!role) {
      role = await Role.create({
        key: def.key,
        name: def.name,
        description: def.description,
        status: def.status,
      });
      logger.info({ roleKey: def.key }, "Created default role");
    } else {
      role.name = def.name;
      role.description = def.description;
      role.status = def.status;
      await role.save();
    }
    rolesByKey.set(def.key, { _id: role._id });
  }

  // 3) Ensure role_permissions table
  for (const def of DEFAULT_ROLES) {
    const roleMeta = rolesByKey.get(def.key);
    if (!roleMeta) continue;
    const roleId = roleMeta._id;

    for (const key of def.permissionKeys) {
      const permId = permissionIdByKey.get(key);
      if (!permId) continue;
      await RolePermission.updateOne(
        { roleId, permissionId: permId },
        { $setOnInsert: { roleId, permissionId: permId } },
        { upsert: true }
      );
    }
  }
}

