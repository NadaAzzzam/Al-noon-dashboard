import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { ensureDefaultRoles } from "./ensureDefaultRoles.js";
import { Role, RolePermission } from "../models/Role.js";
import { Permission } from "../models/Role.js";

async function seedRoles() {
  await connectDatabase();
  await ensureDefaultRoles();

  const roles = await Role.find().lean();
  const permCountByRole = new Map<string, number>();
  for (const r of roles) {
    const count = await RolePermission.countDocuments({ roleId: (r as { _id: unknown })._id });
    permCountByRole.set(String((r as { _id: unknown })._id), count);
  }

  const totalPerms = await Permission.countDocuments();
  console.log(`Seeded ${totalPerms} permissions`);

  console.log("Seeded roles:");
  for (const r of roles) {
    const name = (r as { name?: string }).name ?? "";
    const key = (r as { key?: string }).key ?? "";
    const count = permCountByRole.get(String((r as { _id: unknown })._id)) ?? 0;
    console.log(`- ${name} (${key}): ${count} permissions`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seedRoles().catch((err) => {
  console.error("Seed roles failed:", err);
  process.exit(1);
});

