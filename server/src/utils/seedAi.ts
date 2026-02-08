/**
 * AI Assistant seeder for Al-noon dashboard.
 * - Ensures Settings has default aiAssistant config (if missing).
 * - Ensures there are products with images for demo (creates 3 if none exist).
 * - Seeds sample chat sessions: English, Arabic (MSA), and Egyptian Arabic (عامية) cases.
 * - Sessions include productCards (image + link) where the assistant recommends products.
 * Run: npm run seed:ai
 */

import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { Settings } from "../models/Settings.js";
import { ChatSession, type ProductCardInMessage } from "../models/ChatSession.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";

const defaultAiAssistant = {
  enabled: false,
  geminiApiKey: "",
  greeting: {
    en: "Hi! How can I help you today?",
    ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟"
  },
  systemPrompt: "",
  suggestedQuestions: [
    { en: "What are your shipping options?", ar: "ما خيارات الشحن لديكم؟" },
    { en: "How can I return an item?", ar: "كيف أستطيع إرجاع منتج؟" },
    { en: "Show me new arrivals", ar: "أرني الوصول الجديد" },
    { en: "Do you ship to Cairo?", ar: "بتشحنوا لـ القاهرة؟" },
    { en: "Show me black abayas", ar: "عايزة أشوف العبايات السودا" }
  ]
};

// Unsplash images for demo products (same style as seedData)
const DEMO_IMAGES = {
  abaya: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
  cape: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80",
  hijab: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&q=80"
};

/** Get up to 4 products that have at least one image (for use in chat samples). */
async function getProductsWithImages(limit: number): Promise<{ _id: mongoose.Types.ObjectId; name: { en: string; ar: string }; images: string[] }[]> {
  const products = await Product.find({
    deletedAt: null,
    status: "ACTIVE",
    "images.0": { $exists: true }
  })
    .select("_id name images")
    .limit(limit)
    .lean();
  return products as { _id: mongoose.Types.ObjectId; name: { en: string; ar: string }; images: string[] }[];
}

/** Create 3 demo products with images if none exist. Returns the created/found products. */
async function ensureDemoProductsWithImages(): Promise<{ _id: mongoose.Types.ObjectId; name: { en: string; ar: string }; images: string[] }[]> {
  const existing = await getProductsWithImages(4);
  if (existing.length > 0) {
    return existing;
  }
  let category = await Category.findOne({ status: "visible" }).select("_id").lean();
  if (!category) {
    const [first] = await Category.insertMany([
      { name: { en: "Abayas", ar: "عبايات" }, status: "visible" },
      { name: { en: "Hijab", ar: "حجاب" }, status: "visible" }
    ]);
    category = first;
  }
  const categoryId = (category as { _id: mongoose.Types.ObjectId })._id;
  const demoProducts = [
    {
      name: { en: "Classic Black Abaya", ar: "عباية سوداء كلاسيكية" },
      description: { en: "Elegant black abaya, perfect for every occasion.", ar: "عباية سوداء أنيقة مناسبة لكل مناسبة." },
      category: categoryId,
      price: 1200,
      images: [DEMO_IMAGES.abaya],
      imageColors: [""],
      videos: [],
      stock: 10,
      status: "ACTIVE" as const,
      isNewArrival: true,
      sizes: ["S", "M", "L"],
      sizeDescriptions: [],
      colors: ["Black"]
    },
    {
      name: { en: "Wool Cape", ar: "كاب صوف" },
      description: { en: "Warm wool cape for modest layering.", ar: "كاب صوف دافئ للطبقات المحتشمة." },
      category: categoryId,
      price: 950,
      images: [DEMO_IMAGES.cape],
      imageColors: [""],
      videos: [],
      stock: 8,
      status: "ACTIVE" as const,
      isNewArrival: true,
      sizes: ["One Size"],
      sizeDescriptions: [],
      colors: ["Black", "Grey"]
    },
    {
      name: { en: "Cotton Jersey Hijab", ar: "حجاب قطني جيرسي" },
      description: { en: "Soft cotton jersey hijab, breathable.", ar: "حجاب قطني جيرسي ناعم وقابل للتنفس." },
      category: categoryId,
      price: 120,
      images: [DEMO_IMAGES.hijab],
      imageColors: [""],
      videos: [],
      stock: 30,
      status: "ACTIVE" as const,
      isNewArrival: true,
      sizes: ["One Size"],
      sizeDescriptions: [],
      colors: ["Black", "Navy", "Burgundy"]
    }
  ];
  const created = await Product.insertMany(demoProducts);
  console.log(`Created ${created.length} demo products with images for AI chat samples.`);
  return created.map((p) => ({
    _id: p._id,
    name: p.name,
    images: p.images
  }));
}

