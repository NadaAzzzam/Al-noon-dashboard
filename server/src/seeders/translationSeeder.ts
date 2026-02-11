import { Translation } from '../models/Translation';
import { connectDatabase } from '../config/db';
import { logger } from '../utils/logger';

/**
 * Common translations used in the Al-noon storefront
 * These match the structure of the Angular store's i18n files
 */
const commonTranslations = [
  // Navigation
  { key: 'nav.home', en: 'Home', ar: 'الرئيسية', category: 'navigation' as const, description: 'Homepage navigation link' },
  { key: 'nav.shop', en: 'Shop', ar: 'تسوق', category: 'navigation' as const, description: 'Shop navigation link' },
  { key: 'nav.catalog', en: 'Catalog', ar: 'الكتالوج', category: 'navigation' as const, description: 'Catalog navigation link' },
  { key: 'nav.cart', en: 'Cart', ar: 'السلة', category: 'navigation' as const, description: 'Shopping cart navigation link' },
  { key: 'nav.contact', en: 'Contact', ar: 'اتصل بنا', category: 'navigation' as const, description: 'Contact navigation link' },
  { key: 'nav.login', en: 'Login', ar: 'تسجيل الدخول', category: 'navigation' as const, description: 'Login navigation link' },
  { key: 'nav.register', en: 'Register', ar: 'تسجيل', category: 'navigation' as const, description: 'Register navigation link' },
  { key: 'nav.account', en: 'Account', ar: 'الحساب', category: 'navigation' as const, description: 'Account navigation link' },
  { key: 'nav.orders', en: 'My Orders', ar: 'طلباتي', category: 'navigation' as const, description: 'Orders navigation link' },
  { key: 'nav.logout', en: 'Logout', ar: 'تسجيل الخروج', category: 'navigation' as const, description: 'Logout navigation link' },

  // Buttons
  { key: 'button.add_to_cart', en: 'Add to Cart', ar: 'أضف إلى السلة', category: 'button' as const, description: 'Add to cart button' },
  { key: 'button.buy_now', en: 'Buy Now', ar: 'اشتر الآن', category: 'button' as const, description: 'Buy now button' },
  { key: 'button.checkout', en: 'Checkout', ar: 'الدفع', category: 'button' as const, description: 'Checkout button' },
  { key: 'button.continue_shopping', en: 'Continue Shopping', ar: 'متابعة التسوق', category: 'button' as const, description: 'Continue shopping button' },
  { key: 'button.view_cart', en: 'View Cart', ar: 'عرض السلة', category: 'button' as const, description: 'View cart button' },
  { key: 'button.remove', en: 'Remove', ar: 'إزالة', category: 'button' as const, description: 'Remove button' },
  { key: 'button.update', en: 'Update', ar: 'تحديث', category: 'button' as const, description: 'Update button' },
  { key: 'button.submit', en: 'Submit', ar: 'إرسال', category: 'button' as const, description: 'Submit button' },
  { key: 'button.cancel', en: 'Cancel', ar: 'إلغاء', category: 'button' as const, description: 'Cancel button' },
  { key: 'button.search', en: 'Search', ar: 'بحث', category: 'button' as const, description: 'Search button' },
  { key: 'button.filter', en: 'Filter', ar: 'تصفية', category: 'button' as const, description: 'Filter button' },
  { key: 'button.view_details', en: 'View Details', ar: 'عرض التفاصيل', category: 'button' as const, description: 'View details button' },
  { key: 'button.place_order', en: 'Place Order', ar: 'تأكيد الطلب', category: 'button' as const, description: 'Place order button' },

  // Form labels
  { key: 'form.name', en: 'Name', ar: 'الاسم', category: 'form' as const, description: 'Name field label' },
  { key: 'form.email', en: 'Email', ar: 'البريد الإلكتروني', category: 'form' as const, description: 'Email field label' },
  { key: 'form.password', en: 'Password', ar: 'كلمة المرور', category: 'form' as const, description: 'Password field label' },
  { key: 'form.phone', en: 'Phone', ar: 'الهاتف', category: 'form' as const, description: 'Phone field label' },
  { key: 'form.address', en: 'Address', ar: 'العنوان', category: 'form' as const, description: 'Address field label' },
  { key: 'form.city', en: 'City', ar: 'المدينة', category: 'form' as const, description: 'City field label' },
  { key: 'form.postal_code', en: 'Postal Code', ar: 'الرمز البريدي', category: 'form' as const, description: 'Postal code field label' },
  { key: 'form.message', en: 'Message', ar: 'الرسالة', category: 'form' as const, description: 'Message field label' },
  { key: 'form.quantity', en: 'Quantity', ar: 'الكمية', category: 'form' as const, description: 'Quantity field label' },
  { key: 'form.color', en: 'Color', ar: 'اللون', category: 'form' as const, description: 'Color field label' },
  { key: 'form.size', en: 'Size', ar: 'المقاس', category: 'form' as const, description: 'Size field label' },
  { key: 'form.first_name', en: 'First Name', ar: 'الاسم الأول', category: 'form' as const, description: 'First name field label' },
  { key: 'form.last_name', en: 'Last Name', ar: 'الاسم الأخير', category: 'form' as const, description: 'Last name field label' },

  // Common messages
  { key: 'message.welcome', en: 'Welcome', ar: 'مرحباً', category: 'message' as const, description: 'Welcome message' },
  { key: 'message.loading', en: 'Loading...', ar: 'جاري التحميل...', category: 'message' as const, description: 'Loading message' },
  { key: 'message.no_results', en: 'No results found', ar: 'لا توجد نتائج', category: 'message' as const, description: 'No results message' },
  { key: 'message.error', en: 'An error occurred', ar: 'حدث خطأ', category: 'message' as const, description: 'Generic error message' },
  { key: 'message.success', en: 'Success!', ar: 'تم بنجاح!', category: 'message' as const, description: 'Generic success message' },
  { key: 'message.cart_empty', en: 'Your cart is empty', ar: 'سلتك فارغة', category: 'message' as const, description: 'Empty cart message' },
  { key: 'message.out_of_stock', en: 'Out of Stock', ar: 'نفذ من المخزون', category: 'message' as const, description: 'Out of stock message' },
  { key: 'message.low_stock', en: 'Only {{count}} left', ar: 'فقط {{count}} متبقي', category: 'message' as const, description: 'Low stock message with count' },
  { key: 'message.added_to_cart', en: 'Added to cart', ar: 'تمت الإضافة إلى السلة', category: 'message' as const, description: 'Added to cart success message' },
  { key: 'message.order_placed', en: 'Order placed successfully', ar: 'تم تقديم الطلب بنجاح', category: 'message' as const, description: 'Order placed success message' },

  // Validation messages
  { key: 'validation.required', en: 'This field is required', ar: 'هذا الحقل مطلوب', category: 'validation' as const, description: 'Required field validation' },
  { key: 'validation.invalid_email', en: 'Invalid email address', ar: 'بريد إلكتروني غير صالح', category: 'validation' as const, description: 'Invalid email validation' },
  { key: 'validation.min_length', en: 'Must be at least {{min}} characters', ar: 'يجب أن يكون {{min}} أحرف على الأقل', category: 'validation' as const, description: 'Minimum length validation' },
  { key: 'validation.max_length', en: 'Must be no more than {{max}} characters', ar: 'يجب ألا يتجاوز {{max}} حرفاً', category: 'validation' as const, description: 'Maximum length validation' },
  { key: 'validation.passwords_match', en: 'Passwords must match', ar: 'كلمات المرور يجب أن تتطابق', category: 'validation' as const, description: 'Password match validation' },

  // Page titles
  { key: 'page.home', en: 'Home', ar: 'الرئيسية', category: 'page' as const, description: 'Home page title' },
  { key: 'page.catalog', en: 'Product Catalog', ar: 'كتالوج المنتجات', category: 'page' as const, description: 'Catalog page title' },
  { key: 'page.cart', en: 'Shopping Cart', ar: 'سلة التسوق', category: 'page' as const, description: 'Cart page title' },
  { key: 'page.checkout', en: 'Checkout', ar: 'الدفع', category: 'page' as const, description: 'Checkout page title' },
  { key: 'page.contact', en: 'Contact Us', ar: 'اتصل بنا', category: 'page' as const, description: 'Contact page title' },
  { key: 'page.about', en: 'About Us', ar: 'من نحن', category: 'page' as const, description: 'About page title' },
  { key: 'page.privacy', en: 'Privacy Policy', ar: 'سياسة الخصوصية', category: 'page' as const, description: 'Privacy policy page title' },
  { key: 'page.terms', en: 'Terms & Conditions', ar: 'الشروط والأحكام', category: 'page' as const, description: 'Terms page title' },
  { key: 'page.shipping', en: 'Shipping Policy', ar: 'سياسة الشحن', category: 'page' as const, description: 'Shipping policy page title' },
  { key: 'page.return', en: 'Return Policy', ar: 'سياسة الإرجاع', category: 'page' as const, description: 'Return policy page title' },

  // Common labels
  { key: 'common.price', en: 'Price', ar: 'السعر', category: 'common' as const, description: 'Price label' },
  { key: 'common.total', en: 'Total', ar: 'المجموع', category: 'common' as const, description: 'Total label' },
  { key: 'common.subtotal', en: 'Subtotal', ar: 'المجموع الفرعي', category: 'common' as const, description: 'Subtotal label' },
  { key: 'common.shipping', en: 'Shipping', ar: 'الشحن', category: 'common' as const, description: 'Shipping label' },
  { key: 'common.discount', en: 'Discount', ar: 'الخصم', category: 'common' as const, description: 'Discount label' },
  { key: 'common.new', en: 'New', ar: 'جديد', category: 'common' as const, description: 'New label' },
  { key: 'common.sale', en: 'Sale', ar: 'تخفيض', category: 'common' as const, description: 'Sale label' },
  { key: 'common.popular', en: 'Popular', ar: 'شائع', category: 'common' as const, description: 'Popular label' },
  { key: 'common.featured', en: 'Featured', ar: 'مميز', category: 'common' as const, description: 'Featured label' },
  { key: 'common.all', en: 'All', ar: 'الكل', category: 'common' as const, description: 'All label' },
  { key: 'common.categories', en: 'Categories', ar: 'الفئات', category: 'common' as const, description: 'Categories label' },
  { key: 'common.products', en: 'Products', ar: 'المنتجات', category: 'common' as const, description: 'Products label' },
  { key: 'common.reviews', en: 'Reviews', ar: 'التقييمات', category: 'common' as const, description: 'Reviews label' },
  { key: 'common.rating', en: 'Rating', ar: 'التقييم', category: 'common' as const, description: 'Rating label' },
];

async function seedTranslations() {
  try {
    await connectDatabase();
    logger.info('Starting translation seeding...');

    let created = 0;
    let skipped = 0;

    for (const translation of commonTranslations) {
      const exists = await Translation.findOne({ key: translation.key });

      if (!exists) {
        await Translation.create(translation);
        created++;
        logger.info(`Created translation: ${translation.key}`);
      } else {
        skipped++;
        logger.info(`Skipped existing translation: ${translation.key}`);
      }
    }

    logger.info(`Translation seeding complete! Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error seeding translations');
    process.exit(1);
  }
}

// Run the seeder
seedTranslations();
