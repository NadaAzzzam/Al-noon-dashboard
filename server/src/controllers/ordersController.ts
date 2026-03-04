import { Order, type OrderStatus } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { User } from "../models/User.js";
import { DiscountCode } from "../models/DiscountCode.js";
import { validateAndComputeDiscount, recordDiscountUsage, type DiscountIdentity } from "../utils/discountUtils.js";
import { City } from "../models/City.js";
import { ShippingMethod } from "../models/ShippingMethod.js";
import mongoose from "mongoose";
import { isDbConnected } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { sendMail } from "../utils/email.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import {
  buildOrderConfirmationEmailHtml,
  buildAdminOrderNotificationEmailHtml,
  getEmailBrandingFromSettings
} from "../utils/emailTemplates.js";
import { orderSchema } from "../validators/orders.js";
import type { z } from "zod";
import type { AuthPayload } from "../middlewares/auth.js";
import { getDefaultLocale, type Locale } from "../i18n.js";

const locale = (req: unknown): Locale => ((req as { locale?: unknown }).locale ?? getDefaultLocale()) as Locale;

export const listOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, locale(req), {
      data: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    });
  }
  const auth = (req as { auth?: AuthPayload }).auth;
  const isAdmin = auth?.role === "ADMIN";
  const filter: Record<string, unknown> = isAdmin ? {} : { user: auth?.userId };

  const query = (req.query ?? {}) as Record<string, unknown>;
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const status = query.status as string | undefined;
  const paymentMethod = query.paymentMethod as string | undefined;
  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name price discountPrice images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  const orderIds = orders.map((o) => (o as { _id: unknown })._id);
  const payments = await Payment.find({ order: { $in: orderIds } }).lean();
  const paymentByOrder = Object.fromEntries(
    payments.map((p) => {
      const oid = (p as { order: { toString: () => string } }).order;
      return [typeof oid === "object" && oid && "toString" in oid ? oid.toString() : String(oid), p];
    })
  );

  const withPayment = orders.map((o) => {
    const ord = o as { _id: { toString: () => string }; paymentMethod?: string };
    const pay = paymentByOrder[ord._id.toString()];
    return {
      ...ord,
      payment: pay
        ? {
          method: (pay as { method: string }).method,
          status: (pay as { status: string }).status,
          instaPayProofUrl: (pay as { instaPayProofUrl?: string }).instaPayProofUrl
        }
        : ord.paymentMethod
          ? { method: ord.paymentMethod, status: "UNPAID" as const }
          : undefined
    };
  });

  sendResponse(res, locale(req), {
    data: withPayment,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

const DELETED_PRODUCT_PLACEHOLDER = { name: { en: "Deleted product", ar: "منتج محذوف" } } as const;

function normalizeOrderItemProduct(item: { product: unknown; quantity: number; price: number }) {
  const product = item.product;
  if (product && typeof product === "object" && !Array.isArray(product) && "name" in product) {
    const p = product as { _id?: unknown; name?: { en?: string; ar?: string }; images?: string[]; price?: number; discountPrice?: number };
    return {
      _id: p._id != null ? String(p._id) : undefined,
      name: p.name && typeof p.name === "object" ? { en: p.name.en ?? "", ar: p.name.ar ?? "" } : DELETED_PRODUCT_PLACEHOLDER.name,
      images: Array.isArray(p.images) ? p.images : [],
      ...(p.price !== undefined && { price: p.price }),
      ...(p.discountPrice !== undefined && { discountPrice: p.discountPrice })
    };
  }
  const id = product != null && typeof product === "object" && "_id" in product
    ? String((product as { _id: unknown })._id)
    : product != null ? String(product) : "";
  return { _id: id, ...DELETED_PRODUCT_PLACEHOLDER, images: [] as string[] };
}

export const getOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const orderId = req.params?.id;
  if (!orderId) throw new ApiError(400, "Order ID is required", { code: "errors.common.validation_error" });
  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("items.product", "_id name price discountPrice images");
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  const auth = (req as { auth?: AuthPayload }).auth;
  const isAdmin = auth?.role === "ADMIN";
  const orderUserId = order.user && typeof order.user === "object" && order.user._id
    ? order.user._id.toString()
    : (order.user && typeof order.user.toString === "function" ? order.user.toString() : null);
  if (!isAdmin && orderUserId !== auth?.userId) {
    throw new ApiError(403, "Forbidden", { code: "errors.common.forbidden" });
  }
  const payment = await Payment.findOne({ order: order._id }).lean();
  const orderObj = order.toObject();
  const items = Array.isArray(orderObj.items) ? orderObj.items.map((item: { product: unknown; quantity: number; price: number }) => ({
    ...item,
    product: normalizeOrderItemProduct(item)
  })) : orderObj.items;
  sendResponse(res, locale(req), {
    data: {
      order: {
        ...orderObj,
        items,
        payment: payment ?? (order.paymentMethod ? { method: order.paymentMethod, status: "UNPAID" } : undefined)
      }
    }
  });
});

