/**
 * Fix Nada's user role: set role from ADMIN to NADA (categories only).
 * Run: npx tsx scripts/fix-nada-role.ts
 */
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";

async function fix() {
  await connectDatabase();
  const result = await User.updateOne(
    { email: "nada@test.com" },
    { $set: { role: "NADA" } }
  );
  if (result.matchedCount === 0) {
    console.log("No user found with email nada@test.com");
  } else {
    console.log("Updated nada@test.com role to NADA");
  }
  await mongoose.disconnect();
  process.exit(0);
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
