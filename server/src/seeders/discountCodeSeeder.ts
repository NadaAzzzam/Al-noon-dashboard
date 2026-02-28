/**
 * Discount code seeder for Al-noon dashboard.
 *
 * HOW TO USE:
 *   From server directory:  npm run seed:discount-codes
 *
 * WHAT IT DOES:
 *   - Connects to the DB, upserts sample discount codes.
 *   - SAVE10: 10% off, no minimum
 *   - FLAT50: 50 EGP off, min order 200 EGP
 *   - WELCOME15: 15% off, min order 150 EGP
 */
import { DiscountCode } from "../models/DiscountCode.js";
import { connectDatabase } from "../config/db.js";
import { logger } from "../utils/logger.js";

const SAMPLE_CODES = [
  {
    code: "SAVE10",
    type: "PERCENT" as const,
    value: 10,
    minOrderAmount: undefined,
    validFrom: undefined,
    validUntil: undefined,
    usageLimit: 100,
    enabled: true
  },
  {
    code: "FLAT50",
    type: "FIXED" as const,
    value: 50,
    minOrderAmount: 200,
    validFrom: undefined,
    validUntil: undefined,
    usageLimit: 50,
    enabled: true
  },
  {
    code: "WELCOME15",
    type: "PERCENT" as const,
    value: 15,
    minOrderAmount: 150,
    validFrom: undefined,
    validUntil: undefined,
    usageLimit: 200,
    enabled: true
  }
];

async function seedDiscountCodes() {
  try {
    await connectDatabase();
    logger.info("Starting discount code seeding...");

    for (const doc of SAMPLE_CODES) {
      await DiscountCode.findOneAndUpdate(
        { code: doc.code },
        { $setOnInsert: { ...doc, usedCount: 0 } },
        { upsert: true, new: true }
      );
    }

    logger.info(`Seeded ${SAMPLE_CODES.length} discount codes.`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedDiscountCodes();