/** Convert a product to a ProductCardInMessage for chat display (image + link). */
function toProductCard(p: {
  _id: mongoose.Types.ObjectId;
  name: { en: string; ar: string };
  images: string[];
}): ProductCardInMessage {
  const productId = String(p._id);
  return {
    id: productId,
    name: { en: p.name?.en ?? "", ar: p.name?.ar ?? "" },
    image: Array.isArray(p.images) && p.images[0] ? p.images[0] : "",
    productUrl: `/product/${productId}`
  };
}

/** Build sample sessions; assistant messages that reference products include productCards (image + link). */
function buildSampleSessions(
  products: { _id: mongoose.Types.ObjectId; name: { en: string; ar: string }; images: string[] }[]
): { sessionId: string; messages: { role: "user" | "assistant"; content: string; timestamp: Date; productCards?: ProductCardInMessage[] }[]; customerName?: string; customerEmail?: string; status: "active" | "closed" }[] {
  const now = Date.now();
  const id = (p: { _id: mongoose.Types.ObjectId }) => String(p._id);
  const nameEn = (p: { name: { en: string; ar: string } }) => p.name.en || p.name.ar;

  // Session 1: shipping (no products)
  const session1 = {
    sessionId: "seed_sess_001_demo",
    messages: [
      { role: "user" as const, content: "What are your shipping options?", timestamp: new Date(now - 3600000) },
      {
        role: "assistant" as const,
        content:
          "We deliver across Egypt. Delivery fees vary by city and are shown at checkout. Orders are typically dispatched within 1–2 business days, and delivery usually takes 2–5 business days depending on your location.",
        timestamp: new Date(now - 3599000)
      },
      { role: "user" as const, content: "Do you ship to Cairo?", timestamp: new Date(now - 3500000) },
      {
        role: "assistant" as const,
        content:
          "Yes, we ship to Cairo and all governorates in Egypt. You'll see the delivery fee for your area when you checkout.",
        timestamp: new Date(now - 3499000)
      }
    ],
    customerName: "Sara Ahmed",
    customerEmail: "sara.ahmed@example.com",
    status: "closed" as const
  };

  // Session 2: new arrivals / product recommendations WITH [id:xxx] and product names + images
  const p1 = products[0];
  const p2 = products[1];
  const p3 = products[2];
  const newArrivalsContent =
    products.length >= 3
      ? `Here are some of our latest pieces you might like:\n\n• **${nameEn(p1)}** [id:${id(p1)}] – elegant and versatile.\n• **${nameEn(p2)}** [id:${id(p2)}] – perfect for layering.\n• **${nameEn(p3)}** [id:${id(p3)}] – soft and breathable.\n\nYou can click on any product to see the image and details. Browse our New Arrivals section on the homepage for more.`
      : products.length >= 1
        ? `We have this piece you might like: **${nameEn(p1)}** [id:${id(p1)}]. You can click to see the image and full details. Browse our New Arrivals on the homepage for more.`
        : "Here are some of our latest pieces. You can browse the New Arrivals section on our homepage for the full list.";

  const session2ProductCards = products.slice(0, 3).map(toProductCard);
  const session2 = {
    sessionId: "seed_sess_002_demo",
    messages: [
      { role: "user" as const, content: "Show me new arrivals", timestamp: new Date(now - 7200000) },
      {
        role: "assistant" as const,
        content: newArrivalsContent,
        timestamp: new Date(now - 7199000),
        ...(session2ProductCards.length > 0 && { productCards: session2ProductCards })
      }
    ],
    status: "active" as const
  };

  // Session 3: return policy (no products)
  const session3 = {
    sessionId: "seed_sess_003_demo",
    messages: [
      { role: "user" as const, content: "How can I return an item?", timestamp: new Date(now - 86400000) },
      {
        role: "assistant" as const,
        content:
          "Items can be returned within 14 days of delivery if unused, unwashed, and in original packaging. To start a return, contact us with your order number and reason—we'll send you instructions.",
        timestamp: new Date(now - 86399000)
      }
    ],
    customerName: "Nura",
    status: "closed" as const
  };

  // Session 4: specific product request with image + link
  const session4Content =
    products.length >= 1
      ? `Yes! We have the **${nameEn(p1)}** [id:${id(p1)}] – it's one of our favourites. See the image and link below to view full details and add it to your cart.`
      : "We have several abayas in our Abayas collection. Browse the Products page to see all options with images and prices.";
  const session4ProductCards = products.length >= 1 ? [toProductCard(p1)] : [];

  const session4 = {
    sessionId: "seed_sess_004_demo",
    messages: [
      { role: "user" as const, content: "Do you have a black abaya? I want to see one with image.", timestamp: new Date(now - 1800000) },
      {
        role: "assistant" as const,
        content: session4Content,
        timestamp: new Date(now - 1799000),
        ...(session4ProductCards.length > 0 && { productCards: session4ProductCards })
      }
    ],
    customerName: "Fatma",
    customerEmail: "fatma@example.com",
    status: "closed" as const
  };

  // Session 5: Egyptian Arabic (عامية) – shipping question
  const session5 = {
    sessionId: "seed_sess_005_demo",
    messages: [
      {
        role: "user" as const,
        content: "إيه خيارات الشحن؟ بتشحنوا لـ القاهرة؟",
        timestamp: new Date(now - 5400000)
      },
      {
        role: "assistant" as const,
        content:
          "بنشحن لكل محافظات مصر. رسوم التوصيل بتختلف حسب المدينة وبتتظهر ليكي في صفحة الدفع. الطلبات عادة بتتبعت خلال ١–٢ يوم عمل، والتوصيل بياخد ٢–٥ أيام عمل حسب منطقتك. أيوه بنشحن لـ القاهرة.",
        timestamp: new Date(now - 5399000)
      }
    ],
    customerName: "منى",
    status: "closed" as const
  };

  // Session 6: Egyptian Arabic (عامية) – product request with productCards
  const session6ContentAr =
    products.length >= 1
      ? `أيوه! عندنا **${nameEn(p1)}** [id:${id(p1)}] – من تشكيلتنا الكلاسيكية. الصورة والرابط تحت عشان تشوفي التفاصيل وتضيفيها للعربة.`
      : "عندنا تشكيلة عبايات في قسم العبايات. ادخلي على صفحة المنتجات تشوفي كل الخيارات بالصور والأسعار.";
  const session6ProductCards = products.length >= 1 ? [toProductCard(p1)] : [];

  const session6 = {
    sessionId: "seed_sess_006_demo",
    messages: [
      {
        role: "user" as const,
        content: "عايزة أشوف العبايات السودا أو الجديدة",
        timestamp: new Date(now - 2700000)
      },
      {
        role: "assistant" as const,
        content: session6ContentAr,
        timestamp: new Date(now - 2699000),
        ...(session6ProductCards.length > 0 && { productCards: session6ProductCards })
      }
    ],
    customerName: "ياسمين",
    status: "active" as const
  };

  // Session 7: MSA Arabic – return policy
  const session7 = {
    sessionId: "seed_sess_007_demo",
    messages: [
      { role: "user" as const, content: "كيف أستطيع إرجاع منتج؟", timestamp: new Date(now - 10800000) },
      {
        role: "assistant" as const,
        content:
          "يمكنك إرجاع المنتجات خلال ١٤ يوماً من الاستلام إذا كانت غير مستخدمة وغير مغسولة وفي الغلاف الأصلي. لبدء الإرجاع، تواصلي معنا برقم الطلب والسبب وسنرسل لك التعليمات.",
        timestamp: new Date(now - 10799900)
      }
    ],
    customerName: "سارة",
    status: "closed" as const
  };

  return [session1, session2, session3, session4, session5, session6, session7];
}

