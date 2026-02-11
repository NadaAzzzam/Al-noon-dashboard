/**
 * Product seeder for Al-noon dashboard.
 * Seeds products with a focus on items that have discounts (discountPrice).
 *
 * HOW TO USE:
 *   From server directory:  npm run seed:products-discounts
 *   Ensure categories exist first (e.g. npm run seed) so products can be linked.
 *
 * WHAT IT DOES:
 *   - Connects to the DB, loads seed images/videos, fetches categories.
 *   - Deletes existing products, then inserts products (many with discountPrice).
 *   - Uses same image/video and fill logic as full seed for consistency.
 */
import { connectDatabase } from "../config/db";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { logger } from "../utils/logger";
import { loadSeedImages, getProductGalleryImages, loadSeedVideos } from "../utils/seedData";

const defaultDetails = {
  en: "Quality fabric. Care as per label.",
  ar: "قماش عالي الجودة. العناية حسب البطاقة."
};
const defaultStylingTip = {
  en: "Pair with our hijabs and accessories for a complete look.",
  ar: "زينيها مع حجاباتنا وإكسسواراتنا لمظهر كامل."
};

type CategoryDoc = { _id: unknown; name: { en?: string; ar?: string } };

function fillProduct(
  p: {
    sizes: string[];
    images: string[];
    imageColors?: string[];
    videos?: string[];
  } & Record<string, unknown>
) {
  const images = (p.images as string[]) ?? [];
  return {
    ...p,
    imageColors: (p.imageColors as string[] | undefined) ?? images.map(() => ""),
    sizeDescriptions: (p.sizes as string[]).map(() => ""),
    details: defaultDetails,
    stylingTip: defaultStylingTip,
    viewImage: images[0] ?? "",
    hoverImage: images[1] ?? images[0] ?? "",
    videos: (p.videos as string[]) ?? []
  };
}

