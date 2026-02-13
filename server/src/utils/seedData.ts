/**
 * Full data seeder for Al-noon e-commerce dashboard.
 * Seeds all data needed: Categories, Cities, Settings (store, hero, content pages,
 * announcementBar, promoBanner, featuredProducts, feedback, orderNotifications, aiAssistant),
 * Products (with sizeDescriptions, details, stylingTip), Users, Orders, Payments,
 * Contact submissions, Subscribers, Product feedback, and AI chat sessions.
 * Product media: images from server/seed-images/ only; videos downloaded/copied to server
 * (no external HTTP links). Each product gets 6 distinct images + 1 local video for detail testing.
 * Run: npm run seed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { Category } from "../models/Category.js";
import { City } from "../models/City.js";
import { Settings, DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND } from "../models/Settings.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { Subscriber } from "../models/Subscriber.js";
import { ProductFeedback } from "../models/ProductFeedback.js";
import { Payment } from "../models/Payment.js";
import { ChatSession, type ProductCardInMessage } from "../models/ChatSession.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

const SEED_IMAGE_KEYS = [
  "abaya1", "abaya2", "cape1", "cape2", "hijab1", "hijab2", "scarf1", "scarf2",
  "fabric1", "fabric2", "dress1", "coat1", "kaftan1", "cardigan1",
  "hero1", "hero2", "hero3", "section1", "section2", "section3"
] as const;
/** Pairs used for default (first) and hover (second) images. If hover file is missing, seeder copies default so both URLs exist. */
const SEED_IMAGE_DEFAULT_HOVER_PAIRS: [string, string][] = [
  ["abaya1", "abaya2"], ["cape1", "cape2"], ["hijab1", "hijab2"], ["scarf1", "scarf2"],
  ["fabric1", "fabric2"], ["cardigan1", "coat1"], ["dress1", "abaya2"], ["kaftan1", "fabric1"]
];
const SEED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

type SeedImagesResult = { IMAGES: Record<string, string>; paymentProofUrl: string };

/** Load product/hero images from server/seed-images (local only). Copies files to uploads/products and returns paths.
 * For default/hover pairs: if only the default file exists, copies it as the hover file so both URLs are available. */
function loadSeedImages(): SeedImagesResult {
  const serverRoot = path.resolve(__dirname, "../..");
  const seedImagesDir = path.join(serverRoot, "seed-images");
  const uploadsProductsDir = path.join(serverRoot, "uploads", "products");
  const uploadsPaymentProofDir = path.join(serverRoot, "uploads", "payment-proof");

  if (!fs.existsSync(uploadsProductsDir)) fs.mkdirSync(uploadsProductsDir, { recursive: true });
  if (!fs.existsSync(uploadsPaymentProofDir)) fs.mkdirSync(uploadsPaymentProofDir, { recursive: true });

  const IMAGES: Record<string, string> = {};
  let firstCopied = "";

  function copyOne(key: string, destSubdir: string, destPrefix: string): string {
    for (const ext of SEED_IMAGE_EXTS) {
      const src = path.join(seedImagesDir, `${key}${ext}`);
      if (fs.existsSync(src)) {
        const base = `${destPrefix}${key}${ext}`;
        const dest = path.join(destSubdir, base);
        fs.copyFileSync(src, dest);
        const url = destSubdir === uploadsProductsDir ? `/uploads/products/${base}` : `/uploads/payment-proof/${base}`;
        if (!firstCopied && destSubdir === uploadsProductsDir) firstCopied = url;
        return url;
      }
    }
    return "";
  }

  for (const key of SEED_IMAGE_KEYS) {
    const url = copyOne(key, uploadsProductsDir, "seed-");
    if (url) IMAGES[key] = url;
  }

  // Seed default/hover pairs: if hover key has no file but default does, copy default file as hover so both URLs exist
  for (const [defaultKey, hoverKey] of SEED_IMAGE_DEFAULT_HOVER_PAIRS) {
    if (IMAGES[hoverKey]) continue;
    const defaultUrl = IMAGES[defaultKey];
    if (!defaultUrl) continue;
    const defaultPath = path.join(uploadsProductsDir, path.basename(defaultUrl));
    if (fs.existsSync(defaultPath)) {
      const ext = path.extname(defaultPath);
      const base = `seed-${hoverKey}${ext}`;
      const dest = path.join(uploadsProductsDir, base);
      fs.copyFileSync(defaultPath, dest);
      IMAGES[hoverKey] = `/uploads/products/${base}`;
    }
  }

  const placeholderUrl = copyOne("placeholder", uploadsProductsDir, "seed-");
  if (placeholderUrl && !firstCopied) firstCopied = placeholderUrl;
  for (const key of SEED_IMAGE_KEYS) {
    if (!IMAGES[key]) IMAGES[key] = placeholderUrl || firstCopied || "";
  }
  for (const [, hoverKey] of SEED_IMAGE_DEFAULT_HOVER_PAIRS) {
    if (!IMAGES[hoverKey]) IMAGES[hoverKey] = placeholderUrl || firstCopied || "";
  }

  const paymentProofUrl = copyOne("payment-proof", uploadsPaymentProofDir, "seed-");
  if (Object.keys(IMAGES).length === 0 && !firstCopied) {
    console.warn("No images found in server/seed-images. Add .jpg/.png files (e.g. abaya1.jpg, placeholder.png). See server/seed-images/README.md.");
  }
  return { IMAGES, paymentProofUrl };
}

export { loadSeedImages };

/** Keys used to pick 6 distinct product gallery images per product (no duplicates within product). */
const PRODUCT_GALLERY_KEYS = [
  "abaya1", "abaya2", "cape1", "cape2", "hijab1", "hijab2", "scarf1", "scarf2",
  "fabric1", "fabric2", "dress1", "coat1", "kaftan1", "cardigan1", "hero1", "hero2", "section1", "section2"
] as const;

/** Returns 6 distinct image URLs for a product (by index) so product details can show a full gallery. No duplicates within product. */
function getProductGalleryImages(IMAGES: Record<string, string>, productIndex: number): string[] {
  const pool = PRODUCT_GALLERY_KEYS.filter((k) => IMAGES[k]);
  if (pool.length === 0) return [];
  const out: string[] = [];
  const start = productIndex * 6 % pool.length;
  for (let i = 0; i < 6; i++) {
    const key = pool[(start + i) % pool.length];
    const url = IMAGES[key];
    if (url && !out.includes(url)) out.push(url);
  }
  // If we got duplicates (wrap-around), fill with remaining pool entries until we have 6
  for (const key of pool) {
    if (out.length >= 6) break;
    const url = IMAGES[key];
    if (url && !out.includes(url)) out.push(url);
  }
  return out.slice(0, 6);
}

