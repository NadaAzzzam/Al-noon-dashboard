import { ShippingMethod } from '../models/ShippingMethod';
import { connectDatabase } from '../config/db';
import { logger } from '../utils/logger';

/**
 * Default shipping methods for Al-noon store
 */
const defaultShippingMethods = [
  {
    name: {
      en: 'Standard Shipping',
      ar: 'الشحن العادي',
    },
    description: {
      en: 'Delivery within 3-5 business days',
      ar: 'التوصيل خلال 3-5 أيام عمل',
    },
    estimatedDays: {
      min: 3,
      max: 5,
    },
    price: 0, // Free standard shipping
    enabled: true,
    order: 1,
  },
  {
    name: {
      en: 'Express Shipping',
      ar: 'الشحن السريع',
    },
    description: {
      en: 'Fast delivery within 1-2 business days',
      ar: 'التوصيل السريع خلال 1-2 يوم عمل',
    },
    estimatedDays: {
      min: 1,
      max: 2,
    },
    price: 50, // 50 EGP for express shipping
    enabled: true,
    order: 2,
  },
];

async function seedShippingMethods() {
  try {
    await connectDatabase();
    logger.info('Starting shipping method seeding...');

    // Clear existing shipping methods
    const count = await ShippingMethod.countDocuments();
    if (count > 0) {
      logger.info(`Found ${count} existing shipping methods. Clearing...`);
      await ShippingMethod.deleteMany({});
    }

    // Create new shipping methods
    const created = await ShippingMethod.insertMany(defaultShippingMethods);
    logger.info(`Created ${created.length} shipping methods`);

    logger.info('Shipping method seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding shipping methods:', error);
    process.exit(1);
  }
}

// Run the seeder
seedShippingMethods();
