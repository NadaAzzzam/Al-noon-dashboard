/**
 * Full data seeder for Al-noon dashboard.
 * Reference: https://sawdah.world/ (Sawdah.eg – Abayas, Capes, Malhafa, modest wear)
 * Seeds: Categories, Cities, Settings, Products (hijab, niqab, abaya, cape, tarha), Users, Orders.
 */

import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { Category } from "../models/Category.js";
import { City } from "../models/City.js";
import { Settings } from "../models/Settings.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

// Unsplash (free to use) – scarf / fabric / modest wear style images
const IMAGES = {
  abaya1: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
  abaya2: "https://images.unsplash.com/photo-1595776613215-fe04b78de7d0?w=400&q=80",
  cape1: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80",
  cape2: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80",
  hijab1: "https://images.unsplash.com/photo-1529634801-b0e0b2e4b2c3?w=400&q=80",
  hijab2: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
  scarf1: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&q=80",
  scarf2: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80",
  fabric1: "https://images.unsplash.com/photo-1558769132-cb1aea913ec9?w=400&q=80",
  fabric2: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80",
  dress1: "https://images.unsplash.com/photo-1595776613215-fe04b78de7d0?w=400&q=80",
  coat1: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80",
  kaftan1: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
  cardigan1: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80"
};

