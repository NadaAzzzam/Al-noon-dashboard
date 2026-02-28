/**
 * Product seeder for Al-noon dashboard.
 * Seeds products with a focus on items that have discounts (discountPrice).
 * Covers all inventory cases: no variants (estimated), variants with some colors/sizes out of stock.
 *
 * HOW TO USE:
 *   From server directory:  npm run seed:products-discounts
 *   Ensure categories exist first (e.g. npm run seed) so products can be linked.
 *
 * WHAT IT DOES:
 *   - Connects to the DB, loads seed images/videos, fetches categories.
 *   - Deletes existing products, then inserts products (many with discountPrice).
 *   - Sets defaultMediaType / hoverMediaType (one product uses video as default for cards).
 *   - Sets costPerItem for margin demo (auto-calculated or explicit per product).
 *   - Uses same image/video and fill logic as full seed for consistency.
 *   - Variant cases: no variants (API estimated); all in stock; one color out; one size out; one variant out; mixed; fully out.
 */
import { connectDatabase } from "../config/db";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import type { VariantInventory } from "../models/Product";
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

import { buildSeoMeta } from "../utils/buildSeoMeta";

/** Vendors/brands used in seed data. */
const VENDORS = ["Al-noon Originals", "Nada Collection", "Silk & Velvet Co."];

/** Tags pool for seed data. */
const TAG_POOL = ["summer", "winter", "new-collection", "bestseller", "modest", "casual", "elegant", "sale", "limited-edition"];

type CategoryDoc = { _id: unknown; name: { en?: string; ar?: string } };

/** Build variants for every color×size. Optionally mark entire colors, sizes, or specific pairs as out of stock. */
function buildVariants(
  sizes: string[],
  colors: string[],
  stockPerVariant: number,
  options?: {
    outOfStockColors?: string[];
    outOfStockSizes?: string[];
    /** Specific [color, size] pairs to mark out of stock. */
    outOfStockPairs?: [string, string][];
  }
): VariantInventory[] {
  const outColors = new Set((options?.outOfStockColors ?? []).map((c) => c.toLowerCase().trim()));
  const outSizes = new Set((options?.outOfStockSizes ?? []).map((s) => s.toLowerCase().trim()));
  const outPairs = new Set(
    (options?.outOfStockPairs ?? []).map(([c, s]) => `${c.toLowerCase().trim()}:${s.toLowerCase().trim()}`)
  );
  const allOut = stockPerVariant <= 0;
  const variants: VariantInventory[] = [];
  for (const color of colors) {
    for (const size of sizes) {
      const key = `${color.toLowerCase().trim()}:${size.toLowerCase().trim()}`;
      const isOut =
        allOut ||
        outColors.has(color.toLowerCase().trim()) ||
        outSizes.has(size.toLowerCase().trim()) ||
        outPairs.has(key);
      const skuColor = color.substring(0, 3).toUpperCase();
      const skuSize = size.replace(/\s+/g, "").toUpperCase();
      variants.push({
        color,
        size,
        stock: isOut ? 0 : stockPerVariant,
        outOfStock: isOut,
        sku: `${skuColor}-${skuSize}-${String(variants.length + 1).padStart(3, "0")}`,
        barcode: `600${String(Math.floor(Math.random() * 9999999999)).padStart(10, "0")}`
      });
    }
  }
  return variants;
}