async function seedProductsWithDiscounts() {
  try {
    await connectDatabase();
    logger.info("Starting product seeding (products with discounts)...");

    const { IMAGES } = loadSeedImages();
    const localVideoUrl = await loadSeedVideos();
    const productVideos = localVideoUrl ? [localVideoUrl] : [];

    const categories = await Category.find({}).lean();
    if (categories.length === 0) {
      logger.warn("No categories found. Run npm run seed first to create categories.");
      process.exit(1);
    }
    const cat = (en: string) => categories.find((c) => (c.name as { en?: string })?.en === en) as CategoryDoc | undefined;

    const productList: Array<{
      name: { en: string; ar: string };
      description: { en: string; ar: string };
      category: CategoryDoc | undefined;
      price: number;
      discountPrice?: number;
      stock: number;
      status: "ACTIVE";
      isNewArrival?: boolean;
      sizes: string[];
      colors: string[];
      imageColors?: string[];
    }> = [
      // Products WITH discounts (discountPrice = original price, price = sale price)
      {
        name: { en: "Black Zip-Front Abaya", ar: "عباية سوداء زود أمامي" },
        description: { en: "Black zip-front abaya, versatile and modern.", ar: "عباية سوداء زود أمامي، عصرية ومتعددة الاستخدام." },
        category: cat("Abayas"),
        price: 1400,
        discountPrice: 2000,
        stock: 8,
        status: "ACTIVE",
        isNewArrival: false,
        sizes: ["S", "M", "L"],
        colors: ["Black"]
      },
      {
        name: { en: "Velvet Chemise Abaya", ar: "عباية مخمل شيميز" },
        description: { en: "Luxurious velvet chemise-style abaya.", ar: "عباية مخملية على طراز الشيميز." },
        category: cat("Abayas"),
        price: 1050,
        discountPrice: 2100,
        stock: 10,
        status: "ACTIVE",
        isNewArrival: false,
        sizes: ["M", "L"],
        colors: ["Black", "Burgundy", "Navy"]
      },
      {
        name: { en: "Wool Cape", ar: "كاب صوف" },
        description: { en: "Warm wool cape, essential for modest wardrobe.", ar: "كاب صوف دافئ، أساسي للخزانة المحتشمة." },
        category: cat("Capes"),
        price: 950,
        discountPrice: 1900,
        stock: 14,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["One Size"],
        colors: ["Black", "Grey", "Camel"]
      },
      {
        name: { en: "Cape Hasna", ar: "كاب حَسَناء" },
        description: { en: "Elegant cape with clean lines.", ar: "كاب أنيق بخطوط نظيفة." },
        category: cat("Capes"),
        price: 2000,
        discountPrice: 2500,
        stock: 6,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["One Size"],
        colors: ["Black", "Navy"]
      },
      {
        name: { en: "Black Ribbed Twin Set – Abaya & Cardigan", ar: "توأم ريب أسود – عباية وكارديجان" },
        description: { en: "Matching abaya and cardigan set.", ar: "ست عباية وكارديجان متطابقين." },
        category: cat("Sets"),
        price: 1450,
        discountPrice: 2900,
        stock: 9,
        status: "ACTIVE",
        sizes: ["S", "M", "L"],
        colors: ["Black"]
      },
      {
        name: { en: "Ribbed Kaftan", ar: "كافتان ريب" },
        description: { en: "Comfortable ribbed kaftan, easy to layer.", ar: "كافتان ريب مريح، سهل الطبقات." },
        category: cat("Sets"),
        price: 900,
        discountPrice: 1500,
        stock: 11,
        status: "ACTIVE",
        sizes: ["S", "M", "L"],
        colors: ["Black", "Navy", "Grey"]
      },
      {
        name: { en: "Velvet Pleated Cardigan", ar: "كارديجان مخمل بليت" },
        description: { en: "Velvet pleated cardigan for layering.", ar: "كارديجان مخمل بليت للطبقات." },
        category: cat("Cardigans & Coats"),
        price: 1760,
        discountPrice: 2200,
        stock: 5,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["S", "M", "L"],
        colors: ["Black", "Burgundy"]
      },
      {
        name: { en: "Wool Coat", ar: "معطف صوف" },
        description: { en: "Warm wool coat for winter.", ar: "معطف صوف دافئ للشتاء." },
        category: cat("Cardigans & Coats"),
        price: 1080,
        discountPrice: 2700,
        stock: 4,
        status: "ACTIVE",
        sizes: ["S", "M", "L"],
        colors: ["Black", "Camel", "Grey"]
      },
      {
        name: { en: "Embroidered Malhafa – Sale", ar: "ملحفة مطرزة – عرض" },
        description: { en: "Malhafa with subtle embroidery. Limited time offer.", ar: "ملحفة بتطريز خفيف. عرض لفترة محدودة." },
        category: cat("Malhafa"),
        price: 999,
        discountPrice: 1200,
        stock: 7,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["One Size"],
        colors: ["Black", "Burgundy"]
      },
      {
        name: { en: "Chiffon Hijab – Summer Sale", ar: "حجاب شيفون – عرض الصيف" },
        description: { en: "Light chiffon hijab for summer. Special price.", ar: "حجاب شيفون خفيف للصيف. سعر خاص." },
        category: cat("Hijab"),
        price: 75,
        discountPrice: 95,
        stock: 40,
        status: "ACTIVE",
        sizes: ["One Size"],
        colors: ["Black", "White", "Nude", "Pink", "Blue"]
      },
      // One product without discount for variety
      {
        name: { en: "Zipped Hooded Abaya", ar: "عباية زود هود" },
        description: { en: "Classic zipped abaya with hood. Comfortable and modest.", ar: "عباية كلاسيكية بزود وهود. مريحة ومحتشمة." },
        category: cat("Abayas"),
        price: 2100,
        stock: 15,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Navy", "Brown"]
      }
    ];

    const validProducts = productList.filter((p) => p.category);
    if (validProducts.length < productList.length) {
      logger.warn(`Skipped ${productList.length - validProducts.length} products (category not found). Ensure categories match: Abayas, Capes, Malhafa, Hijab, Sets, Cardigans & Coats.`);
    }

    await Product.deleteMany({});
    const productsData = validProducts.map((p, i) => {
      const images = getProductGalleryImages(IMAGES, i);
      return fillProduct({ ...p, images, videos: productVideos });
    });
    const products = await Product.insertMany(productsData);

    const withDiscount = validProducts.filter((p) => p.discountPrice != null).length;
    logger.info(`Created ${products.length} products (${withDiscount} with discounts).`);
    logger.info("Product seeding complete!");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Error seeding products");
    process.exit(1);
  }
}

seedProductsWithDiscounts();
