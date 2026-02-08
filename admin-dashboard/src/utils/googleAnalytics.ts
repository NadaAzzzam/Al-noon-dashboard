/**
 * Google Analytics 4 (GA4) integration.
 * - Loads gtag when a Measurement ID is provided and sends page_view on route changes.
 * - Ecommerce: use the send* helpers below on your storefront (product views, cart, checkout, purchase).
 *
 * Setup:
 * 1. Create a GA4 property at analytics.google.com → Admin → Data Streams → add stream (Web).
 * 2. Copy the Measurement ID (e.g. G-XXXXXXXXXX).
 * 3. In this project: Settings → Analytics → paste the ID (or set VITE_GA_MEASUREMENT_ID for admin).
 * 4. On your storefront app: init with the same ID, then call the ecommerce event helpers when users
 *    view products, add to cart, begin checkout, or complete a purchase.
 */

const GA_SCRIPT_URL = "https://www.googletagmanager.com/gtag/js";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let initializedId: string | null = null;

function loadScript(id: string): void {
  if (typeof document === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());

  const script = document.createElement("script");
  script.async = true;
  script.src = `${GA_SCRIPT_URL}?id=${id}`;
  document.head.appendChild(script);
}

/**
 * Initialize GA4 with the given Measurement ID (e.g. G-XXXXXXXXXX).
 * Safe to call multiple times; re-inits only if the ID changes.
 */
export function initGoogleAnalytics(measurementId: string | undefined): void {
  const id = (measurementId ?? "").trim();
  if (!id) return;
  if (initializedId === id) return;
  initializedId = id;
  loadScript(id);
  window.gtag?.("config", id, { send_page_view: false });
}

/**
 * Send a page_view event (call on route change in a SPA).
 */
export function sendPageView(path: string, title?: string): void {
  if (!initializedId || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title
  });
}

export function getGaMeasurementId(): string | null {
  return initializedId;
}

// --- Ecommerce (GA4 recommended events). Use these on your storefront. ---

/** GA4 ecommerce item shape (item_id, item_name, price, quantity required for purchase). */
export interface GA4Item {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
  index?: number;
  item_list_name?: string;
  item_list_id?: string;
  coupon?: string;
  discount?: number;
}

function sendEcommerceEvent(eventName: string, params: Record<string, unknown>): void {
  if (!initializedId || !window.gtag) return;
  window.gtag("event", eventName, params);
}

/** Product list viewed (e.g. category or search results). */
export function sendViewItemList(items: GA4Item[], listId?: string, listName?: string): void {
  sendEcommerceEvent("view_item_list", {
    item_list_id: listId,
    item_list_name: listName,
    items: items.map(normalizeItem)
  });
}

/** Single product page viewed. */
export function sendViewItem(item: GA4Item, value?: number, currency?: string): void {
  sendEcommerceEvent("view_item", {
    currency: currency ?? "USD",
    value: value ?? item.price ?? 0,
    items: [normalizeItem(item)]
  });
}

/** Product added to cart. */
export function sendAddToCart(items: GA4Item[], value?: number, currency?: string): void {
  sendEcommerceEvent("add_to_cart", {
    currency: currency ?? "USD",
    value: value ?? items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0),
    items: items.map(normalizeItem)
  });
}

/** Product removed from cart. */
export function sendRemoveFromCart(items: GA4Item[], value?: number, currency?: string): void {
  sendEcommerceEvent("remove_from_cart", {
    currency: currency ?? "USD",
    value: value ?? items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0),
    items: items.map(normalizeItem)
  });
}

/** Checkout started. */
export function sendBeginCheckout(items: GA4Item[], value?: number, currency?: string, coupon?: string): void {
  sendEcommerceEvent("begin_checkout", {
    currency: currency ?? "USD",
    value: value ?? items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0),
    coupon: coupon || undefined,
    items: items.map(normalizeItem)
  });
}

/** Purchase completed (critical for revenue tracking). */
export function sendPurchase(
  transactionId: string,
  items: GA4Item[],
  value: number,
  currency?: string,
  tax?: number,
  shipping?: number,
  coupon?: string
): void {
  sendEcommerceEvent("purchase", {
    transaction_id: transactionId,
    currency: currency ?? "USD",
    value,
    tax: tax ?? 0,
    shipping: shipping ?? 0,
    coupon: coupon || undefined,
    items: items.map(normalizeItem)
  });
}

function normalizeItem(i: GA4Item): Record<string, unknown> {
  return {
    item_id: i.item_id,
    item_name: i.item_name,
    price: i.price,
    quantity: i.quantity ?? 1,
    item_category: i.item_category,
    item_variant: i.item_variant,
    index: i.index,
    item_list_name: i.item_list_name,
    item_list_id: i.item_list_id,
    coupon: i.coupon,
    discount: i.discount
  };
}
