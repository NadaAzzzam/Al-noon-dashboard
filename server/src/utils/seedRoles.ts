import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { ensureDefaultRoles } from "./ensureDefaultRoles.js";
import { Role } from "../models/Role.js";

async function seedRoles() {
  await connectDatabase();
  await ensureDefaultRoles();

  const roles = await Role.find().lean();
  console.log("Seeded roles:");
  for (const r of roles) {
    const name = (r as { name?: string }).name ?? "";
    const key = (r as { key?: string }).key ?? "";
    const permissions = (r as { permissions?: string[] }).permissions ?? [];
    console.log(`- ${name} (${key}): ${permissions.length} permissions`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seedRoles().catch((err) => {
  console.error("Seed roles failed:", err);
  process.exit(1);
});

