/**
 * Copy local MongoDB database to Atlas (sync current local DB → Atlas).
 *
 * Prerequisites:
 * - Local MongoDB running with your current data.
 * - .env has MONGO_URI pointing to Atlas (target).
 *
 * Optional: set LOCAL_MONGO_URI in .env for source (default: mongodb://127.0.0.1:27017/al-noon-node)
 *
 * Run from server/: npm run db:sync-to-atlas
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const SOURCE_URI = process.env.LOCAL_MONGO_URI?.trim() || "mongodb://127.0.0.1:27017/al-noon-node";
const TARGET_URI = process.env.MONGO_URI?.trim();

if (!TARGET_URI) {
  console.error("MONGO_URI (Atlas) is required in .env as the migration target.");
  process.exit(1);
}

async function main() {
  console.log("Source (local):", SOURCE_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));
  console.log("Target (Atlas):", TARGET_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));
  console.log("");

  const sourceConn = await mongoose.createConnection(SOURCE_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  }).asPromise();

  const targetConn = await mongoose.createConnection(TARGET_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  }).asPromise();

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;
  if (!sourceDb || !targetDb) {
    console.error("Failed to get database instance.");
    process.exit(1);
  }

  const collections = await sourceDb.listCollections().toArray();
  const names = collections
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  if (names.length === 0) {
    console.log("No user collections in source database.");
    await sourceConn.close();
    await targetConn.close();
    process.exit(0);
  }

  console.log(`Copying ${names.length} collections to Atlas...\n`);

  for (const name of names) {
    const docs = await sourceDb.collection(name).find({}).toArray();
    const count = docs.length;
    if (count === 0) {
      try {
        await targetDb.collection(name).drop().catch(() => {});
      } catch {
        // ignore
      }
      // Create empty collection by inserting and removing a placeholder, then drop (or leave empty via createCollection)
      await targetDb.createCollection(name).catch(() => {});
      console.log(`  ${name}: 0 documents (empty collection created)`);
      continue;
    }
    try {
      await targetDb.collection(name).drop().catch(() => {});
    } catch {
      // ignore
    }
    await targetDb.collection(name).insertMany(docs);
    console.log(`  ${name}: ${count} documents`);
  }

  console.log("\nDone. Atlas database is now in sync with your local DB.");
  console.log("Indexes will be created automatically when the app connects with Mongoose.");

  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
