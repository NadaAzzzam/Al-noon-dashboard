import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { sendMail } from "../utils/email.js";

export const listOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    });
  }
  const isAdmin = req.auth?.role === "ADMIN";
  const filter: Record<string, unknown> = isAdmin ? {} : { user: req.auth?.userId };

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const status = req.query.status as string | undefined;
  const paymentMethod = req.query.paymentMethod as string | undefined;
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

  sendResponse(res, req.locale, {
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
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "_id name price discountPrice images");
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  const isAdmin = req.auth?.role === "ADMIN";
  const orderUserId = order.user && typeof order.user === "object" && order.user._id
    ? order.user._id.toString()
    : (order.user && typeof order.user.toString === "function" ? order.user.toString() : null);
  if (!isAdmin && orderUserId !== req.auth?.userId) {
    throw new ApiError(403, "Forbidden", { code: "errors.common.forbidden" });
  }
  const payment = await Payment.findOne({ order: order._id }).lean();
  const orderObj = order.toObject();
  const items = Array.isArray(orderObj.items) ? orderObj.items.map((item: { product: unknown; quantity: number; price: number }) => ({
    ...item,
    product: normalizeOrderItemProduct(item)
  })) : orderObj.items;
  sendResponse(res, req.locale, {
    data: {
      order: {
        ...orderObj,
        items,
        payment: payment ?? (order.paymentMethod ? { method: order.paymentMethod, status: "UNPAID" } : undefined)
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

export const createOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const {
    items, paymentMethod, shippingAddress, deliveryFee,
    guestName, guestEmail, guestPhone,
    // New structured checkout fields
    email: bodyEmail, firstName, lastName, phone,
    billingAddress, specialInstructions, shippingMethod,
    emailNews, textNews
  } = req.body;

  const isGuest = !req.auth;

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

  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price,
    0
  );
  const fee = typeof deliveryFee === "number" && deliveryFee >= 0 ? deliveryFee : 0;
  const total = subtotal + fee;

  const orderPayload: Record<string, unknown> = {
    user: req.auth?.userId ?? null,
    items,
    total,
    deliveryFee: fee,
    paymentMethod: paymentMethod || "COD",
    shippingAddress
  };

  // Always populate backward-compat guest fields (derived from new fields or original)
  if (isGuest) {
    if (hasNewFields) {
      orderPayload.guestName = [firstName, lastName].filter(Boolean).join(" ").trim();
      orderPayload.guestEmail = (bodyEmail ?? "").trim().toLowerCase();
      orderPayload.guestPhone = phone ? String(phone).trim() : (typeof guestPhone === "string" ? guestPhone.trim() || undefined : undefined);
    } else {
      orderPayload.guestName = String(req.body.guestName ?? "").trim();
      orderPayload.guestEmail = String(req.body.guestEmail ?? "").trim().toLowerCase();
      orderPayload.guestPhone = typeof req.body.guestPhone === "string" ? req.body.guestPhone.trim() || undefined : undefined;
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
    Order.findById(order._id)
      .populate("items.product", "name images price discountPrice")
      .lean()
      .then(async (populated) => {
        if (!populated) return;
        const pop = populated as Record<string, unknown>;
        const custName = [pop.firstName, pop.lastName].filter(Boolean).join(" ") || (pop.guestName as string) || "Customer";
        const itemsHtml = ((pop.items as Array<{ product: unknown; quantity: number; price: number }>) || []).map((item) => {
          const prod = item.product as { name?: { en?: string; ar?: string }; images?: string[] } | null;
          const prodName = prod?.name?.en || prod?.name?.ar || "Product";
          const imgTag = prod?.images?.[0] ? `<img src="${env.clientUrl || ""}/${prod.images[0]}" width="50" height="50" style="object-fit:cover;border-radius:4px;" alt="" />` : "";
          return `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${imgTag}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${prodName}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${(item.quantity * item.price).toLocaleString()} EGP</td>
          </tr>`;
        }).join("");

        const subtotalVal = (pop.total as number) - ((pop.deliveryFee as number) || 0);
        const shippingDisplay = formatAddress(pop.shippingAddress);
        const subject = `Order Confirmation #${order._id}`;
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#333;">Thank you for your order, ${custName}!</h2>
            <p>Your order <strong>#${order._id}</strong> has been placed successfully.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <thead><tr style="background:#f5f5f5;">
                <th style="padding:8px;text-align:left;"></th>
                <th style="padding:8px;text-align:left;">Product</th>
                <th style="padding:8px;text-align:center;">Qty</th>
                <th style="padding:8px;text-align:right;">Price</th>
              </tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <table style="width:100%;margin:8px 0;">
              <tr><td style="padding:4px 8px;">Subtotal</td><td style="text-align:right;padding:4px 8px;">${subtotalVal.toLocaleString()} EGP</td></tr>
              <tr><td style="padding:4px 8px;">Shipping</td><td style="text-align:right;padding:4px 8px;">${((pop.deliveryFee as number) || 0).toLocaleString()} EGP</td></tr>
              <tr style="font-weight:bold;font-size:1.1em;"><td style="padding:4px 8px;">Total</td><td style="text-align:right;padding:4px 8px;">${(pop.total as number).toLocaleString()} EGP</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
            <p><strong>Shipping Address:</strong> ${shippingDisplay}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod ?? "COD"}</p>
            ${(pop.specialInstructions as string) ? `<p><strong>Notes:</strong> ${pop.specialInstructions}</p>` : ""}
            <p style="color:#888;font-size:0.9em;margin-top:24px;">If you have any questions, just reply to this email.</p>
          </div>
        `;
        await sendMail(customerEmailAddr, subject, html);
      }).catch(() => { });
  }

  // --- Notify admin by email if enabled (fire-and-forget) ---
  Settings.findOne().lean().then(async (settingsRow) => {
    const settings = settingsRow as { orderNotificationsEnabled?: boolean; orderNotificationEmail?: string } | null;
    if (!settings?.orderNotificationsEnabled) return;
    const to = (settings.orderNotificationEmail?.trim() || env.adminEmail || "").toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return;
    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name");
    if (!populated) return;
    const user = populated.user as { name?: string; email?: string } | null;
    const pop = populated as unknown as Record<string, unknown>;
    const customerName = user?.name
      ?? ([pop.firstName, pop.lastName].filter(Boolean).join(" ") || (pop.guestName as string) || "—");
    const custEmail = user?.email ?? (pop.email as string) ?? (pop.guestEmail as string) ?? "—";
    const orderItems = (populated.items || []).map((item) => {
      const product = item.product as unknown as { name?: string } | undefined;
      const name = product && typeof product === "object" && "name" in product ? String(product.name) : "—";
      return `${name} × ${item.quantity} = ${item.quantity * item.price}`;
    });
    const subject = `New order #${order._id}`;
    const shippingDisplay = formatAddress(populated.shippingAddress);
    const html = `
      <h2>New order received</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Customer:</strong> ${customerName} (${custEmail})</p>
      <p><strong>Payment:</strong> ${order.paymentMethod ?? "COD"}</p>
      <p><strong>Shipping:</strong> ${shippingDisplay}</p>
      <p><strong>Total:</strong> ${order.total}</p>
      <h3>Items</h3>
      <ul>${orderItems.map((i) => `<li>${i}</li>`).join("")}</ul>
    `;
    await sendMail(to, subject, html);
  }).catch(() => { });

  sendResponse(res, req.locale, { status: 201, message: "success.order.created", data: { order } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  const newStatus = req.body.status;
  order.status = newStatus;
  await order.save();
  if (newStatus === "CONFIRMED") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }
  sendResponse(res, req.locale, { message: "success.order.status_updated", data: { order } });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const order = await Order.findById(req.params.id);
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
  sendResponse(res, req.locale, { message: "success.order.cancelled", data: { order } });
});