function fillProduct(
  p: {
    sizes: string[];
    images: string[];
    imageColors?: string[];
    videos?: string[];
    variants?: VariantInventory[];
    /** Override default media on product cards (e.g. "video" when product has videos). */
    defaultMediaType?: "image" | "video";
    hoverMediaType?: "image" | "video";
    /** Cost per item for margin calculation (optional). */
    costPerItem?: number;
  } & Record<string, unknown>,
  index: number
) {
  const images = (p.images as string[]) ?? [];
  const variants = (p.variants as VariantInventory[] | undefined) ?? [];
  const videos = (p.videos as string[]) ?? [];
  const stock =
    variants.length > 0 ? variants.reduce((sum, v) => sum + (v.outOfStock ? 0 : v.stock), 0) : (p.stock as number);
  const nameEn = ((p.name as { en: string })?.en ?? "product").toLowerCase().trim();
  const slugifySeed = (t: string) => t.replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "");
  const nameAr = ((p.name as { ar?: string })?.ar ?? nameEn).toLowerCase().trim();
  const slug = {
    en: slugifySeed(nameEn) || "product",
    ar: slugifySeed(nameAr) || slugifySeed(nameEn) || "product",
  };
  // Pick tags: 2-4 random tags from the pool
  const numTags = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...TAG_POOL].sort(() => Math.random() - 0.5);
  const tags = shuffled.slice(0, numTags);
  // Pick vendor round-robin
  const vendor = VENDORS[index % VENDORS.length];
  // Weight: random between 150-800g
  const weight = 150 + Math.floor(Math.random() * 650);
  // defaultMediaType / hoverMediaType: use override or "image"; use "video" only when product has videos
  const hasVideos = videos.length > 0;
  const defaultMediaType = (p.defaultMediaType as "image" | "video" | undefined) ?? (hasVideos && index % 4 === 0 ? "video" : "image");
  const hoverMediaType = (p.hoverMediaType as "image" | "video" | undefined) ?? "image";
  // costPerItem: use override or, for products with price, set to ~55–70% of price for margin demo
  const price = (p.price as number) ?? 0;
  const costPerItem = (p.costPerItem as number | undefined) ?? (price > 0 ? Math.round(price * (0.55 + Math.random() * 0.15)) : undefined);

  return {
    ...p,
    stock,
    variants,
    imageColors: (p.imageColors as string[] | undefined) ?? images.map(() => ""),
    sizeDescriptions: (p.sizes as string[]).map(() => ""),
    details: defaultDetails,
    stylingTip: defaultStylingTip,
    viewImage: images[0] ?? "",
    hoverImage: images[1] ?? images[0] ?? "",
    videos,
    defaultMediaType,
    hoverMediaType,
    costPerItem,
    slug,
    tags,
    vendor,
    weight,
    weightUnit: "g",
    ...buildSeoMeta(
      (p.name as { en: string; ar: string }) ?? { en: "product", ar: "منتج" },
      (p.description as { en: string; ar: string }) ?? { en: "", ar: "" }
    )
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

    /** discountPrice = price * (1 - discountPercent/100). Keeps Discount (%) in admin form as round values. */
    const withDiscount = (price: number, discountPercent: number) => ({ price, discountPrice: Math.round(price * (1 - discountPercent / 100)) });

    type VariantOptions = {
      stockPerVariant: number;
      outOfStockColors?: string[];
      outOfStockSizes?: string[];
      outOfStockPairs?: [string, string][];
    };

    const productList: Array<{
      name: { en: string; ar: string };
      description: { en: string; ar: string };
      category: CategoryDoc | undefined;
      price: number;
      discountPrice?: number;
      costPerItem?: number;
      stock: number;
      status: "ACTIVE";
      isNewArrival?: boolean;
      sizes: string[];
      colors: string[];
      imageColors?: string[];
      /** When set, product uses variant inventory (exact stock). Otherwise no variants (API will estimate). */
      variantOptions?: VariantOptions;
      /** Override default/hover media type on product cards (e.g. "video" to test video-first display). */
      defaultMediaType?: "image" | "video";
      hoverMediaType?: "image" | "video";
    }> = [
      // CASE: No variants — API returns variantsSource: "estimated", synthesized from global stock (30% off)
      {
        name: { en: "Black Zip-Front Abaya", ar: "عباية سوداء زود أمامي" },
        description: { en: "Black zip-front abaya, versatile and modern.", ar: "عباية سوداء زود أمامي، عصرية ومتعددة الاستخدام." },
        category: cat("Abayas"),
        ...withDiscount(2000, 30),
        stock: 8,
        status: "ACTIVE",
        isNewArrival: false,
        sizes: ["S", "M", "L"],
        colors: ["Black"]
      },
      // CASE: Variants — one entire COLOR out of stock (Burgundy) — 50% off
      {
        name: { en: "Velvet Chemise Abaya", ar: "عباية مخمل شيميز" },
        description: { en: "Luxurious velvet chemise-style abaya.", ar: "عباية مخملية على طراز الشيميز." },
        category: cat("Abayas"),
        ...withDiscount(2100, 50),
        stock: 10,
        status: "ACTIVE",
        isNewArrival: false,
        sizes: ["M", "L"],
        colors: ["Black", "Burgundy", "Navy"],
        variantOptions: { stockPerVariant: 2, outOfStockColors: ["Burgundy"] }
      },
      // CASE: No variants (estimated) — 50% off
      {
        name: { en: "Wool Cape", ar: "كاب صوف" },
        description: { en: "Warm wool cape, essential for modest wardrobe.", ar: "كاب صوف دافئ، أساسي للخزانة المحتشمة." },
        category: cat("Capes"),
        ...withDiscount(1900, 50),
        stock: 14,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["One Size"],
        colors: ["Black", "Grey", "Camel"]
      },
      // CASE: Variants — one entire COLOR out of stock (Navy) — 20% off
      {
        name: { en: "Cape Hasna", ar: "كاب حَسَناء" },
        description: { en: "Elegant cape with clean lines.", ar: "كاب أنيق بخطوط نظيفة." },
        category: cat("Capes"),
        ...withDiscount(2500, 20),
        stock: 6,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["One Size"],
        colors: ["Black", "Navy"],
        variantOptions: { stockPerVariant: 3, outOfStockColors: ["Navy"] }
      },
      // CASE: Variants — one entire SIZE out of stock (L) — 50% off
      {
        name: { en: "Black Ribbed Twin Set – Abaya & Cardigan", ar: "توأم ريب أسود – عباية وكارديجان" },
        description: { en: "Matching abaya and cardigan set.", ar: "ست عباية وكارديجان متطابقين." },
        category: cat("Sets"),
        ...withDiscount(2900, 50),
        stock: 9,
        status: "ACTIVE",
        sizes: ["S", "M", "L"],
        colors: ["Black"],
        variantOptions: { stockPerVariant: 3, outOfStockSizes: ["L"] }
      },
      // CASE: Variants — one specific variant out (Black-M) — 40% off
      {
        name: { en: "Ribbed Kaftan", ar: "كافتان ريب" },
        description: { en: "Comfortable ribbed kaftan, easy to layer.", ar: "كافتان ريب مريح، سهل الطبقات." },
        category: cat("Sets"),
        ...withDiscount(1500, 40),
        stock: 11,
        status: "ACTIVE",
        sizes: ["S", "M", "L"],
        colors: ["Black", "Navy", "Grey"],
        variantOptions: { stockPerVariant: 2, outOfStockPairs: [["Black", "M"]] }
      },
      // CASE: Variants — mixed: one color partially out (Burgundy: M and L out) — 20% off
      {
        name: { en: "Velvet Pleated Cardigan", ar: "كارديجان مخمل بليت" },
        description: { en: "Velvet pleated cardigan for layering.", ar: "كارديجان مخمل بليت للطبقات." },
        category: cat("Cardigans & Coats"),
        ...withDiscount(2200, 20),
        stock: 5,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["S", "M", "L"],
        colors: ["Black", "Burgundy"],
        variantOptions: { stockPerVariant: 2, outOfStockPairs: [["Burgundy", "M"], ["Burgundy", "L"]] }
      },
      // CASE: Variants — all in stock (exact inventory) — 60% off
      {
        name: { en: "Wool Coat", ar: "معطف صوف" },
        description: { en: "Warm wool coat for winter.", ar: "معطف صوف دافئ للشتاء." },
        category: cat("Cardigans & Coats"),
        ...withDiscount(2700, 60),
        stock: 9,
        status: "ACTIVE",
        sizes: ["S", "M", "L"],
        colors: ["Black", "Camel", "Grey"],
        variantOptions: { stockPerVariant: 1 }
      },
      // CASE: Variants — fully out of stock (all variants 0) — 15% off
      {
        name: { en: "Embroidered Malhafa – Sale", ar: "ملحفة مطرزة – عرض" },
        description: { en: "Malhafa with subtle embroidery. Limited time offer.", ar: "ملحفة بتطريز خفيف. عرض لفترة محدودة." },
        category: cat("Malhafa"),
        ...withDiscount(1200, 15),
        stock: 0,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["One Size"],
        colors: ["Black", "Burgundy"],
        variantOptions: { stockPerVariant: 0 }
      },
      // CASE: No variants, many colors (estimated) — ~21% off (95 → 75)
      {
        name: { en: "Chiffon Hijab – Summer Sale", ar: "حجاب شيفون – عرض الصيف" },
        description: { en: "Light chiffon hijab for summer. Special price.", ar: "حجاب شيفون خفيف للصيف. سعر خاص." },
        category: cat("Hijab"),
        ...withDiscount(95, 21),
        stock: 40,
        status: "ACTIVE",
        sizes: ["One Size"],
        colors: ["Black", "White", "Nude", "Pink", "Blue"]
      },
      // CASE: Variants — all in stock, multiple sizes and colors; video as default media for card
      {
        name: { en: "Zipped Hooded Abaya", ar: "عباية زود هود" },
        description: { en: "Classic zipped abaya with hood. Comfortable and modest.", ar: "عباية كلاسيكية بزود وهود. مريحة ومحتشمة." },
        category: cat("Abayas"),
        price: 2100,
        costPerItem: 1150,
        stock: 24,
        status: "ACTIVE",
        isNewArrival: true,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Navy", "Brown"],
        variantOptions: { stockPerVariant: 2 },
        defaultMediaType: "video"
      }
    ];

    const validProducts = productList.filter((p) => p.category);
    if (validProducts.length < productList.length) {
      logger.warn(`Skipped ${productList.length - validProducts.length} products (category not found). Ensure categories match: Abayas, Capes, Malhafa, Hijab, Sets, Cardigans & Coats.`);
    }

    await Product.deleteMany({});
    const productsData = validProducts.map((p, i) => {
      const images = getProductGalleryImages(IMAGES, i);
      const variants = p.variantOptions
        ? buildVariants(
            p.sizes,
            p.colors,
            p.variantOptions.stockPerVariant,
            p.variantOptions
          )
        : [];
      return fillProduct({
        ...p,
        images,
        videos: productVideos,
        variants
      }, i);
    });
    const products = await Product.insertMany(productsData);

    const discountCount = validProducts.filter((p) => p.discountPrice != null).length;
    logger.info(`Created ${products.length} products (${discountCount} with discounts).`);
    logger.info("Product seeding complete!");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Error seeding products");
    process.exit(1);
  }
}

seedProductsWithDiscounts();
