import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ensureDefaultRoles } from "../utils/ensureDefaultRoles.js";
import { ensureDefaultDepartments } from "../utils/ensureDefaultDepartments.js";
import { User } from "../models/User.js";

let mongod: MongoMemoryServer | null = null;

export async function startTestDb(): Promise<string> {
  if (mongod && mongoose.connection.readyState === 1) {
    return mongod.getUri();
  }
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) return uri;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await ensureDefaultRoles();
  await ensureDefaultDepartments();
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@localhost";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const adminName = process.env.ADMIN_NAME ?? "Admin";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "ADMIN",
    });
  } else {
    existing.role = "ADMIN";
    await existing.save();
  }
  return uri;
}

export async function stopTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