/**
 * GET /api/orders/guest/:id?email=xxx – Public guest order lookup.
 * Allows guests to view order confirmation after tab close (alternative to sessionStorage).
 * Requires email query param to match order email for security.
 */
export const getGuestOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const query = (req.query ?? {}) as Record<string, unknown>;
  const email = typeof query.email === "string" ? query.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Valid email query parameter is required", { code: "errors.order.guest_email_required" });
  }
  const orderId = req.params?.id;
  if (!orderId) throw new ApiError(400, "Order ID is required", { code: "errors.common.validation_error" });
  const order = await Order.findById(orderId)
    .populate("items.product", "_id name price discountPrice images")
    .lean();
  if (!order) throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  const o = order as { user?: unknown; email?: string; guestEmail?: string; paymentMethod?: string; items?: { product: unknown; quantity: number; price: number }[] };
  if (o.user != null) {
    throw new ApiError(403, "Use authenticated order endpoint for logged-in orders", { code: "errors.common.forbidden" });
  }
  const orderEmail = (o.email ?? o.guestEmail ?? "").trim().toLowerCase();
  if (orderEmail !== email) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  const items = Array.isArray(o.items)
    ? o.items.map((item) => ({
      ...item,
      product: normalizeOrderItemProduct(item)
    }))
    : o.items;
  const payment = await Payment.findOne({ order: order._id }).lean();
  sendResponse(res, locale(req), {
    data: {
      order: {
        ...order,
        id: (order as { _id?: unknown })._id?.toString?.() ?? orderId,
        items,
        payment: payment ?? (o.paymentMethod ? { method: o.paymentMethod, status: "UNPAID" } : undefined)
      }
    }
  });
});

/** Format a structured address for display in emails / fallback text */
function formatAddress(addr: unknown): string {
  if (!addr) return "—";
  if (typeof addr === "string") return addr || "—";
  const a = addr as { address?: string; apartment?: string; city?: string; postalCode?: string };
  const parts = [a.address, a.apartment, a.city, a.postalCode].filter(Boolean);
  return parts.join(", ") + ", Egypt";
}

/** True if string looks like a MongoDB ObjectId (24 hex chars). */
function isObjectIdLike(s: unknown): s is string {
  return typeof s === "string" && /^[a-fA-F0-9]{24}$/.test(s);
}

