/**
 * Migration: Convert product slug from string to LocalizedString { en, ar }.
 * Run once after deploying the slug localization change.
 * Usage: npx tsx scripts/migrate-product-slugs.ts
 */
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db.js";
import { Product } from "../src/models/Product.js";

async function migrate() {
  await connectDatabase();
  const products = await Product.find({}).lean();
  let count = 0;
  for (const p of products) {
    const slug = (p as { slug?: unknown }).slug;
    if (typeof slug === "string" && slug) {
      const name = (p as { name?: { en?: string; ar?: string } }).name;
      const slugify = (t: string) =>
        t
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w\u0600-\u06FF-]+/g, "")
          .replace(/--+/g, "-")
          .replace(/^-+|-+$/g, "");
      const en = slug;
      const ar = slugify(name?.ar || name?.en || "product") || en;
      await Product.updateOne({ _id: p._id }, { $set: { slug: { en, ar } } });
      count++;
      console.log(`Migrated product ${p._id}: slug -> { en: "${en}", ar: "${ar}" }`);
    }
  }
  console.log(`\nMigrated ${count} product(s).`);
  await mongoose.connection.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
