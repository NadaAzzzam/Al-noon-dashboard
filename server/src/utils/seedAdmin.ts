import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";

const seedAdmin = async () => {
  await connectDatabase();

  const email = process.env.ADMIN_EMAIL ?? "Admin";
  const password = process.env.ADMIN_PASSWORD ?? "password";
  const name = process.env.ADMIN_NAME ?? "Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "ADMIN") {
      existing.role = "ADMIN";
      await existing.save();
    }
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({ name, email, password, role: "ADMIN" });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.connection.close();
};

seedAdmin().catch((error) => {
  console.error(error);
  mongoose.connection.close().catch(() => undefined);
  process.exit(1);
});