export const createOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const body = req.body as z.infer<typeof orderSchema>["body"];
  let {
    items, paymentMethod, shippingAddress, deliveryFee,
    guestName, guestEmail, guestPhone,
    // New structured checkout fields
    email: bodyEmail, firstName, lastName, phone,
    billingAddress, specialInstructions, shippingMethod,
    emailNews, textNews,
    discountCode: bodyDiscountCode
  } = body;

  // Only attach a user to the order when userId is a valid MongoDB ObjectId (e.g. "dev-admin" must not be stored)
  const auth = (req as { auth?: AuthPayload }).auth;
  const effectiveUserId = auth?.userId && isObjectIdLike(auth.userId) ? auth.userId : null;
  const isGuest = !effectiveUserId;

  // Logged-in user (real DB user): backfill contact from account when not provided
  if (!isGuest && effectiveUserId) {
    const hasContact = !!(firstName || lastName || bodyEmail);
    if (!hasContact) {
      const user = await User.findById(effectiveUserId).select("name email").lean();
      if (user) {
        const u = user as { name?: string; email?: string };
        const nameParts = (u.name ?? "").trim().split(/\s+/);
        firstName = nameParts[0] ?? "";
        lastName = nameParts.slice(1).join(" ") ?? "";
        bodyEmail = (u.email ?? "").trim().toLowerCase();
      }
    }
  }

  // Ecommerce checkout often sends city as city _id (select value). Resolve to city name for display/emails.
  if (shippingAddress && typeof shippingAddress === "object" && !Array.isArray(shippingAddress)) {
    const addr = shippingAddress as { address?: string; apartment?: string; city?: string; postalCode?: string; country?: string };
    if (addr.city && isObjectIdLike(addr.city)) {
      const cityDoc = await City.findById(addr.city).select("name").lean();
      if (cityDoc) {
        const name = (cityDoc as { name?: { en?: string; ar?: string } }).name;
        const cityName = name?.en ?? name?.ar ?? addr.city;
        shippingAddress = {
          address: addr.address ?? "",
          apartment: addr.apartment ?? "",
          city: cityName,
          postalCode: addr.postalCode ?? "",
          country: addr.country ?? "Egypt"
        };
      }
    }
  }

  // Backward compat: if new fields present, derive guestName/guestEmail/guestPhone from them
  const hasNewFields = !!(firstName || lastName || bodyEmail);

  if (isGuest) {
    // Allow new structured fields to satisfy guest requirement
    const name = hasNewFields
      ? [firstName, lastName].filter(Boolean).join(" ").trim()
      : typeof guestName === "string" ? guestName.trim() : "";
    const emailVal = hasNewFields
      ? (typeof bodyEmail === "string" ? bodyEmail.trim().toLowerCase() : "")
      : (typeof guestEmail === "string" ? guestEmail.trim().toLowerCase() : "");

    if (!name) throw new ApiError(400, "Guest name is required for guest checkout", { code: "errors.order.guest_name_required" });
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      throw new ApiError(400, "Valid guest email is required for guest checkout", { code: "errors.order.guest_email_required" });
    }
  }

  // --- Stock validation & price recomputation (do not trust client) ---
  const productIds = [...new Set(items.map((i: { product: string }) => i.product))];
  const products = await Product.find({
    _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
    status: "ACTIVE",
    deletedAt: { $in: [null, undefined] }
  })
    .select("_id name price discountPrice stock variants")
    .lean();

  const productMap = new Map(products.map((p) => [String(p._id), p as { _id: unknown; name?: { en?: string; ar?: string }; price: number; discountPrice?: number; stock: number; variants?: { color?: string; size?: string; stock: number; outOfStock?: boolean }[] }]));

  const validatedItems: { product: string; quantity: number; price: number }[] = [];
  const qtyByProduct: Record<string, number> = {};

  for (const item of items) {
    const pid = String(item.product);
    const product = productMap.get(pid);
    if (!product) {
      throw new ApiError(400, `Product not found or unavailable: ${pid}`, { code: "errors.order.product_unavailable" });
    }

    const quantity = Number(item.quantity) || 0;
    if (quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1 for all items", { code: "errors.order.invalid_quantity" });
    }

    qtyByProduct[pid] = (qtyByProduct[pid] ?? 0) + quantity;

    const discountPrice = typeof product.discountPrice === "number" && product.discountPrice > 0
      ? Math.min(product.discountPrice, product.price)
      : product.price;

    validatedItems.push({ product: pid, quantity, price: discountPrice });
  }

  if (validatedItems.length === 0) {
    throw new ApiError(400, "At least one item with quantity >= 1 is required", { code: "errors.order.invalid_quantity" });
  }

  for (const [pid, totalQty] of Object.entries(qtyByProduct)) {
    const product = productMap.get(pid);
    if (!product) continue;
    const variants = product.variants ?? [];
    let available: number;
    if (variants.length > 0) {
      available = variants
        .filter((v) => !v.outOfStock)
        .reduce((sum, v) => sum + v.stock, 0);
    } else {
      available = product.stock ?? 0;
    }
    if (totalQty > available) {
      const name = product.name?.en ?? product.name?.ar ?? "Product";
      throw new ApiError(400, `${name} is out of stock (requested ${totalQty}, available ${available})`, {
        code: "errors.order.out_of_stock",
        params: { productName: name, requested: String(totalQty), available: String(available) }
      });
    }
  }

  items = validatedItems;

  // --- Validate shipping method ID (when provided) ---
  let resolvedDeliveryFee = typeof deliveryFee === "number" && deliveryFee >= 0 ? deliveryFee : 0;
  if (shippingMethod && typeof shippingMethod === "string" && shippingMethod.trim()) {
    const smId = shippingMethod.trim();
    if (isObjectIdLike(smId)) {
      const sm = await ShippingMethod.findOne({ _id: smId, enabled: true }).lean();
      if (!sm) {
        throw new ApiError(400, "Invalid or disabled shipping method", { code: "errors.order.invalid_shipping_method" });
      }
      resolvedDeliveryFee = (sm as { price?: number }).price ?? resolvedDeliveryFee;
    }
  }
  // Fallback: resolve delivery fee from city when shippingAddress has city _id
  if (resolvedDeliveryFee === 0 && shippingAddress && typeof shippingAddress === "object" && !Array.isArray(shippingAddress)) {
    const addr = shippingAddress as { city?: string };
    if (addr.city && isObjectIdLike(addr.city)) {
      const cityDoc = await City.findById(addr.city).select("deliveryFee").lean();
      if (cityDoc) {
        resolvedDeliveryFee = (cityDoc as { deliveryFee?: number }).deliveryFee ?? 0;
      }
    }
  }

  // --- Validate payment method ---
  const pm = (paymentMethod || "COD").toUpperCase();
  if (pm !== "COD" && pm !== "INSTAPAY") {
    throw new ApiError(400, "Invalid payment method", { code: "errors.order.invalid_payment_method" });
  }
  const settings = await Settings.findOne().select("paymentMethods advancedSettings").lean();
  const pmSettings = (settings as { paymentMethods?: { cod?: boolean; instaPay?: boolean } } | null)?.paymentMethods;
  const codEnabled = pmSettings?.cod !== false;
  const instaPayEnabled = pmSettings?.instaPay === true;
  if (pm === "COD" && !codEnabled) {
    throw new ApiError(400, "Cash on delivery is not available", { code: "errors.order.payment_not_available" });
  }
  if (pm === "INSTAPAY" && !instaPayEnabled) {
    throw new ApiError(400, "InstaPay is not available", { code: "errors.order.payment_not_available" });
  }

  const subtotal = items.reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);
  const fee = resolvedDeliveryFee;
  let discountAmount = 0;
  let appliedDiscountCode: string | undefined;

  // --- Validate and apply discount code (optional, only when discountCodeSupported) ---
  const rawCode = typeof bodyDiscountCode === "string" ? bodyDiscountCode.trim() : "";
  let discountCodeIdForUsage: string | undefined;
  if (rawCode) {
    const advanced = (settings as { advancedSettings?: { discountCodeSupported?: boolean } } | null)?.advancedSettings;
    const discountCodeSupported = advanced?.discountCodeSupported ?? true;
    if (!discountCodeSupported) {
      throw new ApiError(403, "Discount codes are not enabled", { code: "errors.discount.not_enabled" });
    }
    const identity: DiscountIdentity | undefined = effectiveUserId
      ? { userId: effectiveUserId }
      : (() => {
          const e = (bodyEmail ?? guestEmail ?? "").toString().trim().toLowerCase();
          const p = (phone ?? guestPhone ?? "").toString().trim();
          return e || p ? { email: e || undefined, phone: p || undefined } : undefined;
        })();
    const result = await validateAndComputeDiscount(rawCode, subtotal, identity);
    discountAmount = result.discountAmount;
    appliedDiscountCode = result.discountCode;
    discountCodeIdForUsage = result.discountCodeId;
  }

  const total = Math.max(0, subtotal - discountAmount + fee);

  const orderPayload: Record<string, unknown> = {
    user: effectiveUserId ?? null,
    items,
    total,
    deliveryFee: fee,
    paymentMethod: pm,
    shippingAddress,
    ...(appliedDiscountCode && { discountCode: appliedDiscountCode }),
    ...(discountAmount > 0 && { discountAmount })
  };

  // Always populate backward-compat guest fields (derived from new fields or original)
  if (isGuest) {
    if (hasNewFields) {
      orderPayload.guestName = [firstName, lastName].filter(Boolean).join(" ").trim();
      orderPayload.guestEmail = (bodyEmail ?? "").trim().toLowerCase();
      orderPayload.guestPhone = phone ? String(phone).trim() : (typeof guestPhone === "string" ? guestPhone.trim() || undefined : undefined);
    } else {
      orderPayload.guestName = String(body.guestName ?? "").trim();
      orderPayload.guestEmail = String(body.guestEmail ?? "").trim().toLowerCase();
      orderPayload.guestPhone = typeof body.guestPhone === "string" ? body.guestPhone.trim() || undefined : undefined;
    }
  }

  // New structured fields (always save when provided)
  if (bodyEmail !== undefined) orderPayload.email = String(bodyEmail).trim().toLowerCase();
  if (firstName !== undefined) orderPayload.firstName = String(firstName).trim();
  if (lastName !== undefined) orderPayload.lastName = String(lastName).trim();
  if (phone !== undefined) orderPayload.phone = String(phone).trim();
  if (billingAddress !== undefined) orderPayload.billingAddress = billingAddress;
  if (specialInstructions !== undefined) orderPayload.specialInstructions = String(specialInstructions).trim();
  if (shippingMethod !== undefined) orderPayload.shippingMethod = shippingMethod;
  if (emailNews !== undefined) orderPayload.emailNews = !!emailNews;
  if (textNews !== undefined) orderPayload.textNews = !!textNews;

  const order = await Order.create(orderPayload);

  // Increment discount code usage and record per-identity usage
  if (appliedDiscountCode && discountAmount > 0 && discountCodeIdForUsage) {
    await DiscountCode.findOneAndUpdate(
      { code: appliedDiscountCode },
      { $inc: { usedCount: 1 } }
    );
    const usageIdentity: DiscountIdentity = effectiveUserId
      ? { userId: effectiveUserId }
      : {
          email: (order as { email?: string }).email ?? (order as { guestEmail?: string }).guestEmail ?? undefined,
          phone: (order as { phone?: string }).phone ?? (order as { guestPhone?: string }).guestPhone ?? undefined,
        };
    await recordDiscountUsage({
      discountCodeId: discountCodeIdForUsage,
      orderId: order._id.toString(),
      identity: usageIdentity,
    });
  }

  await Payment.create({
    order: order._id,
    method: paymentMethod || "COD",
    status: paymentMethod === "INSTAPAY" ? "UNPAID" : "UNPAID"
  });

  // --- Send confirmation email to customer (fire-and-forget) ---
  const customerEmailAddr = (order as unknown as { email?: string }).email
    || (order as unknown as { guestEmail?: string }).guestEmail
    || null;
  if (customerEmailAddr && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmailAddr)) {
    const storefrontBaseUrl = env.storefrontUrl || "http://localhost:4200";
    Order.findById(order._id)
      .populate("items.product", "name images price discountPrice")
      .lean()
      .then(async (populated) => {
        if (!populated) return;
        const settings = await Settings.findOne().select("storeName logo advancedSettings").lean();
        const branding = getEmailBrandingFromSettings(
          settings as { storeName?: { en?: string; ar?: string }; logo?: string } | null,
          storefrontBaseUrl
        );
        const advanced = (settings as { advancedSettings?: { currencySymbol?: string } } | null)?.advancedSettings;
        const currencySymbol = (advanced?.currencySymbol && String(advanced.currencySymbol).trim()) || "EGP";

        const pop = populated as Record<string, unknown>;
        const custName = [pop.firstName, pop.lastName].filter(Boolean).join(" ") || (pop.guestName as string) || "Customer";
        const items = ((pop.items as Array<{ product: { name?: { en?: string; ar?: string }; images?: string[] } | null; quantity: number; price: number }>) || []).map((item) => {
          const prod = item.product;
          const productName = prod?.name?.en || prod?.name?.ar || "Product";
          const imgPath = prod?.images?.[0];
          const imageUrl = imgPath ? `${branding.storefrontUrl}${imgPath.startsWith("/") ? "" : "/"}${imgPath}` : null;
          return { productName, quantity: item.quantity, price: item.price, imageUrl };
        });
        const deliveryFee = (pop.deliveryFee as number) || 0;
        const discountAmount = (pop.discountAmount as number) || 0;
        const subtotal = (pop.total as number) - deliveryFee + discountAmount;

        const html = buildOrderConfirmationEmailHtml({
          ...branding,
          customerName: custName,
          orderId: String(order._id),
          items,
          subtotal,
          discountAmount,
          deliveryFee,
          total: pop.total as number,
          shippingAddress: formatAddress(pop.shippingAddress),
          paymentMethod: order.paymentMethod ?? "COD",
          specialInstructions: (pop.specialInstructions as string) || null,
          currencySymbol
        });
        await sendMail(customerEmailAddr, `Order confirmation #${order._id} - ${branding.storeName}`, html);
      }).catch(() => { });
  }

  // --- Notify admin by email if enabled (fire-and-forget) ---
  Settings.findOne().select("storeName logo orderNotificationsEnabled orderNotificationEmail advancedSettings").lean().then(async (settingsRow) => {
    const settings = settingsRow as {
      storeName?: { en?: string; ar?: string };
      logo?: string;
      orderNotificationsEnabled?: boolean;
      orderNotificationEmail?: string;
      advancedSettings?: { currencySymbol?: string };
    } | null;
    if (!settings?.orderNotificationsEnabled) return;
    const to = (settings.orderNotificationEmail?.trim() || env.adminEmail || "").toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return;

    const storefrontBaseUrl = env.storefrontUrl || "http://localhost:4200";
    const branding = getEmailBrandingFromSettings(settings, storefrontBaseUrl);
    const currencySymbol = (settings?.advancedSettings?.currencySymbol && String(settings.advancedSettings.currencySymbol).trim()) || "EGP";

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name");
    if (!populated) return;
    const user = populated.user as { name?: string; email?: string } | null;
    const pop = populated as unknown as Record<string, unknown>;
    const customerName = user?.name ?? ([pop.firstName, pop.lastName].filter(Boolean).join(" ") || (pop.guestName as string) || "—");
    const custEmail = user?.email ?? (pop.email as string) ?? (pop.guestEmail as string) ?? "—";
    const itemsSummary = (
      (populated.items || []) as Array<{ product?: { name?: { en?: string; ar?: string } }; quantity: number; price: number }>
    ).map((item) => {
      const product = item.product;
      const name = product?.name && typeof product.name === "object"
        ? (product.name.en || product.name.ar || "—")
        : (typeof product?.name === "string" ? product.name : "—");
      return `${name} × ${item.quantity} = ${(item.quantity * item.price).toLocaleString()} ${currencySymbol}`;
    });

    const html = buildAdminOrderNotificationEmailHtml({
      ...branding,
      orderId: String(order._id),
      customerName,
      customerEmail: custEmail,
      paymentMethod: order.paymentMethod ?? "COD",
      shippingAddress: formatAddress(populated.shippingAddress),
      total: order.total,
      itemsSummary,
      currencySymbol
    });
    await sendMail(to, `New order #${order._id} - ${branding.storeName}`, html);
  }).catch(() => { });

  sendResponse(res, locale(req), { status: 201, message: "success.order.created", data: { order } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const orderId = req.params?.id;
  if (!orderId) throw new ApiError(400, "Order ID is required", { code: "errors.common.validation_error" });
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  const rawStatus = (req.body as { status?: string }).status;
  const validStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (typeof rawStatus !== "string" || !validStatuses.includes(rawStatus as OrderStatus)) {
    throw new ApiError(400, "Valid status is required", { code: "errors.common.validation_error" });
  }
  const newStatus = rawStatus as OrderStatus;
  if (newStatus === "CONFIRMED" && order.items.length > 0) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of order.items) {
        const result = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!result) {
          await session.abortTransaction();
          const prod = await Product.findById(item.product).select("name").lean();
          const name = (prod as { name?: { en?: string; ar?: string } })?.name?.en
            ?? (prod as { name?: { en?: string; ar?: string } })?.name?.ar ?? "Product";
          throw new ApiError(409, `${name} became out of stock; order cannot be confirmed`, {
            code: "errors.order.out_of_stock_confirmation",
            params: { productName: (prod as { name?: { en?: string; ar?: string } })?.name?.en ?? "Product" }
          });
        }
      }
      order.status = newStatus;
      await order.save({ session });
      await session.commitTransaction();
    } finally {
      session.endSession();
    }
  } else {
    order.status = newStatus;
    await order.save();
  }
  const updatedOrder = await Order.findById(orderId);
  sendResponse(res, locale(req), { message: "success.order.status_updated", data: { order: updatedOrder ?? order } });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const orderId = req.params?.id;
  if (!orderId) throw new ApiError(400, "Order ID is required", { code: "errors.common.validation_error" });
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new ApiError(400, "Only pending or confirmed orders can be cancelled", { code: "errors.order.cancel_not_allowed" });
  }
  const wasConfirmed = order.status === "CONFIRMED";
  order.status = "CANCELLED";
  await order.save();
  if (wasConfirmed) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }
  sendResponse(res, locale(req), { message: "success.order.cancelled", data: { order } });
});
