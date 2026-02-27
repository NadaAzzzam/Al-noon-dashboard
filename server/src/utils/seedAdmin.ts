import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";
import { ensureDefaultRoles } from "./ensureDefaultRoles.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

async function seedAdmin() {
  await connectDatabase();

  // Ensure core roles & permissions exist before creating admin user
  await ensureDefaultRoles();

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    existing.role = "ADMIN";
    if (ADMIN_NAME) existing.name = ADMIN_NAME;
    if (ADMIN_PASSWORD) existing.password = ADMIN_PASSWORD;
    await existing.save();
    console.log(`Promoted existing user to ADMIN: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "ADMIN"
    });
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