/** Seed video filename stored under uploads/products/videos/ */
const SEED_VIDEO_FILENAME = "seed-product-sample.mp4";

/**
 * Ensures one product sample video is available on the server (no external HTTP links).
 * 1) If server/seed-videos/product-sample.mp4 exists, copies it to uploads/products/videos/.
 * 2) Otherwise downloads a small sample MP4 once and saves it there.
 * Returns the local URL path (e.g. /uploads/products/videos/seed-product-sample.mp4).
 */
async function loadSeedVideos(): Promise<string> {
  const serverRoot = path.resolve(__dirname, "../..");
  const seedVideosDir = path.join(serverRoot, "seed-videos");
  const productVideosDir = path.join(serverRoot, "uploads", "products", "videos");

  if (!fs.existsSync(productVideosDir)) fs.mkdirSync(productVideosDir, { recursive: true });

  const destPath = path.join(productVideosDir, SEED_VIDEO_FILENAME);
  const localUrl = `/uploads/products/videos/${SEED_VIDEO_FILENAME}`;

  const localSource = path.join(seedVideosDir, "product-sample.mp4");
  if (fs.existsSync(localSource)) {
    fs.copyFileSync(localSource, destPath);
    return localUrl;
  }

  if (fs.existsSync(destPath)) return localUrl;

  const sampleUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
  try {
    const res = await fetch(sampleUrl, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    return localUrl;
  } catch (err) {
    console.warn("Could not download seed video. Place server/seed-videos/product-sample.mp4 for local video. Error:", err instanceof Error ? err.message : err);
    return "";
  }
}

export { loadSeedVideos, getProductGalleryImages };

const DEFAULT_AI_ASSISTANT = {
  enabled: false,
  geminiApiKey: "",
  greeting: { en: "Hi! How can I help you today?", ar: "مرحباً! كيف يمكنني مساعدتك اليوم؟" },
  systemPrompt: "",
  suggestedQuestions: [
    { en: "What are your shipping options?", ar: "ما خيارات الشحن لديكم؟" },
    { en: "How can I return an item?", ar: "كيف أستطيع إرجاع منتج؟" },
    { en: "Show me new arrivals", ar: "أرني الوصول الجديد" },
    { en: "Do you ship to Cairo?", ar: "بتشحنوا لـ القاهرة؟" },
    { en: "Show me black abayas", ar: "عايزة أشوف العبايات السودا" }
  ]
};

function toProductCard(p: { _id: mongoose.Types.ObjectId; name: { en: string; ar: string }; images: string[] }): ProductCardInMessage {
  const productId = String(p._id);
  return {
    id: productId,
    name: { en: p.name?.en ?? "", ar: p.name?.ar ?? "" },
    image: Array.isArray(p.images) && p.images[0] ? p.images[0] : "",
    productUrl: `/product/${productId}`
  };
}

function buildChatSessions(products: { _id: mongoose.Types.ObjectId; name: { en: string; ar: string }; images: string[] }[]) {
  const now = Date.now();
  const id = (p: { _id: mongoose.Types.ObjectId }) => String(p._id);
  const nameEn = (p: { name: { en: string; ar: string } }) => p.name.en || p.name.ar;
  const p1 = products[0];
  const p2 = products[1];
  const p3 = products[2];
  const newArrivalsContent =
    products.length >= 3
      ? `Here are some of our latest pieces you might like:\n\n• **${nameEn(p1)}** [id:${id(p1)}] – elegant and versatile.\n• **${nameEn(p2)}** [id:${id(p2)}] – perfect for layering.\n• **${nameEn(p3)}** [id:${id(p3)}] – soft and breathable.\n\nYou can click on any product to see the image and details.`
      : products.length >= 1
        ? `We have this piece you might like: **${nameEn(p1)}** [id:${id(p1)}]. You can click to see the image and full details.`
        : "Here are some of our latest pieces. Browse our New Arrivals on the homepage for more.";
  const session2ProductCards = products.slice(0, 3).map(toProductCard);
  const session4Content = products.length >= 1 ? `Yes! We have the **${nameEn(p1)}** [id:${id(p1)}] – it's one of our favourites. See the image and link below to view full details.` : "We have several abayas in our Abayas collection. Browse the Products page to see all options.";
  const session4ProductCards = products.length >= 1 ? [toProductCard(p1)] : [];
  const session6ContentAr = products.length >= 1 ? `أيوه! عندنا **${nameEn(p1)}** [id:${id(p1)}] – من تشكيلتنا الكلاسيكية. الصورة والرابط تحت عشان تشوفي التفاصيل.` : "عندنا تشكيلة عبايات في قسم العبايات. ادخلي على صفحة المنتجات تشوفي كل الخيارات.";
  const session6ProductCards = products.length >= 1 ? [toProductCard(p1)] : [];

  return [
    { sessionId: "seed_sess_001_demo", messages: [{ role: "user" as const, content: "What are your shipping options?", timestamp: new Date(now - 3600000) }, { role: "assistant" as const, content: "We deliver across Egypt. Delivery fees vary by city and are shown at checkout. Orders are typically dispatched within 1–2 business days, and delivery usually takes 2–5 business days depending on your location.", timestamp: new Date(now - 3599000) }, { role: "user" as const, content: "Do you ship to Cairo?", timestamp: new Date(now - 3500000) }, { role: "assistant" as const, content: "Yes, we ship to Cairo and all governorates in Egypt. You'll see the delivery fee for your area when you checkout.", timestamp: new Date(now - 3499000) }], customerName: "Sara Ahmed", customerEmail: "sara.ahmed@example.com", status: "closed" as const },
    { sessionId: "seed_sess_002_demo", messages: [{ role: "user" as const, content: "Show me new arrivals", timestamp: new Date(now - 7200000) }, { role: "assistant" as const, content: newArrivalsContent, timestamp: new Date(now - 7199000), ...(session2ProductCards.length > 0 && { productCards: session2ProductCards }) }], status: "active" as const },
    { sessionId: "seed_sess_003_demo", messages: [{ role: "user" as const, content: "How can I return an item?", timestamp: new Date(now - 86400000) }, { role: "assistant" as const, content: "Items can be returned within 14 days of delivery if unused, unwashed, and in original packaging. To start a return, contact us with your order number and reason—we'll send you instructions.", timestamp: new Date(now - 86399000) }], customerName: "Nura", status: "closed" as const },
    { sessionId: "seed_sess_004_demo", messages: [{ role: "user" as const, content: "Do you have a black abaya? I want to see one with image.", timestamp: new Date(now - 1800000) }, { role: "assistant" as const, content: session4Content, timestamp: new Date(now - 1799000), ...(session4ProductCards.length > 0 && { productCards: session4ProductCards }) }], customerName: "Fatma", customerEmail: "fatma@example.com", status: "closed" as const },
    { sessionId: "seed_sess_005_demo", messages: [{ role: "user" as const, content: "إيه خيارات الشحن؟ بتشحنوا لـ القاهرة؟", timestamp: new Date(now - 5400000) }, { role: "assistant" as const, content: "بنشحن لكل محافظات مصر. رسوم التوصيل بتختلف حسب المدينة وبتتظهر ليكي في صفحة الدفع. أيوه بنشحن لـ القاهرة.", timestamp: new Date(now - 5399000) }], customerName: "منى", status: "closed" as const },
    { sessionId: "seed_sess_006_demo", messages: [{ role: "user" as const, content: "عايزة أشوف العبايات السودا أو الجديدة", timestamp: new Date(now - 2700000) }, { role: "assistant" as const, content: session6ContentAr, timestamp: new Date(now - 2699000), ...(session6ProductCards.length > 0 && { productCards: session6ProductCards }) }], customerName: "ياسمين", status: "active" as const },
    { sessionId: "seed_sess_007_demo", messages: [{ role: "user" as const, content: "كيف أستطيع إرجاع منتج؟", timestamp: new Date(now - 10800000) }, { role: "assistant" as const, content: "يمكنك إرجاع المنتجات خلال ١٤ يوماً من الاستلام إذا كانت غير مستخدمة وغير مغسولة وفي الغلاف الأصلي. لبدء الإرجاع، تواصلي معنا برقم الطلب والسبب وسنرسل لك التعليمات.", timestamp: new Date(now - 10799900) }], customerName: "سارة", status: "closed" as const }
  ];
}

async function seed() {
  await connectDatabase();
  console.log("Seeding data (reference: Sawdah.eg)...\n");

  const { IMAGES, paymentProofUrl } = loadSeedImages();
  const localVideoUrl = await loadSeedVideos();
  if (localVideoUrl) console.log("Seed video ready (local):", localVideoUrl);
  const heroImage = IMAGES.hero1 || IMAGES.hero2 || IMAGES.hero3 || IMAGES.abaya1 || "";

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

  // ----- Cities (Egypt – all 27 governorates with name en/ar and deliveryFee) -----
  const citiesData = [
    { name: { en: "Cairo", ar: "القاهرة" }, deliveryFee: 35 },
    { name: { en: "Giza", ar: "الجيزة" }, deliveryFee: 35 },
    { name: { en: "Alexandria", ar: "الإسكندرية" }, deliveryFee: 50 },
    { name: { en: "Qalyubia", ar: "القليوبية" }, deliveryFee: 40 },
    { name: { en: "Dakahlia", ar: "الدقهلية" }, deliveryFee: 45 },
    { name: { en: "Sharqia", ar: "الشرقية" }, deliveryFee: 45 },
    { name: { en: "Gharbia", ar: "الغربية" }, deliveryFee: 40 },
    { name: { en: "Monufia", ar: "المنوفية" }, deliveryFee: 40 },
    { name: { en: "Beheira", ar: "البحيرة" }, deliveryFee: 45 },
    { name: { en: "Kafr El Sheikh", ar: "كفر الشيخ" }, deliveryFee: 45 },
    { name: { en: "Damietta", ar: "دمياط" }, deliveryFee: 48 },
    { name: { en: "Port Said", ar: "بورسعيد" }, deliveryFee: 55 },
    { name: { en: "Ismailia", ar: "الإسماعيلية" }, deliveryFee: 48 },
    { name: { en: "Suez", ar: "السويس" }, deliveryFee: 45 },
    { name: { en: "North Sinai", ar: "شمال سيناء" }, deliveryFee: 60 },
    { name: { en: "South Sinai", ar: "جنوب سيناء" }, deliveryFee: 65 },
    { name: { en: "Faiyum", ar: "الفيوم" }, deliveryFee: 45 },
    { name: { en: "Beni Suef", ar: "بني سويف" }, deliveryFee: 50 },
    { name: { en: "Minya", ar: "المنيا" }, deliveryFee: 50 },
    { name: { en: "Asyut", ar: "أسيوط" }, deliveryFee: 55 },
    { name: { en: "Sohag", ar: "سوهاج" }, deliveryFee: 55 },
    { name: { en: "Qena", ar: "قنا" }, deliveryFee: 58 },
    { name: { en: "Luxor", ar: "الأقصر" }, deliveryFee: 60 },
    { name: { en: "Aswan", ar: "أسوان" }, deliveryFee: 65 },
    { name: { en: "Red Sea", ar: "البحر الأحمر" }, deliveryFee: 65 },
    { name: { en: "New Valley", ar: "الوادي الجديد" }, deliveryFee: 70 },
    { name: { en: "Matrouh", ar: "مطروح" }, deliveryFee: 65 }
  ];
  await City.deleteMany({});
  await City.insertMany(citiesData);
  console.log(`Created ${citiesData.length} cities.`);

  // ----- Settings (store, content pages, hero, home collections) -----
  await Settings.deleteMany({});
  const contentPages = [
    {
      slug: "privacy",
      title: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
      content: {
        en: "<h2>Privacy Policy</h2><p>At Al-noon we respect your privacy. This policy explains how we collect, use, and protect your information.</p><h3>Information We Collect</h3><p>We collect only the information necessary to process your orders and improve your experience: name, email, phone, shipping address, and order history. We do not sell your data to third parties.</p><h3>How We Use Your Data</h3><p>Your data is used to fulfil orders, send order updates, respond to enquiries, and improve our website and services. With your consent, we may send you promotional emails; you can unsubscribe at any time.</p><h3>Security & Your Rights</h3><p>We use industry-standard measures to protect your data. You have the right to access, correct, or request deletion of your personal information. For any questions, contact us using the details on our Contact page.</p>",
        ar: "<h2>سياسة الخصوصية</h2><p>في النون نحترم خصوصيتك. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك.</p><h3>المعلومات التي نجمعها</h3><p>نجمع فقط المعلومات اللازمة لمعالجة طلباتك وتحسين تجربتك: الاسم، البريد الإلكتروني، الهاتف، عنوان الشحن، وسجل الطلبات. نحن لا نبيع بياناتك لأطراف ثالثة.</p><h3>كيف نستخدم بياناتك</h3><p>تُستخدم بياناتك لتنفيذ الطلبات وإرسال تحديثات الطلب والرد على الاستفسارات وتحسين موقعنا وخدماتنا. بموافقتك قد نرسل لك رسائل ترويجية؛ يمكنك إلغاء الاشتراك في أي وقت.</p><h3>الأمان وحقوقك</h3><p>نستخدم إجراءات معيارية لحماية بياناتك. لديك الحق في الوصول إلى بياناتك أو تصحيحها أو طلب حذفها. لأي استفسارات، تواصل معنا باستخدام التفاصيل في صفحة اتصل بنا.</p>"
      }
    },
    {
      slug: "return-policy",
      title: { en: "Return Policy", ar: "سياسة الإرجاع" },
      content: {
        en: "<h2>Return Policy</h2><p>We want you to be satisfied with your purchase. Please read the following conditions for returns and refunds.</p><h3>Eligibility</h3><p>Items can be returned within 14 days of delivery if unused, unwashed, and in original packaging with tags attached. Custom or personalised items may not be eligible for return.</p><h3>How to Return</h3><p>To start a return, contact us with your order number and reason. We will provide instructions for sending the item back. You are responsible for return shipping unless the item was defective or incorrect.</p><h3>Refunds</h3><p>Refunds are processed within 5–7 business days after we receive and inspect the returned item. The refund will be credited to your original payment method.</p>",
        ar: "<h2>سياسة الإرجاع</h2><p>نريدك أن تكون راضياً عن مشترياتك. يرجى قراءة الشروط التالية للإرجاع والاسترداد.</p><h3>الأهلية</h3><p>يمكن إرجاع المنتجات خلال 14 يوماً من الاستلام إذا كانت غير مستخدمة وغير مغسولة وفي الغلاف الأصلي مع البطاقات. قد لا تكون المنتجات المخصصة قابلة للإرجاع.</p><h3>كيفية الإرجاع</h3><p>لبدء إرجاع، تواصل معنا برقم الطلب والسبب. سنزودك بتعليمات إرسال المنتج. أنت مسؤول عن شحن الإرجاع ما لم يكن المنتج معيباً أو خاطئاً.</p><h3>الاسترداد</h3><p>تتم معالجة الاسترداد خلال 5–7 أيام عمل بعد استلامنا وفحص المنتج المرتجع. سيتم إرجاع المبلغ إلى وسيلة الدفع الأصلية.</p>"
      }
    },
    {
      slug: "shipping-policy",
      title: { en: "Shipping Policy", ar: "سياسة الشحن" },
      content: {
        en: "<h2>Shipping Policy</h2><p>We deliver across Egypt. Here is what you need to know about shipping and delivery.</p><h3>Delivery Areas & Fees</h3><p>Delivery fees vary by city and are calculated and shown at checkout. We ship to all governorates within Egypt.</p><h3>Processing Time</h3><p>Orders are typically dispatched within 1–2 business days after confirmation. For InstaPay orders, dispatch follows payment confirmation.</p><h3>Delivery Time</h3><p>Delivery usually takes 2–5 business days depending on your location. You will receive updates via email or phone when your order is on its way.</p><h3>Tracking</h3><p>Once your order is shipped, we will share tracking details when available so you can follow your delivery.</p>",
        ar: "<h2>سياسة الشحن</h2><p>نوصل إلى جميع أنحاء مصر. إليك ما تحتاج معرفته عن الشحن والتوصيل.</p><h3>مناطق التوصيل والرسوم</h3><p>رسوم التوصيل تختلف حسب المحافظة وتُحسب وتظهر عند إتمام الطلب. نشحن إلى جميع المحافظات داخل مصر.</p><h3>وقت المعالجة</h3><p>يتم إرسال الطلبات عادة خلال 1–2 يوم عمل بعد التأكيد. لطلبات إنستاباي، الإرسال يكون بعد تأكيد الدفع.</p><h3>وقت التوصيل</h3><p>التوصيل يستغرق عادة 2–5 أيام عمل حسب موقعك. ستتلقى تحديثات عبر البريد أو الهاتف عندما يكون طلبك في الطريق.</p><h3>التتبع</h3><p>بمجرد شحن طلبك، سنشارك تفاصيل التتبع عند توفرها حتى تتمكن من متابعة توصيلك.</p>"
      }
    },
    {
      slug: "about",
      title: { en: "About Us", ar: "من نحن" },
      content: {
        en: "<h2>About Al-noon</h2><p>Al-noon offers modest wear for every occasion—abayas, capes, malhafa, hijab, niqab, tarha, and more. We focus on quality, comfort, and style so you can feel confident and elegant.</p><h3>Our Story</h3><p>We started with a simple mission: to provide beautiful, well-made modest clothing that fits modern life. Every piece is chosen with care for fabric, fit, and durability.</p><h3>Our Values</h3><p>Quality craftsmanship, fair pricing, and respectful customer service are at the heart of what we do. We are here to help you find the right pieces for your wardrobe.</p><p>Thank you for choosing Al-noon. We are glad to have you with us.</p>",
        ar: "<h2>عن النون</h2><p>النون تقدم ملابس محتشمة لكل مناسبة—عبايات، كابات، ملحفة، حجاب، نقاب، طرح، والمزيد. نركز على الجودة والراحة والأناقة لتشعري بالثقة والأناقة.</p><h3>قصتنا</h3><p>بدأنا بمهمة بسيطة: تقديم ملابس محتشمة جميلة ومصنوعة جيداً تناسب الحياة العصرية. كل قطعة تُختار بعناية من حيث القماش والقص والمتانة.</p><h3>قيمنا</h3><p>الحرفية وجودة الصنع والأسعار العادلة وخدمة العملاء المحترمة في صميم ما نفعله. نحن هنا لمساعدتك في إيجاد القطع المناسبة لخزانتك.</p><p>شكراً لاختياركم النون. سعداء بوجودكم معنا.</p>"
      }
    },
    {
      slug: "contact",
      title: { en: "Contact Us", ar: "اتصل بنا" },
      content: {
        en: "<h2>Contact Us</h2><p>We would love to hear from you. Whether you have a question about an order, a product, or need help with returns—our team is here to help.</p><h3>Get in Touch</h3><p>Use the contact form on this page to send us your message. We aim to respond within 24–48 hours during business days.</p><h3>What to Include</h3><p>Please include your name, email, and order number (if your message is about an order). The more details you provide, the faster we can assist you.</p><h3>Other Ways to Reach Us</h3><p>You can also reach us via the social links in our footer. For urgent order-related issues, mention your order number so we can prioritise your request.</p><p>Thank you for being part of the Al-noon family.</p>",
        ar: "<h2>اتصل بنا</h2><p>نحن نحب أن نسمع منك. سواء كان لديك سؤال عن طلب أو منتج أو تحتاج مساعدة في الإرجاع—فريقنا هنا لمساعدتك.</p><h3>تواصل معنا</h3><p>استخدم نموذج الاتصال في هذه الصفحة لإرسال رسالتك. نهدف للرد خلال 24–48 ساعة خلال أيام العمل.</p><h3>ما الذي تتضمنه</h3><p>يرجى تضمين اسمك وبريدك الإلكتروني ورقم الطلب (إن كانت رسالتك عن طلب). كلما زادت التفاصيل التي تقدمها، أسرعنا في مساعدتك.</p><h3>طرق أخرى للوصول إلينا</h3><p>يمكنك أيضاً الوصول إلينا عبر روابط التواصل في التذييل. للمشكلات العاجلة المتعلقة بالطلب، اذكر رقم الطلب حتى نعطي طلبك أولوية.</p><p>شكراً لكونك جزءاً من عائلة النون.</p>"
      }
    }
  ];
  await Settings.create({
    storeName: { en: "Al-noon", ar: "النون" },
    logo: "/uploads/logos/default-logo.png",
    instaPayNumber: "+20 10 000 0000",
    paymentMethods: { cod: true, instaPay: true },
    lowStockThreshold: 5,
    stockInfoThreshold: 10,
    googleAnalyticsId: "",
    quickLinks: [
      { label: { en: "Privacy", ar: "الخصوصية" }, url: "/page/privacy" },
      { label: { en: "Return Policy", ar: "سياسة الإرجاع" }, url: "/page/return-policy" },
      { label: { en: "Shipping", ar: "الشحن" }, url: "/page/shipping-policy" },
      { label: { en: "About", ar: "من نحن" }, url: "/page/about" },
      { label: { en: "Contact", ar: "اتصل بنا" }, url: "/page/contact" }
    ],
    socialLinks: { facebook: "https://facebook.com", instagram: "https://instagram.com" },
    newsletterEnabled: true,
    hero: {
      images: [heroImage, IMAGES.hero2, IMAGES.hero3],
      videos: localVideoUrl ? [localVideoUrl] : [],
      title: { en: "Modest Wear for Every Occasion", ar: "ملابس محتشمة لكل مناسبة" },
      subtitle: { en: "Abayas, capes, hijab & more", ar: "عبايات، كابات، حجاب والمزيد" },
      ctaLabel: { en: "Shop Now", ar: "تسوق الآن" },
      ctaUrl: "/products"
    },
    heroEnabled: true,
    newArrivalsLimit: 8,
    newArrivalsSectionImages: [IMAGES.section1, IMAGES.section2, IMAGES.abaya1, IMAGES.hijab1],
    newArrivalsSectionVideos: localVideoUrl ? [localVideoUrl] : [],
    homeCollectionsDisplayLimit: 0,
    ourCollectionSectionImages: [IMAGES.section2, IMAGES.section3, IMAGES.cape1, IMAGES.fabric1],
    ourCollectionSectionVideos: localVideoUrl ? [localVideoUrl] : [],
    homeCollections: [
      { title: { en: "Abayas", ar: "عبايات" }, image: IMAGES.abaya1, hoverImage: IMAGES.abaya2, video: localVideoUrl || "", url: "/products?category=abayas", order: 1, categoryId: cat("Abayas")._id },
      { title: { en: "Capes", ar: "كابات" }, image: IMAGES.cape1, hoverImage: IMAGES.cape2, video: localVideoUrl || "", url: "/products?category=capes", order: 2, categoryId: cat("Capes")._id },
      { title: { en: "Hijab", ar: "حجاب" }, image: IMAGES.hijab1, hoverImage: IMAGES.hijab2, video: localVideoUrl || "", url: "/products?category=hijab", order: 3, categoryId: cat("Hijab")._id },
      { title: { en: "Malhafa", ar: "ملحفة" }, image: IMAGES.fabric1, hoverImage: IMAGES.fabric2, video: localVideoUrl || "", url: "/products?category=malhafa", order: 4, categoryId: cat("Malhafa")._id }
    ],
    announcementBar: {
      text: {
        en: "✨ Free Shipping on Orders Over 500 EGP — Al-noon  •  🌙 Ramadan Kareem  •  🎉 Free Shipping on Orders Over 500 EGP — Al-noon  •  🌙 Ramadan Kareem  •  ",
        ar: "✨ Free Shipping on Orders Over 500 EGP — Al-noon  •  🌙 Ramadan Kareem  •  🎉 Free Shipping on Orders Over 500 EGP — Al-noon  •  🌙 Ramadan Kareem  •  "
      },
      enabled: true,
      backgroundColor: DEFAULT_ANNOUNCEMENT_BAR_BACKGROUND
    },
    promoBanner: {
      enabled: true,
      image: IMAGES.hero2,
      title: { en: "New Season Collection", ar: "تشكيلة الموسم الجديد" },
      subtitle: { en: "Discover our latest modest wear", ar: "اكتشفي أحدث ملابسنا المحتشمة" },
      ctaLabel: { en: "Shop Now", ar: "تسوق الآن" },
      ctaUrl: "/products"
    },
    featuredProductsEnabled: true,
    featuredProductsLimit: 8,
    feedbackSectionEnabled: true,
    feedbackDisplayLimit: 6,
    orderNotificationsEnabled: true,
    orderNotificationEmail: ADMIN_EMAIL,
    aiAssistant: DEFAULT_AI_ASSISTANT,
    contentPages
  });
  console.log("Created settings (store, hero, content pages, announcementBar, promoBanner, aiAssistant, etc.).");

  // Each product gets 1 local video (no external HTTP links)
  const productVideos = localVideoUrl ? [localVideoUrl] : [];

  // ----- Products (all fields set; no nulls). Each product: 6 distinct images + 1 local video for detail gallery. -----
  const defaultDetails = { en: "Quality fabric. Care as per label.", ar: "قماش عالي الجودة. العناية حسب البطاقة." };
  const defaultStylingTip = { en: "Pair with our hijabs and accessories for a complete look.", ar: "زينيها مع حجاباتنا وإكسسواراتنا لمظهر كامل." };
  const fillProduct = (p: { sizes: string[]; images: string[]; imageColors?: string[] } & Record<string, unknown>) => ({
    ...p,
    imageColors: p.imageColors ?? p.images.map(() => ""),
    sizeDescriptions: p.sizes.map(() => ""),
    details: defaultDetails,
    stylingTip: defaultStylingTip,
    viewImage: p.images[0] ?? "",
    hoverImage: (p.images[1] ?? p.images[0]) ?? ""
  });

  await Product.deleteMany({});
  // Each product gets 6 distinct local images (gallery) + 1 local video. viewImage = images[0], hoverImage = images[1].
  const productList: Array<{ name: { en: string; ar: string }; description: { en: string; ar: string }; category: ReturnType<typeof cat>; price: number; discountPrice?: number; stock: number; status: "ACTIVE"; isNewArrival?: boolean; sizes: string[]; colors: string[]; imageColors?: string[] }> = [
    { name: { en: "Zipped Hooded Abaya", ar: "عباية زود هود" }, description: { en: "Classic zipped abaya with hood. Comfortable and modest.", ar: "عباية كلاسيكية بزود وهود. مريحة ومحتشمة." }, category: cat("Abayas"), price: 2100, stock: 15, status: "ACTIVE", isNewArrival: true, sizes: ["S", "M", "L", "XL"], colors: ["Black", "Navy", "Brown"], imageColors: ["Black", "Black", "Navy", "Navy", "Brown", "Brown"] },
    { name: { en: "Melton Abaya", ar: "عباية ميلتون" }, description: { en: "Elegant melton fabric abaya for winter.", ar: "عباية أنيقة من قماش ميلتون للشتاء." }, category: cat("Abayas"), price: 2100, stock: 12, status: "ACTIVE", isNewArrival: true, sizes: ["S", "M", "L"], colors: ["Black", "Grey"], imageColors: ["Black", "Black", "Black", "Grey", "Grey", "Grey"] },
    { name: { en: "Minimal Ribbed Abaya", ar: "عباية ريب مينيمال" }, description: { en: "Simple ribbed abaya, easy to style.", ar: "عباية ريب بسيطة، سهلة التنسيق." }, category: cat("Abayas"), price: 1450, stock: 20, status: "ACTIVE", isNewArrival: true, sizes: ["S", "M", "L", "XL"], colors: ["Black", "Navy", "Burgundy"], imageColors: ["Black", "Black", "Navy", "Navy", "Burgundy", "Burgundy"] },
    { name: { en: "Black Zip-Front Abaya", ar: "عباية سوداء زود أمامي" }, description: { en: "Black zip-front abaya, versatile and modern.", ar: "عباية سوداء زود أمامي، عصرية ومتعددة الاستخدام." }, category: cat("Abayas"), price: 1400, discountPrice: 2000, stock: 8, status: "ACTIVE", isNewArrival: false, sizes: ["S", "M", "L"], colors: ["Black"] },
    { name: { en: "Velvet Chemise Abaya", ar: "عباية مخمل شيميز" }, description: { en: "Luxurious velvet chemise-style abaya.", ar: "عباية مخملية على طراز الشيميز." }, category: cat("Abayas"), price: 1050, discountPrice: 2100, stock: 10, status: "ACTIVE", isNewArrival: false, sizes: ["M", "L"], colors: ["Black", "Burgundy", "Navy"], imageColors: ["Black", "Black", "Burgundy", "Burgundy", "Navy", "Navy"] },
    { name: { en: "Wool Cape", ar: "كاب صوف" }, description: { en: "Warm wool cape, essential for modest wardrobe.", ar: "كاب صوف دافئ، أساسي للخزانة المحتشمة." }, category: cat("Capes"), price: 950, discountPrice: 1900, stock: 14, status: "ACTIVE", isNewArrival: true, sizes: ["One Size"], colors: ["Black", "Grey", "Camel"], imageColors: ["Black", "Black", "Grey", "Grey", "Camel", "Camel"] },
    { name: { en: "Cape Hasna", ar: "كاب حَسَناء" }, description: { en: "Elegant cape with clean lines.", ar: "كاب أنيق بخطوط نظيفة." }, category: cat("Capes"), price: 2000, discountPrice: 2500, stock: 6, status: "ACTIVE", isNewArrival: true, sizes: ["One Size"], colors: ["Black", "Navy"], imageColors: ["Black", "Black", "Black", "Navy", "Navy", "Navy"] },
    { name: { en: "Classic Malhafa", ar: "ملحفة كلاسيكية" }, description: { en: "Traditional malhafa, cloak-style modest wear.", ar: "ملحفة تقليدية، عباءة محتشمة." }, category: cat("Malhafa"), price: 850, stock: 18, status: "ACTIVE", sizes: ["One Size"], colors: ["Black", "Navy", "Brown", "Grey"], imageColors: ["Black", "Black", "Navy", "Brown", "Grey", "Black"] },
    { name: { en: "Embroidered Malhafa", ar: "ملحفة مطرزة" }, description: { en: "Malhafa with subtle embroidery for special occasions.", ar: "ملحفة بتطريز خفيف للمناسبات." }, category: cat("Malhafa"), price: 1200, stock: 7, status: "ACTIVE", sizes: ["One Size"], colors: ["Black", "Burgundy"], imageColors: ["Black", "Black", "Black", "Burgundy", "Burgundy", "Burgundy"] },
    { name: { en: "Cotton Jersey Hijab", ar: "حجاب قطني جيرسي" }, description: { en: "Soft cotton jersey hijab, breathable and easy to wear.", ar: "حجاب قطني جيرسي ناعم، مريح وسهل الارتداء." }, category: cat("Hijab"), price: 120, stock: 50, status: "ACTIVE", sizes: ["One Size"], colors: ["Black", "Navy", "Grey", "Burgundy", "Dusty Pink"] },
    { name: { en: "Chiffon Hijab", ar: "حجاب شيفون" }, description: { en: "Light chiffon hijab for summer.", ar: "حجاب شيفون خفيف للصيف." }, category: cat("Hijab"), price: 95, stock: 40, status: "ACTIVE", sizes: ["One Size"], colors: ["Black", "White", "Nude", "Pink", "Blue"] },
    { name: { en: "Crinkle Hijab", ar: "حجاب كرينكل" }, description: { en: "Crinkle texture hijab, holds shape well.", ar: "حجاب ب texture كرينكل، يثبت الشكل جيداً." }, category: cat("Hijab"), price: 110, stock: 35, status: "ACTIVE", sizes: ["One Size"], colors: ["Black", "Navy", "Grey", "Brown"] },
    { name: { en: "Two-Piece Niqab", ar: "نقاب قطعتين" }, description: { en: "Classic two-piece niqab, breathable fabric.", ar: "نقاب كلاسيكي قطعتين، قماش قابل للتنفس." }, category: cat("Niqab"), price: 180, stock: 25, status: "ACTIVE", sizes: ["One Size"], colors: ["Black", "Navy", "Brown"] },
    { name: { en: "Niqab with Magnetic Closure", ar: "نقاب بمغناطيس" }, description: { en: "Niqab with magnetic closure for easy wear.", ar: "نقاب بإغلاق مغناطيسي لارتداء أسهل." }, category: cat("Niqab"), price: 220, stock: 15, status: "ACTIVE", sizes: ["One Size"], colors: ["Black"] },
    { name: { en: "Silk Tarha", ar: "طرح حرير" }, description: { en: "Light silk tarha (طرح) for hijab styling.", ar: "طرح حرير خفيف لتنسيق الحجاب." }, category: cat("Tarha / Veil"), price: 150, stock: 30, status: "ACTIVE", sizes: ["One Size"], colors: ["Black", "Navy", "Burgundy", "Gold"] },
    { name: { en: "Printed Tarha", ar: "طرح مطبوع" }, description: { en: "Printed tarha for a pop of color.", ar: "طرح مطبوع للمسة لونية." }, category: cat("Tarha / Veil"), price: 130, stock: 22, status: "ACTIVE", sizes: ["One Size"], colors: ["Multi", "Floral", "Geometric"] },
    { name: { en: "Black Ribbed Twin Set – Abaya & Cardigan", ar: "توأم ريب أسود – عباية وكارديجان" }, description: { en: "Matching abaya and cardigan set.", ar: "ست عباية وكارديجان متطابقين." }, category: cat("Sets"), price: 1450, discountPrice: 2900, stock: 9, status: "ACTIVE", sizes: ["S", "M", "L"], colors: ["Black"] },
    { name: { en: "Ribbed Kaftan", ar: "كافتان ريب" }, description: { en: "Comfortable ribbed kaftan, easy to layer.", ar: "كافتان ريب مريح، سهل الطبقات." }, category: cat("Sets"), price: 900, discountPrice: 1500, stock: 11, status: "ACTIVE", sizes: ["S", "M", "L"], colors: ["Black", "Navy", "Grey"], imageColors: ["Black", "Black", "Navy", "Navy", "Grey", "Grey"] },
    { name: { en: "Velvet Pleated Cardigan", ar: "كارديجان مخمل بليت" }, description: { en: "Velvet pleated cardigan for layering.", ar: "كارديجان مخمل بليت للطبقات." }, category: cat("Cardigans & Coats"), price: 1760, discountPrice: 2200, stock: 5, status: "ACTIVE", isNewArrival: true, sizes: ["S", "M", "L"], colors: ["Black", "Burgundy"], imageColors: ["Black", "Black", "Black", "Burgundy", "Burgundy", "Burgundy"] },
    { name: { en: "Flowy Open Cardigan", ar: "كارديجان مفتوح فضفاض" }, description: { en: "Light, flowy open cardigan.", ar: "كارديجان مفتوح خفيف وفضفاض." }, category: cat("Cardigans & Coats"), price: 1600, stock: 13, status: "ACTIVE", sizes: ["S", "M", "L"], colors: ["Black", "Grey", "Navy"], imageColors: ["Black", "Black", "Grey", "Grey", "Navy", "Navy"] },
    { name: { en: "Wool Coat", ar: "معطف صوف" }, description: { en: "Warm wool coat for winter.", ar: "معطف صوف دافئ للشتاء." }, category: cat("Cardigans & Coats"), price: 1080, discountPrice: 2700, stock: 4, status: "ACTIVE", sizes: ["S", "M", "L"], colors: ["Black", "Camel", "Grey"], imageColors: ["Black", "Black", "Camel", "Camel", "Grey", "Grey"] },
    { name: { en: "Melton Dress", ar: "فستان ميلتون" }, description: { en: "Elegant melton dress, modest and warm.", ar: "فستان ميلتون أنيق، محتشم ودافئ." }, category: cat("Abayas"), price: 2000, stock: 7, status: "ACTIVE", sizes: ["S", "M", "L"], colors: ["Black", "Navy"], imageColors: ["Black", "Black", "Black", "Navy", "Navy", "Navy"] }
  ];
  const productsData = productList.map((p, i) => {
    const images = getProductGalleryImages(IMAGES, i);
    return fillProduct({ ...p, images, videos: productVideos });
  });
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
  let insertedOrders: { _id: mongoose.Types.ObjectId; paymentMethod?: "COD" | "INSTAPAY"; status: string }[] = [];
  if (customerIds.length > 0 && products.length >= 3) {
    const now = new Date();
    const ordersData = [
      { user: customerIds[0], items: [{ product: products[0]._id, quantity: 1, price: 2100 }, { product: products[5]._id, quantity: 1, price: 950 }], total: 3085, deliveryFee: 35, status: "DELIVERED" as const, paymentMethod: "COD" as const, shippingAddress: "123 Main St, Cairo", createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { user: customerIds[1], items: [{ product: products[9]._id, quantity: 3, price: 120 }, { product: products[10]._id, quantity: 2, price: 95 }], total: 585, deliveryFee: 35, status: "CONFIRMED" as const, paymentMethod: "INSTAPAY" as const, shippingAddress: "45 Giza Ave, Giza", createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { user: customerIds[0], items: [{ product: products[2]._id, quantity: 1, price: 1450 }], total: 1485, deliveryFee: 35, status: "SHIPPED" as const, paymentMethod: "COD" as const, shippingAddress: "123 Main St, Cairo", createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { user: customerIds[2], items: [{ product: products[6]._id, quantity: 1, price: 2000 }, { product: products[19]._id, quantity: 1, price: 1760 }], total: 3810, deliveryFee: 50, status: "PENDING" as const, paymentMethod: "INSTAPAY" as const, shippingAddress: "78 Alexandria Rd, Alexandria", createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000) },
      { user: customerIds[1], items: [{ product: products[14]._id, quantity: 2, price: 180 }], total: 395, deliveryFee: 35, status: "DELIVERED" as const, paymentMethod: "COD" as const, shippingAddress: "45 Giza Ave, Giza", createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      { user: customerIds[2], items: [{ product: products[7]._id, quantity: 1, price: 850 }, { product: products[11]._id, quantity: 2, price: 110 }], total: 1105, deliveryFee: 45, status: "PENDING" as const, paymentMethod: "INSTAPAY" as const, shippingAddress: "12 Mansoura St, Mansoura", createdAt: new Date(now.getTime() - 0.25 * 24 * 60 * 60 * 1000) }
    ];
    insertedOrders = await Order.insertMany(ordersData);
    console.log(`Created ${insertedOrders.length} orders.`);
  }

  // ----- Payments (for Orders / Order detail pages; one per order) -----
  await Payment.deleteMany({});
  if (insertedOrders.length > 0) {
    const paymentsData = insertedOrders.map((order, index) => {
      const method = order.paymentMethod ?? "COD";
      // INSTAPAY: index 1 PAID (confirmed); others UNPAID. COD: PAID when DELIVERED/SHIPPED.
      const isInstaPay = method === "INSTAPAY";
      const status = isInstaPay
        ? (index === 1 ? "PAID" : "UNPAID")
        : (order.status === "DELIVERED" || order.status === "SHIPPED" ? "PAID" : "UNPAID");
      // New InstaPay unpaid order (index 5): seed a demo proof image for testing.
      const isInstaUnpaidWithProof = isInstaPay && status === "UNPAID" && index === 5;
      return {
        order: order._id,
        method,
        status: status as "UNPAID" | "PAID",
        ...(isInstaPay && status === "PAID" && index === 1
          ? { approvedAt: new Date(), approvedBy: admin!._id }
          : {}),
        ...(isInstaUnpaidWithProof && paymentProofUrl ? { instaPayProofUrl: paymentProofUrl } : {})
      };
    });
    await Payment.insertMany(paymentsData);
    console.log(`Created ${paymentsData.length} payments.`);
  }

  // ----- Contact form submissions (all fields set; phone never null) -----
  await ContactSubmission.deleteMany({});
  const contactData = [
    { name: "Noura Mohamed", email: "noura.m@example.com", phone: "+20 100 111 2233", comment: "When will the Melton Abaya be back in size M? Thank you." },
    { name: "Heba Ali", email: "heba.ali@example.com", phone: "", comment: "Do you ship to Alexandria? What is the delivery time?" },
    { name: "Aisha Hassan", email: "aisha.h@example.com", phone: "+20 122 333 4455", comment: "I would like to exchange my order #1234 for a different color. How can I do that?" },
    { name: "Yasmin Ibrahim", email: "yasmin@example.com", phone: "+20 155 666 7788", comment: "Great quality! When will you have more Wool Cape in Camel?" },
    { name: "Layla Ahmed", email: "layla.a@example.com", phone: "", comment: "Do you have a physical store? I would like to try the abayas before buying." },
    { name: "Dina Mahmoud", email: "dina.m@example.com", phone: "+20 111 222 3344", comment: "Do you offer gift wrapping? I need a present for my sister." }
  ];
  await ContactSubmission.insertMany(contactData);
  console.log(`Created ${contactData.length} contact submissions.`);

  // ----- Newsletter subscribers (Subscribers page) -----
  await Subscriber.deleteMany({});
  const subscribersData = [
    { email: "sara.ahmed@example.com" },
    { email: "fatma.hassan@example.com" },
    { email: "mariam.ali@example.com" },
    { email: "newsletter@example.com" },
    { email: "customer1@test.com" },
    { email: "customer2@test.com" },
    { email: "subscriber@alnoon.local" }
  ];
  await Subscriber.insertMany(subscribersData);
  console.log(`Created ${subscribersData.length} subscribers.`);

  // ----- Product feedback (for Feedback page and storefront) -----
  await ProductFeedback.deleteMany({});
  const feedbackData = [
    { product: products[0]._id, customerName: "Sara Ahmed", message: "The Zipped Hooded Abaya is exactly what I was looking for. Great quality and perfect fit!", rating: 5, approved: true, order: 1 },
    { product: products[0]._id, customerName: "Fatma Hassan", message: "Very comfortable and modest. Will order again.", rating: 5, approved: true, order: 2 },
    { product: products[1]._id, customerName: "Mariam Ali", message: "Melton Abaya is warm and elegant. Love it for winter.", rating: 5, approved: true, order: 1 },
    { product: products[5]._id, customerName: "Noura Mohamed", message: "Wool Cape is a must-have. Goes with everything.", rating: 4, approved: true, order: 3 },
    { product: products[9]._id, customerName: "Heba Ali", message: "Cotton Jersey Hijab is so soft and breathable. Best hijab I've bought.", rating: 5, approved: true, order: 4 },
    { product: products[6]._id, customerName: "Aisha Hassan", message: "Cape Hasna is beautiful. A bit pricey but worth it.", rating: 4, approved: false, order: 0 },
    { product: products[2]._id, customerName: "Yasmin Ibrahim", message: "Minimal Ribbed Abaya – simple and easy to wear daily.", rating: 5, approved: true, order: 5 },
    { product: products[14]._id, customerName: "Layla Ahmed", message: "Two-Piece Niqab fits well and the fabric is comfortable.", rating: 4, approved: false, order: 0 },
    { product: products[19]._id, customerName: "Dina Mahmoud", message: "Velvet Pleated Cardigan is stunning. Perfect for layering.", rating: 5, approved: true, order: 6 }
  ];
  await ProductFeedback.insertMany(feedbackData);
  console.log(`Created ${feedbackData.length} product feedback entries.`);

  // ----- AI chat sessions (sample conversations with product cards) -----
  await ChatSession.deleteMany({});
  const productsForChat = products.slice(0, 4).map((p) => ({ _id: p._id, name: p.name, images: p.images }));
  const chatSessions = buildChatSessions(productsForChat);
  await ChatSession.insertMany(chatSessions);
  console.log(`Created ${chatSessions.length} AI chat sessions.`);

  console.log("\nSeed completed. All data seeded with no null required fields.");
  console.log("Log in with:", ADMIN_EMAIL, "/", ADMIN_PASSWORD);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