async function seedAi() {
  await connectDatabase();
  console.log("Seeding AI Assistant...\n");

  const settings = await Settings.findOne();
  if (!settings) {
    await Settings.create({
      storeName: { en: "Al-noon", ar: "النون" },
      instaPayNumber: "",
      paymentMethods: { cod: true, instaPay: true },
      lowStockThreshold: 5,
      aiAssistant: defaultAiAssistant
    });
    console.log("Created new Settings with default aiAssistant.");
  } else {
    const existing = settings.toObject() as { aiAssistant?: unknown };
    if (!existing.aiAssistant) {
      await Settings.updateOne({ _id: settings._id }, { $set: { aiAssistant: defaultAiAssistant } });
      console.log("Updated existing Settings with default aiAssistant.");
    } else {
      console.log("Settings already has aiAssistant config.");
    }
  }

  const productsWithImages = await ensureDemoProductsWithImages();
  const sampleSessions = buildSampleSessions(productsWithImages);

  let created = 0;
  let updated = 0;
  for (const session of sampleSessions) {
    const exists = await ChatSession.findOne({ sessionId: session.sessionId });
    if (!exists) {
      await ChatSession.create(session);
      created++;
    } else {
      // Update existing seed session so messages include productCards (image + link)
      await ChatSession.updateOne({ sessionId: session.sessionId }, { $set: { messages: session.messages } });
      updated++;
    }
  }
  console.log(`Sample chat sessions: ${created} created, ${updated} updated.`);
  if (productsWithImages.length > 0) {
    console.log(`Sessions include productCards (image + full product link) for assistant messages that recommend products.`);
  }

  console.log("\nAI seed completed.");
  await mongoose.disconnect();
  process.exit(0);
}

seedAi().catch((err) => {
  console.error("AI seed failed:", err);
  process.exit(1);
});
