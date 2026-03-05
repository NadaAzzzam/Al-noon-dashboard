/**
 * Print current MongoDB database size for Atlas capacity planning.
 * Uses MONGO_URI from server/.env (default: mongodb://127.0.0.1:27017/al-noon-node).
 *
 * Run: npm run db:stats   (from server/) or: npx tsx scripts/db-stats.ts
 */
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db.js";

function bytesToMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

async function main() {
  await connectDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    console.error("No database connection.");
    process.exit(1);
  }

  const stats = await db.stats();
  const dataSize = stats.dataSize ?? 0;
  const storageSize = stats.storageSize ?? 0;
  const indexSize = stats.indexSize ?? 0;

  console.log("\n--- MongoDB database size (for Atlas sizing) ---\n");
  console.log("Database:", db.databaseName);
  console.log("Collections:", stats.collections ?? "—");
  console.log("Documents (approx):", stats.objects ?? "—");
  console.log("");
  console.log("Data size (uncompressed):", formatBytes(dataSize), `(${bytesToMB(dataSize)} MB)`);
  console.log("Index size:             ", formatBytes(indexSize), `(${bytesToMB(indexSize)} MB)`);
  console.log("Storage size (on disk): ", formatBytes(storageSize), `(${bytesToMB(storageSize)} MB)`);
  console.log("");
  const totalMB = bytesToMB(dataSize + indexSize);
  console.log("Total (data + indexes): ", formatBytes(dataSize + indexSize), `(~${totalMB} MB)`);
  console.log("");

  // Atlas free tier is 512 MB; shared M0 is 512 MB; M2 is 2 GB; M5 5 GB; M10 10 GB
  if (totalMB < 400) {
    console.log("Atlas suggestion: M0 (Shared / Free tier, 512 MB) is sufficient.");
  } else if (totalMB < 1.5 * 1024) {
    console.log("Atlas suggestion: M2 (2 GB) or higher.");
  } else if (totalMB < 4 * 1024) {
    console.log("Atlas suggestion: M5 (5 GB) or higher.");
  } else if (totalMB < 9 * 1024) {
    console.log("Atlas suggestion: M10 (10 GB) or higher.");
  } else {
    console.log("Atlas suggestion: Consider M20+ or dedicated cluster based on growth.");
  }
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
