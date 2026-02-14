import type { ChatIntent } from "./chatIntents.js";

export type ResponseLocale = "en" | "ar";

export interface ChatResponseData {
  storeName: { en: string; ar: string };
  contentPages: { slug: string; title: { en?: string; ar?: string }; content: { en?: string; ar?: string } }[];
  paymentMethods: { cod: boolean; instaPay: boolean };
  instaPayNumber: string;
  socialLinks: { facebook?: string; instagram?: string };
  cities: { name: { en?: string; ar?: string }; deliveryFee: number }[];
  categories: { name: { en?: string; ar?: string } }[];
}

/** Wrap plain text in <p> and convert • lines to <ul><li> for HTML response (ecom can render as HTML). */
function toHtml(text: string): string {
  const withStrong = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = withStrong.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith("• ")) {
      if (!inList) {
        items.push("<ul>");
        inList = true;
      }
      items.push(`<li>${line.slice(2)}</li>`);
    } else {
      if (inList) {
        items.push("</ul>");
        inList = false;
      }
      items.push(`<p>${line}</p>`);
    }
  }
  if (inList) items.push("</ul>");
  return items.join("");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getContentPage(
  data: ChatResponseData,
  slug: string,
  locale: ResponseLocale
): { title: string; content: string } | null {
  const page = data.contentPages.find((p) => p.slug === slug);
  if (!page) return null;
  const title = locale === "ar" ? (page.title.ar ?? page.title.en) : (page.title.en ?? page.title.ar);
  const content = locale === "ar" ? (page.content.ar ?? page.content.en) : (page.content.en ?? page.content.ar);
  return { title: title ?? slug, content: stripHtml(content ?? "").slice(0, 500) };
}

/**
 * Build response based on intent (rule-based, no AI).
 */
