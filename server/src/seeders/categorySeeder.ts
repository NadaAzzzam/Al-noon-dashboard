/**
 * Category seeder for Al-noon dashboard.
 * Seeds only categories (same set as full seed). Products and other seeders depend on these.
 *
 * Run from server directory:  npm run seed:categories
 */
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { Category } from "../models/Category.js";

const categoriesData = [
  { name: { en: "Abayas", ar: "عبايات" }, description: { en: "Long, loose-fitting robelike garment worn by Muslim women.", ar: "ثوب طويل فضفاض يرتديه بعض المسلمات." }, status: "visible" as const },
  { name: { en: "Capes", ar: "كابات" }, description: { en: "Essential piece in your modest wardrobe, a clothing accessory or outer layer.", ar: "قطعة أساسية في خزانة الملابس المحتشمة." }, status: "visible" as const },
  { name: { en: "Malhafa", ar: "ملحفة" }, description: { en: "Modest piece like a cloak worn by Muslim women.", ar: "قطعة محتشمة كالعباءة ترتديها المسلمات." }, status: "visible" as const },
  { name: { en: "Hijab", ar: "حجاب" }, description: { en: "Headscarves and hijab styles for modest wear.", ar: "أوشحة ورؤوس للحجاب المحتشم." }, status: "visible" as const },
  { name: { en: "Niqab", ar: "نقاب" }, description: { en: "Face-covering veils and niqab styles.", ar: "أغطية الوجه وأنماط النقاب." }, status: "visible" as const },
  { name: { en: "Tarha / Veil", ar: "طرح" }, description: { en: "Light veils and tarha (طرح) for hijab styling.", ar: "أوشحة خفيفة والطرح لتنسيق الحجاب." }, status: "visible" as const },
  { name: { en: "Sets", ar: "ستات" }, description: { en: "Coordinated sets: abaya & cardigan, twin sets.", ar: "مجموعات متكاملة: عباية وكارديجان، توأم." }, status: "visible" as const },
  { name: { en: "Cardigans & Coats", ar: "كارديجان ومعاطف" }, description: { en: "Open cardigans, wool coats, and outerwear.", ar: "كارديجان مفتوح، معاطف صوف، وملابس خارجية." }, status: "visible" as const },
];

async function seedCategories() {
  try {
    await connectDatabase();
    await Category.deleteMany({});
    const categories = await Category.insertMany(categoriesData);
    console.log(`Created ${categories.length} categories.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Category seeding failed:", error);
    process.exit(1);
  }
}

seedCategories();
