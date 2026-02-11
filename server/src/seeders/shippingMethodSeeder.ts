/**
 * Shipping methods seeder for Al-noon dashboard.
 *
 * HOW TO USE:
 *   From server directory:  npm run seed:shipping
 *   Ensure cities exist first (e.g. npm run seed) so delivery prices can be linked per city.
 *
 * WHAT IT DOES:
 *   - Connects to the DB, fetches cities, deletes existing shipping methods, then inserts methods.
 *   - Methods that have delivery prices are connected to cities via cityPrices (city ref + price).
 *   - Storefront: GET /api/shipping-methods?cityId=xxx returns methods with price resolved for that city.
 *
 * HOW THE API USES IT:
 *   - Storefront: GET /api/shipping-methods (optional ?cityId=) → price from cityPrices or default price.
 *   - Admin: full CRUD; cityPrices editable in body.
 */
import { ShippingMethod } from '../models/ShippingMethod';
import { City } from '../models/City';
import { connectDatabase } from '../config/db';
import { logger } from '../utils/logger';

async function seedShippingMethods() {
  try {
    await connectDatabase();
    logger.info('Starting shipping method seeding...');

    const cities = await City.find({}).select('_id name deliveryFee').lean();
    const byName = (en: string) => cities.find((c) => (c.name as { en?: string })?.en === en);
    const cairo = byName('Cairo');
    const giza = byName('Giza');
    const alexandria = byName('Alexandria');

    const defaultShippingMethods: Array<Record<string, unknown>> = [
      {
        name: { en: 'Standard Shipping', ar: 'الشحن العادي' },
        description: {
          en: 'Delivery within 3-5 business days',
          ar: 'التوصيل خلال 3-5 أيام عمل',
        },
        estimatedDays: { min: 3, max: 5 },
        price: 0,
        cityPrices: cities.map((c) => ({ city: c._id, price: (c.deliveryFee as number) ?? 0 })),
        enabled: true,
        order: 1,
      },
      {
        name: { en: 'Express Shipping', ar: 'الشحن السريع' },
        description: {
          en: 'Fast delivery within 1-2 business days',
          ar: 'التوصيل السريع خلال 1-2 يوم عمل',
        },
        estimatedDays: { min: 1, max: 2 },
        price: 50,
        cityPrices: cities.map((c) => ({ city: c._id, price: ((c.deliveryFee as number) ?? 0) + 15 })),
        enabled: true,
        order: 2,
      },
      {
        name: { en: 'Free shipping over 500 EGP', ar: 'شحن مجاني للطلبات فوق 500 جنيه' },
        description: {
          en: 'Free delivery on orders 500 EGP and above. 4-7 business days.',
          ar: 'توصيل مجاني للطلبات 500 جنيه فأكثر. خلال 4-7 أيام عمل.',
        },
        estimatedDays: { min: 4, max: 7 },
        price: 0,
        enabled: true,
        order: 3,
      },
      {
        name: { en: 'Same-day Cairo', ar: 'نفس اليوم - القاهرة' },
        description: {
          en: 'Order before 12 PM for same-day delivery in Cairo (selected areas).',
          ar: 'اطلبي قبل 12 ظهراً للتوصيل في نفس اليوم داخل القاهرة (مناطق محددة).',
        },
        estimatedDays: { min: 1, max: 1 },
        price: 80,
        cityPrices: cairo ? [{ city: cairo._id, price: 80 }] : [],
        enabled: true,
        order: 4,
      },
      {
        name: { en: 'Store Pickup', ar: 'الاستلام من المتجر' },
        description: {
          en: 'Pick up your order from our store. Ready within 24-48 hours.',
          ar: 'استلمي طلبك من المتجر. جاهز خلال 24-48 ساعة.',
        },
        estimatedDays: { min: 1, max: 2 },
        price: 0,
        enabled: true,
        order: 5,
      },
      {
        name: { en: 'Heavy/Bulk Orders', ar: 'الشحن للطلبات الكبيرة' },
        description: {
          en: 'For orders over 5 kg or multiple items. 5-10 business days.',
          ar: 'للطلبات فوق 5 كجم أو الطلبات المتعددة. 5-10 أيام عمل.',
        },
        estimatedDays: { min: 5, max: 10 },
        price: 75,
        cityPrices: cities.map((c) => ({ city: c._id, price: ((c.deliveryFee as number) ?? 0) + 40 })),
        enabled: true,
        order: 6,
      },
      {
        name: { en: 'Giza & 6th October', ar: 'الجيزة ومدينة 6 أكتوبر' },
        description: {
          en: 'Dedicated delivery to Giza and 6th October. 2-4 business days.',
          ar: 'توصيل مخصص للجيزة ومدينة 6 أكتوبر. 2-4 أيام عمل.',
        },
        estimatedDays: { min: 2, max: 4 },
        price: 35,
        cityPrices: giza ? [{ city: giza._id, price: 35 }] : [],
        enabled: true,
        order: 7,
      },
      {
        name: { en: 'Alexandria', ar: 'الإسكندرية' },
        description: {
          en: 'Delivery to Alexandria governorate. 3-5 business days.',
          ar: 'التوصيل لمحافظة الإسكندرية. 3-5 أيام عمل.',
        },
        estimatedDays: { min: 3, max: 5 },
        price: 60,
        cityPrices: alexandria ? [{ city: alexandria._id, price: 60 }] : [],
        enabled: true,
        order: 8,
      },
      {
        name: { en: 'Other Governorates', ar: 'باقي المحافظات' },
        description: {
          en: 'Delivery to all other Egyptian governorates. 5-10 business days.',
          ar: 'التوصيل لباقي محافظات مصر. 5-10 أيام عمل.',
        },
        estimatedDays: { min: 5, max: 10 },
        price: 90,
        cityPrices: cities.map((c) => ({ city: c._id, price: (c.deliveryFee as number) ?? 90 })),
        enabled: true,
        order: 9,
      },
    ];

    const count = await ShippingMethod.countDocuments();
    if (count > 0) {
      logger.info(`Found ${count} existing shipping methods. Clearing...`);
      await ShippingMethod.deleteMany({});
    }

    const created = await ShippingMethod.insertMany(defaultShippingMethods);
    logger.info(`Created ${created.length} shipping methods (with cityPrices where delivery price applies)`);
    if (cities.length === 0) logger.info('No cities in DB – run npm run seed first to link delivery prices by city.');

    logger.info('Shipping method seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error seeding shipping methods');
    process.exit(1);
  }
}

// Run the seeder
seedShippingMethods();