export function buildResponse(
  intent: ChatIntent,
  data: ChatResponseData,
  locale: ResponseLocale,
  extractedData?: Record<string, unknown>
): string {
  const storeName = locale === "ar" ? data.storeName.ar : data.storeName.en;

  switch (intent) {
    case "greeting":
      return toHtml(locale === "ar"
        ? `مرحباً! 👋 أنا مساعد ${storeName}. ازاي أقدر أساعدك النهاردة؟`
        : `Hello! 👋 I'm ${storeName}'s assistant. How can I help you today?`);

    case "thanks":
      return toHtml(locale === "ar"
        ? `العفو! 😊 لو عندك أي سؤال تاني، أنا هنا.`
        : `You're welcome! 😊 If you have any other questions, I'm here to help.`);

    case "shipping_policy": {
      const page = getContentPage(data, "shipping-policy", locale);
      if (page?.content) {
        return toHtml(locale === "ar"
          ? `📦 **${page.title}**\n\n${page.content}\n\nلو عندك سؤال محدد، قولي!`
          : `📦 **${page.title}**\n\n${page.content}\n\nLet me know if you have specific questions!`);
      }
      return toHtml(locale === "ar"
        ? `📦 عادةً بنوصل الطلبات في خلال 3-7 أيام حسب المنطقة. لو عايز تعرف أكتر عن منطقتك، قولي المدينة!`
        : `📦 We typically deliver orders within 3-7 days depending on your area. Let me know your city for specific details!`);
    }

    case "return_policy": {
      const page = getContentPage(data, "return-policy", locale);
      if (page?.content) {
        return toHtml(locale === "ar"
          ? `🔄 **${page.title}**\n\n${page.content}\n\nلو محتاج مساعدة في إرجاع، قولي!`
          : `🔄 **${page.title}**\n\n${page.content}\n\nLet me know if you need help with a return!`);
      }
      return toHtml(locale === "ar"
        ? `🔄 نقدر نستقبل المرتجعات خلال 14 يوم من استلام الطلب. تواصل معانا وهنساعدك!`
        : `🔄 We accept returns within 14 days of receiving your order. Contact us and we'll help you!`);
    }

    case "payment_methods": {
      const methods: string[] = [];
      if (data.paymentMethods.cod) {
        methods.push(locale === "ar" ? "💵 الدفع عند الاستلام (COD)" : "💵 Cash on Delivery (COD)");
      }
      if (data.paymentMethods.instaPay) {
        methods.push(locale === "ar" ? "📱 InstaPay" : "📱 InstaPay");
        if (data.instaPayNumber) {
          methods.push(
            locale === "ar"
              ? `رقم InstaPay: ${data.instaPayNumber}`
              : `InstaPay number: ${data.instaPayNumber}`
          );
        }
      }
      if (methods.length === 0) {
        return toHtml(locale === "ar"
          ? `للأسف مش شايف طرق دفع متاحة حالياً. تواصل معانا!`
          : `Sorry, I don't see available payment methods right now. Please contact us!`);
      }
      return toHtml(locale === "ar"
        ? `💳 **طرق الدفع المتاحة:**\n\n${methods.map((m) => `• ${m}`).join("\n")}\n\nاختار اللي يناسبك عند الطلب!`
        : `💳 **Available payment methods:**\n\n${methods.map((m) => `• ${m}`).join("\n")}\n\nChoose what works for you at checkout!`);
    }

    case "delivery_fees": {
      if (data.cities.length === 0) {
        return toHtml(locale === "ar"
          ? `🚚 مصاريف الشحن بتختلف حسب المنطقة. قولي مدينتك وهقولك التكلفة!`
          : `🚚 Delivery fees vary by area. Tell me your city and I'll give you the exact cost!`);
      }
      const citiesList = data.cities
        .slice(0, 10)
        .map((c) => {
          const name = locale === "ar" ? (c.name.ar ?? c.name.en) : (c.name.en ?? c.name.ar);
          return locale === "ar" ? `• ${name}: ${c.deliveryFee} جنيه` : `• ${name}: ${c.deliveryFee} EGP`;
        })
        .join("\n");
      return toHtml(locale === "ar"
        ? `🚚 **مصاريف التوصيل:**\n\n${citiesList}\n\nلو مدينتك مش موجودة، قولي!`
        : `🚚 **Delivery fees:**\n\n${citiesList}\n\nLet me know if your city isn't listed!`);
    }

    case "delivery_city": {
      const cityName = extractedData?.cityName as string | undefined;
      if (cityName) {
        const city = data.cities.find((c) => {
          const en = normalizeForMatch(c.name.en ?? "");
          const ar = normalizeForMatch(c.name.ar ?? "");
          const q = normalizeForMatch(cityName);
          return en.includes(q) || ar.includes(q) || q.includes(en) || q.includes(ar);
        });
        if (city) {
          const name = locale === "ar" ? (city.name.ar ?? city.name.en) : (city.name.en ?? city.name.ar);
          return toHtml(locale === "ar"
            ? `✅ أيوه! بنوصل ل${name}. مصاريف الشحن: ${city.deliveryFee} جنيه.`
            : `✅ Yes! We deliver to ${name}. Delivery fee: ${city.deliveryFee} EGP.`);
        }
      }
      return toHtml(locale === "ar"
        ? `📍 بنوصل لمعظم مدن مصر! قولي مدينتك وهقولك لو بنوصل ومصاريف الشحن كام.`
        : `📍 We deliver to most cities in Egypt! Tell me your city and I'll check if we deliver there and the fee.`);
    }

    case "contact_info": {
      const parts: string[] = [];
      if (data.socialLinks.facebook) {
        parts.push(locale === "ar" ? `• 📘 فيسبوك: ${data.socialLinks.facebook}` : `• 📘 Facebook: ${data.socialLinks.facebook}`);
      }
      if (data.socialLinks.instagram) {
        parts.push(locale === "ar" ? `• 📸 انستجرام: ${data.socialLinks.instagram}` : `• 📸 Instagram: ${data.socialLinks.instagram}`);
      }
      const page = getContentPage(data, "contact", locale);
      if (page?.content) {
        parts.push(page.content);
      }
      if (parts.length === 0) {
        return toHtml(locale === "ar"
          ? `📞 للتواصل، ابعت لنا رسالة على صفحة التواصل في الموقع!`
          : `📞 To contact us, send a message through the contact page on our website!`);
      }
      return toHtml(locale === "ar"
        ? `📞 **طرق التواصل:**\n\n${parts.join("\n")}`
        : `📞 **Contact us:**\n\n${parts.join("\n")}`);
    }

    case "about_us": {
      const page = getContentPage(data, "about", locale);
      if (page?.content) {
        return toHtml(locale === "ar"
          ? `ℹ️ **${page.title}**\n\n${page.content}`
          : `ℹ️ **${page.title}**\n\n${page.content}`);
      }
      return toHtml(locale === "ar"
        ? `ℹ️ احنا ${storeName}، متجر مصري متخصص في بيع منتجات عالية الجودة. اتصفح الموقع وشوف منتجاتنا!`
        : `ℹ️ We're ${storeName}, an Egyptian store specialized in high-quality products. Browse our site and check out our products!`);
    }

    case "privacy_policy": {
      const page = getContentPage(data, "privacy", locale);
      if (page?.content) {
        return toHtml(locale === "ar"
          ? `🔒 **${page.title}**\n\n${page.content}`
          : `🔒 **${page.title}**\n\n${page.content}`);
      }
      return toHtml(locale === "ar"
        ? `🔒 بياناتك آمنة معانا. بنستخدم معلوماتك الشخصية فقط لإتمام طلبك والتواصل معاك.`
        : `🔒 Your data is safe with us. We only use your personal information to process your order and communicate with you.`);
    }

    case "order_status":
      return toHtml(locale === "ar"
        ? `📦 لمعرفة حالة طلبك، دخل على حسابك في الموقع أو تواصل معانا وقول رقم الطلب. للأسف مش قادر أشوف تفاصيل طلبات معينة.`
        : `📦 To check your order status, log in to your account on the website or contact us with your order number. Unfortunately, I can't access specific order details.`);

    case "product_search": {
      const keywords = extractedData?.productKeywords as string[] | undefined;
      if (keywords?.length) {
        return toHtml(locale === "ar"
          ? `🔍 عايز تدور على "${keywords.join(", ")}"؟ اتفضل دور في الموقع أو شوف الفئات وهتلاقي اللي عايزه!`
          : `🔍 Looking for "${keywords.join(", ")}"? Browse our website or check the categories to find what you need!`);
      }
      return toHtml(locale === "ar"
        ? `🔍 اتفضل دور في الموقع أو قولي ايه المنتج اللي بتدور عليه وهساعدك!`
        : `🔍 Browse our website or tell me what product you're looking for and I'll help!`);
    }

    case "category_list": {
      if (data.categories.length === 0) {
        return toHtml(locale === "ar"
          ? `📂 عندنا تشكيلة منتجات متنوعة. اتصفح الموقع وشوف!`
          : `📂 We have a variety of products. Browse the website and see!`);
      }
      const catList = data.categories
        .slice(0, 10)
        .map((c) => {
          const name = locale === "ar" ? (c.name.ar ?? c.name.en) : (c.name.en ?? c.name.ar);
          return `• ${name}`;
        })
        .join("\n");
      return toHtml(locale === "ar"
        ? `📂 **الفئات المتاحة:**\n\n${catList}\n\nاتصفح الموقع وشوف المنتجات!`
        : `📂 **Available categories:**\n\n${catList}\n\nBrowse the website to see products!`);
    }

    case "help":
      return toHtml(locale === "ar"
        ? `💡 أقدر أساعدك في:\n• معلومات الشحن والتوصيل\n• سياسة الإرجاع\n• طرق الدفع\n• التواصل معانا\n• الفئات والمنتجات\n\nقولي ايه اللي محتاج تعرفه!`
        : `💡 I can help you with:\n• Shipping & delivery info\n• Return policy\n• Payment methods\n• Contact details\n• Categories & products\n\nLet me know what you need!`);

    case "unknown":
    default:
      return toHtml(locale === "ar"
        ? `🤔 معلش، مش فاهم سؤالك كويس. ممكن تسأل عن:\n• الشحن والتوصيل\n• الإرجاع والاستبدال\n• طرق الدفع\n• معلومات التواصل\n• المنتجات والفئات\n\nأو اتصل بينا مباشرة!`
        : `🤔 Sorry, I didn't quite understand your question. You can ask about:\n• Shipping & delivery\n• Returns & exchanges\n• Payment methods\n• Contact info\n• Products & categories\n\nOr contact us directly!`);
  }
}
