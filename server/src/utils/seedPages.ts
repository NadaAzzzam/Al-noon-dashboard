/**
 * Content pages seeder for Al-noon dashboard.
 * Seeds only Settings.contentPages (and matching quickLinks) for:
 * Privacy, Return Policy, Shipping Policy, About Us, Contact.
 * Run: npm run seed:pages
 */

import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { Settings } from "../models/Settings.js";

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

const quickLinks = [
  { label: { en: "Privacy", ar: "الخصوصية" }, url: "/page/privacy" },
  { label: { en: "Return Policy", ar: "سياسة الإرجاع" }, url: "/page/return-policy" },
  { label: { en: "Shipping", ar: "الشحن" }, url: "/page/shipping-policy" },
  { label: { en: "About", ar: "من نحن" }, url: "/page/about" },
  { label: { en: "Contact", ar: "اتصل بنا" }, url: "/page/contact" }
];

async function seedPages() {
  await connectDatabase();
  console.log("Seeding content pages...\n");

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      storeName: { en: "Al-noon", ar: "النون" },
      instaPayNumber: "",
      paymentMethods: { cod: true, instaPay: true },
      lowStockThreshold: 5,
      stockInfoThreshold: 10,
      quickLinks,
      contentPages
    });
    console.log("Created new Settings with all content pages and quick links.");
  } else {
    await Settings.updateOne(
      { _id: settings._id },
      { $set: { contentPages, quickLinks } }
    );
    console.log("Updated existing Settings with all content pages and quick links.");
  }

  console.log(`\nSeeded ${contentPages.length} pages: ${contentPages.map((p) => p.slug).join(", ")}`);
  console.log("Storefront URLs: /page/privacy, /page/return-policy, /page/shipping-policy, /page/about, /page/contact");
  console.log("\nPages seed completed.");
  await mongoose.disconnect();
  process.exit(0);
}

seedPages().catch((err) => {
  console.error("Pages seed failed:", err);
  process.exit(1);
});
