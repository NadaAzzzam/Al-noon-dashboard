/**
 * Downloads product/hero seed images into server/seed-images/ so that
 * npm run seed can use local files only (no external image links).
 *
 * Uses Picsum with neutral seeds (no religious intent) for generic
 * placeholder imagery. Run: npm run download-seed-images
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Output filenames (no extension) expected by seedData loadSeedImages(). */
const SEED_IMAGE_KEYS = [
  "abaya1", "abaya2", "cape1", "cape2", "hijab1", "hijab2", "scarf1", "scarf2",
  "fabric1", "fabric2", "dress1", "coat1", "kaftan1", "cardigan1",
  "hero1", "hero2", "hero3", "section1", "section2", "section3",
  "placeholder", "payment-proof"
];

/** Neutral Picsum seeds (no religious connotation) – each maps to a different image. */
const NEUTRAL_SEEDS = [
  "product-01", "product-02", "product-03", "product-04", "product-05", "product-06", "product-07", "product-08",
  "product-09", "product-10", "product-11", "product-12", "product-13", "product-14", "product-15",
  "hero-01", "hero-02", "hero-03", "section-01", "section-02", "section-03",
  "placeholder-img", "payment-doc"
];

const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 800;

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const serverRoot = path.resolve(__dirname, "..");
  const seedImagesDir = path.join(serverRoot, "seed-images");

  if (!fs.existsSync(seedImagesDir)) {
    fs.mkdirSync(seedImagesDir, { recursive: true });
  }

  console.log("Downloading neutral placeholder images to", seedImagesDir, "\n");

  for (let i = 0; i < SEED_IMAGE_KEYS.length; i++) {
    const key = SEED_IMAGE_KEYS[i];
    const picsumSeed = NEUTRAL_SEEDS[i] ?? `img-${i}`;
    const url = `https://picsum.photos/seed/${picsumSeed}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}`;
    const dest = path.join(seedImagesDir, `${key}.jpg`);
    try {
      const buf = await downloadImage(url);
      fs.writeFileSync(dest, buf);
      console.log("  OK", key + ".jpg");
    } catch (err) {
      console.warn("  FAIL", key + ".jpg", err instanceof Error ? err.message : err);
    }
  }

  console.log("\nDone. Run 'npm run seed' to copy these into uploads and seed the database.");
}

main().catch((err) => {
  console.error("Download failed:", err);
  process.exit(1);
});