async function seed() {
  await connectDatabase();
  console.log("Seeding data (reference: Sawdah.eg)...\n");

  // ----- Categories (Sawdah-style + Hijab, Niqab, Tarha) -----
  const categoriesData = [
    { name: { en: "Abayas", ar: "عبايات" }, description: { en: "Long, loose-fitting robelike garment worn by Muslim women.", ar: "ثوب طويل فضفاض يرتديه بعض المسلمات." }, status: "visible" as const },
    { name: { en: "Capes", ar: "كابات" }, description: { en: "Essential piece in your modest wardrobe, a clothing accessory or outer layer.", ar: "قطعة أساسية في خزانة الملابس المحتشمة." }, status: "visible" as const },
    { name: { en: "Malhafa", ar: "ملحفة" }, description: { en: "Modest piece like a cloak worn by Muslim women.", ar: "قطعة محتشمة كالعباءة ترتديها المسلمات." }, status: "visible" as const },
    { name: { en: "Hijab", ar: "حجاب" }, description: { en: "Headscarves and hijab styles for modest wear.", ar: "أوشحة ورؤوس للحجاب المحتشم." }, status: "visible" as const },
    { name: { en: "Niqab", ar: "نقاب" }, description: { en: "Face-covering veils and niqab styles.", ar: "أغطية الوجه وأنماط النقاب." }, status: "visible" as const },
    { name: { en: "Tarha / Veil", ar: "طرح" }, description: { en: "Light veils and tarha (طرح) for hijab styling.", ar: "أوشحة خفيفة والطرح لتنسيق الحجاب." }, status: "visible" as const },
    { name: { en: "Sets", ar: "ستات" }, description: { en: "Coordinated sets: abaya & cardigan, twin sets.", ar: "مجموعات متكاملة: عباية وكارديجان، توأم." }, status: "visible" as const },
    { name: { en: "Cardigans & Coats", ar: "كارديجان ومعاطف" }, description: { en: "Open cardigans, wool coats, and outerwear.", ar: "كارديجان مفتوح، معاطف صوف، وملابس خارجية." }, status: "visible" as const }
  ];
  await Category.deleteMany({});
  const categories = await Category.insertMany(categoriesData);
  const cat = (en: string) => categories.find((c) => c.name.en === en)!;
  console.log(`Created ${categories.length} categories.`);

  // ----- Cities (Egypt) -----
  const citiesData = [
    { name: { en: "Cairo", ar: "القاهرة" }, deliveryFee: 35 },
    { name: { en: "Giza", ar: "الجيزة" }, deliveryFee: 35 },
    { name: { en: "Alexandria", ar: "الإسكندرية" }, deliveryFee: 50 },
    { name: { en: "Mansoura", ar: "المنصورة" }, deliveryFee: 45 },
    { name: { en: "Tanta", ar: "طنطا" }, deliveryFee: 40 }
  ];
  await City.deleteMany({});
  await City.insertMany(citiesData);
  console.log(`Created ${citiesData.length} cities.`);

  // ----- Settings -----
  await Settings.deleteMany({});
  await Settings.create({
    storeName: { en: "Al-noon", ar: "النون" },
    instaPayNumber: "+20 10 000 0000",
    paymentMethods: { cod: true, instaPay: true },
    lowStockThreshold: 5
  });
  console.log("Created settings.");

  // ----- Products (Sawdah-inspired + Hijab/Niqab/Tarha, prices in EGP) -----
  await Product.deleteMany({});
  const productsData = [
    // Abayas
    { name: { en: "Zipped Hooded Abaya", ar: "عباية زود هود" }, description: { en: "Classic zipped abaya with hood. Comfortable and modest.", ar: "عباية كلاسيكية بزود وهود. مريحة ومحتشمة." }, category: cat("Abayas"), price: 2100, discountPrice: undefined, images: [IMAGES.abaya1], imageColors: [""], videos: [], stock: 15, status: "ACTIVE" as const, isNewArrival: true, sizes: ["S", "M", "L", "XL"], colors: ["Black", "Navy", "Brown"] },
    { name: { en: "Melton Abaya", ar: "عباية ميلتون" }, description: { en: "Elegant melton fabric abaya for winter.", ar: "عباية أنيقة من قماش ميلتون للشتاء." }, category: cat("Abayas"), price: 2100, discountPrice: undefined, images: [IMAGES.abaya2], imageColors: [""], videos: [], stock: 12, status: "ACTIVE" as const, isNewArrival: true, sizes: ["S", "M", "L"], colors: ["Black", "Grey"] },
    { name: { en: "Minimal Ribbed Abaya", ar: "عباية ريب مينيمال" }, description: { en: "Simple ribbed abaya, easy to style.", ar: "عباية ريب بسيطة، سهلة التنسيق." }, category: cat("Abayas"), price: 1450, discountPrice: undefined, images: [IMAGES.abaya1], imageColors: [""], videos: [], stock: 20, status: "ACTIVE" as const, isNewArrival: true, sizes: ["S", "M", "L", "XL"], colors: ["Black", "Navy", "Burgundy"] },
    { name: { en: "Black Zip-Front Abaya", ar: "عباية سوداء زود أمامي" }, description: { en: "Black zip-front abaya, versatile and modern.", ar: "عباية سوداء زود أمامي، عصرية ومتعددة الاستخدام." }, category: cat("Abayas"), price: 1400, discountPrice: 2000, images: [IMAGES.abaya2], imageColors: [""], videos: [], stock: 8, status: "ACTIVE" as const, isNewArrival: false, sizes: ["S", "M", "L"], colors: ["Black"] },
    { name: { en: "Velvet Chemise Abaya", ar: "عباية مخمل شيميز" }, description: { en: "Luxurious velvet chemise-style abaya.", ar: "عباية مخملية على طراز الشيميز." }, category: cat("Abayas"), price: 1050, discountPrice: 2100, images: [IMAGES.abaya1], imageColors: [""], videos: [], stock: 10, status: "ACTIVE" as const, isNewArrival: false, sizes: ["M", "L"], colors: ["Black", "Burgundy", "Navy"] },
    // Capes
    { name: { en: "Wool Cape", ar: "كاب صوف" }, description: { en: "Warm wool cape, essential for modest wardrobe.", ar: "كاب صوف دافئ، أساسي للخزانة المحتشمة." }, category: cat("Capes"), price: 950, discountPrice: 1900, images: [IMAGES.cape1], imageColors: [""], videos: [], stock: 14, status: "ACTIVE" as const, isNewArrival: true, sizes: ["One Size"], colors: ["Black", "Grey", "Camel"] },
    { name: { en: "Cape Hasna", ar: "كاب حَسَناء" }, description: { en: "Elegant cape with clean lines.", ar: "كاب أنيق بخطوط نظيفة." }, category: cat("Capes"), price: 2000, discountPrice: 2500, images: [IMAGES.cape2], imageColors: [""], videos: [], stock: 6, status: "ACTIVE" as const, isNewArrival: true, sizes: ["One Size"], colors: ["Black", "Navy"] },
    // Malhafa
    { name: { en: "Classic Malhafa", ar: "ملحفة كلاسيكية" }, description: { en: "Traditional malhafa, cloak-style modest wear.", ar: "ملحفة تقليدية، عباءة محتشمة." }, category: cat("Malhafa"), price: 850, discountPrice: undefined, images: [IMAGES.fabric1], imageColors: [""], videos: [], stock: 18, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black", "Navy", "Brown", "Grey"] },
    { name: { en: "Embroidered Malhafa", ar: "ملحفة مطرزة" }, description: { en: "Malhafa with subtle embroidery for special occasions.", ar: "ملحفة بتطريز خفيف للمناسبات." }, category: cat("Malhafa"), price: 1200, discountPrice: undefined, images: [IMAGES.fabric2], imageColors: [""], videos: [], stock: 7, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black", "Burgundy"] },
    // Hijab
    { name: { en: "Cotton Jersey Hijab", ar: "حجاب قطني جيرسي" }, description: { en: "Soft cotton jersey hijab, breathable and easy to wear.", ar: "حجاب قطني جيرسي ناعم، مريح وسهل الارتداء." }, category: cat("Hijab"), price: 120, discountPrice: undefined, images: [IMAGES.hijab1, IMAGES.scarf1], imageColors: ["", ""], videos: [], stock: 50, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black", "Navy", "Grey", "Burgundy", "Dusty Pink"] },
    { name: { en: "Chiffon Hijab", ar: "حجاب شيفون" }, description: { en: "Light chiffon hijab for summer.", ar: "حجاب شيفون خفيف للصيف." }, category: cat("Hijab"), price: 95, discountPrice: undefined, images: [IMAGES.scarf2], imageColors: [""], videos: [], stock: 40, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black", "White", "Nude", "Pink", "Blue"] },
    { name: { en: "Crinkle Hijab", ar: "حجاب كرينكل" }, description: { en: "Crinkle texture hijab, holds shape well.", ar: "حجاب ب texture كرينكل، يثبت الشكل جيداً." }, category: cat("Hijab"), price: 110, discountPrice: undefined, images: [IMAGES.hijab2], imageColors: [""], videos: [], stock: 35, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black", "Navy", "Grey", "Brown"] },
    // Niqab
    { name: { en: "Two-Piece Niqab", ar: "نقاب قطعتين" }, description: { en: "Classic two-piece niqab, breathable fabric.", ar: "نقاب كلاسيكي قطعتين، قماش قابل للتنفس." }, category: cat("Niqab"), price: 180, discountPrice: undefined, images: [IMAGES.scarf1], imageColors: [""], videos: [], stock: 25, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black", "Navy", "Brown"] },
    { name: { en: "Niqab with Magnetic Closure", ar: "نقاب بمغناطيس" }, description: { en: "Niqab with magnetic closure for easy wear.", ar: "نقاب بإغلاق مغناطيسي لارتداء أسهل." }, category: cat("Niqab"), price: 220, discountPrice: undefined, images: [IMAGES.scarf2], imageColors: [""], videos: [], stock: 15, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black"] },
    // Tarha / Veil (طرح)
    { name: { en: "Silk Tarha", ar: "طرح حرير" }, description: { en: "Light silk tarha (طرح) for hijab styling.", ar: "طرح حرير خفيف لتنسيق الحجاب." }, category: cat("Tarha / Veil"), price: 150, discountPrice: undefined, images: [IMAGES.scarf1], imageColors: [""], videos: [], stock: 30, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Black", "Navy", "Burgundy", "Gold"] },
    { name: { en: "Printed Tarha", ar: "طرح مطبوع" }, description: { en: "Printed tarha for a pop of color.", ar: "طرح مطبوع للمسة لونية." }, category: cat("Tarha / Veil"), price: 130, discountPrice: undefined, images: [IMAGES.scarf2], imageColors: [""], videos: [], stock: 22, status: "ACTIVE" as const, sizes: ["One Size"], colors: ["Multi", "Floral", "Geometric"] },
    // Sets
    { name: { en: "Black Ribbed Twin Set – Abaya & Cardigan", ar: "توأم ريب أسود – عباية وكارديجان" }, description: { en: "Matching abaya and cardigan set.", ar: "ست عباية وكارديجان متطابقين." }, category: cat("Sets"), price: 1450, discountPrice: 2900, images: [IMAGES.abaya1, IMAGES.cardigan1], imageColors: ["", ""], videos: [], stock: 9, status: "ACTIVE" as const, sizes: ["S", "M", "L"], colors: ["Black"] },
    { name: { en: "Ribbed Kaftan", ar: "كافتان ريب" }, description: { en: "Comfortable ribbed kaftan, easy to layer.", ar: "كافتان ريب مريح، سهل الطبقات." }, category: cat("Sets"), price: 900, discountPrice: 1500, images: [IMAGES.kaftan1], imageColors: [""], videos: [], stock: 11, status: "ACTIVE" as const, sizes: ["S", "M", "L"], colors: ["Black", "Navy", "Grey"] },
    // Cardigans & Coats
    { name: { en: "Velvet Pleated Cardigan", ar: "كارديجان مخمل بليت" }, description: { en: "Velvet pleated cardigan for layering.", ar: "كارديجان مخمل بليت للطبقات." }, category: cat("Cardigans & Coats"), price: 1760, discountPrice: 2200, images: [IMAGES.cardigan1], imageColors: [""], videos: [], stock: 5, status: "ACTIVE" as const, isNewArrival: true, sizes: ["S", "M", "L"], colors: ["Black", "Burgundy"] },
    { name: { en: "Flowy Open Cardigan", ar: "كارديجان مفتوح فضفاض" }, description: { en: "Light, flowy open cardigan.", ar: "كارديجان مفتوح خفيف وفضفاض." }, category: cat("Cardigans & Coats"), price: 1600, discountPrice: undefined, images: [IMAGES.cape2], imageColors: [""], videos: [], stock: 13, status: "ACTIVE" as const, sizes: ["S", "M", "L"], colors: ["Black", "Grey", "Navy"] },
    { name: { en: "Wool Coat", ar: "معطف صوف" }, description: { en: "Warm wool coat for winter.", ar: "معطف صوف دافئ للشتاء." }, category: cat("Cardigans & Coats"), price: 1080, discountPrice: 2700, images: [IMAGES.coat1], imageColors: [""], videos: [], stock: 4, status: "ACTIVE" as const, sizes: ["S", "M", "L"], colors: ["Black", "Camel", "Grey"] },
    { name: { en: "Melton Dress", ar: "فستان ميلتون" }, description: { en: "Elegant melton dress, modest and warm.", ar: "فستان ميلتون أنيق، محتشم ودافئ." }, category: cat("Abayas"), price: 2000, discountPrice: undefined, images: [IMAGES.dress1], imageColors: [""], videos: [], stock: 7, status: "ACTIVE" as const, sizes: ["S", "M", "L"], colors: ["Black", "Navy"] }
  ];
  const products = await Product.insertMany(productsData);
  console.log(`Created ${products.length} products.`);

  // ----- Admin user (ensure exists) -----
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME ?? "Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "ADMIN"
    });
    console.log("Created admin user.");
  }

  // ----- Customer users -----
  const customersData = [
    { name: "Sara Ahmed", email: "sara.ahmed@example.com", password: "customer123", role: "USER" as const },
    { name: "Fatma Hassan", email: "fatma.hassan@example.com", password: "customer123", role: "USER" as const },
    { name: "Mariam Ali", email: "mariam.ali@example.com", password: "customer123", role: "USER" as const }
  ];
  for (const c of customersData) {
    const exists = await User.findOne({ email: c.email });
    if (!exists) await User.create(c);
  }
  const customers = await User.find({ role: "USER" }).limit(3).lean();
  const customerIds = customers.map((u) => u._id);
  console.log("Customers ready for orders.");

  // ----- Orders (for dashboard stats and recent orders) -----
  await Order.deleteMany({});
  if (customerIds.length > 0 && products.length >= 3) {
    const now = new Date();
    const ordersData = [
      { user: customerIds[0], items: [{ product: products[0]._id, quantity: 1, price: 2100 }, { product: products[5]._id, quantity: 1, price: 950 }], total: 3050, status: "DELIVERED" as const, paymentMethod: "COD" as const, shippingAddress: "123 Main St, Cairo", createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { user: customerIds[1], items: [{ product: products[9]._id, quantity: 3, price: 120 }, { product: products[10]._id, quantity: 2, price: 95 }], total: 550, status: "CONFIRMED" as const, paymentMethod: "INSTAPAY" as const, shippingAddress: "45 Giza Ave, Giza", createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { user: customerIds[0], items: [{ product: products[2]._id, quantity: 1, price: 1450 }], total: 1450, status: "SHIPPED" as const, paymentMethod: "COD" as const, shippingAddress: "123 Main St, Cairo", createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { user: customerIds[2], items: [{ product: products[6]._id, quantity: 1, price: 2000 }, { product: products[19]._id, quantity: 1, price: 1760 }], total: 3760, status: "PENDING" as const, shippingAddress: "78 Alexandria Rd, Alexandria", createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000) },
      { user: customerIds[1], items: [{ product: products[14]._id, quantity: 2, price: 180 }], total: 360, status: "DELIVERED" as const, paymentMethod: "COD" as const, shippingAddress: "45 Giza Ave, Giza", createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) }
    ];
    await Order.insertMany(ordersData);
    console.log(`Created ${ordersData.length} orders.`);
  }

  console.log("\nSeed completed. You can log in with admin@localhost / admin123");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
