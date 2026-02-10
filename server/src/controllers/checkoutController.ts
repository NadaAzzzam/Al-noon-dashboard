import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

/**
 * GET /api/shipping-methods
 * Returns available shipping methods with prices.
 * Currently returns static data; can be made dynamic via DB later.
 */
export const listShippingMethods = asyncHandler(async (req, res) => {
  const methods = [
    {
      id: "standard",
      name: { en: "Standard", ar: "عادي" },
      description: { en: "Delivery in 3–5 business days", ar: "التوصيل خلال ٣-٥ أيام عمل" },
      estimatedDays: "3-5"
    },
    {
      id: "express",
      name: { en: "Express", ar: "سريع" },
      description: { en: "Delivery in 1–2 business days", ar: "التوصيل خلال ١-٢ يوم عمل" },
      estimatedDays: "1-2"
    }
  ];

  sendResponse(res, req.locale, { data: methods });
});

/**
 * Egyptian governorates — full list (Egypt only, no country selection needed).
 */
const EGYPT_GOVERNORATES = [
  { id: "cairo", name: { en: "Cairo", ar: "القاهرة" } },
  { id: "giza", name: { en: "Giza", ar: "الجيزة" } },
  { id: "alexandria", name: { en: "Alexandria", ar: "الإسكندرية" } },
  { id: "qalyubia", name: { en: "Qalyubia", ar: "القليوبية" } },
  { id: "dakahlia", name: { en: "Dakahlia", ar: "الدقهلية" } },
  { id: "sharqia", name: { en: "Sharqia", ar: "الشرقية" } },
  { id: "gharbia", name: { en: "Gharbia", ar: "الغربية" } },
  { id: "monufia", name: { en: "Monufia", ar: "المنوفية" } },
  { id: "beheira", name: { en: "Beheira", ar: "البحيرة" } },
  { id: "kafr-el-sheikh", name: { en: "Kafr El Sheikh", ar: "كفر الشيخ" } },
  { id: "damietta", name: { en: "Damietta", ar: "دمياط" } },
  { id: "port-said", name: { en: "Port Said", ar: "بورسعيد" } },
  { id: "ismailia", name: { en: "Ismailia", ar: "الإسماعيلية" } },
  { id: "suez", name: { en: "Suez", ar: "السويس" } },
  { id: "north-sinai", name: { en: "North Sinai", ar: "شمال سيناء" } },
  { id: "south-sinai", name: { en: "South Sinai", ar: "جنوب سيناء" } },
  { id: "faiyum", name: { en: "Faiyum", ar: "الفيوم" } },
  { id: "beni-suef", name: { en: "Beni Suef", ar: "بني سويف" } },
  { id: "minya", name: { en: "Minya", ar: "المنيا" } },
  { id: "asyut", name: { en: "Asyut", ar: "أسيوط" } },
  { id: "sohag", name: { en: "Sohag", ar: "سوهاج" } },
  { id: "qena", name: { en: "Qena", ar: "قنا" } },
  { id: "luxor", name: { en: "Luxor", ar: "الأقصر" } },
  { id: "aswan", name: { en: "Aswan", ar: "أسوان" } },
  { id: "red-sea", name: { en: "Red Sea", ar: "البحر الأحمر" } },
  { id: "new-valley", name: { en: "New Valley", ar: "الوادي الجديد" } },
  { id: "matrouh", name: { en: "Matrouh", ar: "مطروح" } }
];

/**
 * GET /api/governorates
 * Returns the list of Egyptian governorates (Egypt only — no country needed).
 */
export const listGovernorates = asyncHandler(async (req, res) => {
  sendResponse(res, req.locale, { data: EGYPT_GOVERNORATES });
});
