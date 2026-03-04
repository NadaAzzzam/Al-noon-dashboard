/**
 * HTML email templates for transactional emails (password reset, order confirmation, etc.).
 * E-commerce / Shopify-style: table-based layout, inline styles, dynamic store branding from Settings.
 */

import { escapeHtml } from "./escapeHtml.js";

/** Shared branding for all emails – from Settings (store name, logo) and env (storefront URL). */
export interface EmailBranding {
  /** Store display name (e.g. from settings.storeName.en or .ar) */
  storeName: string;
  /** Absolute URL to the store logo image, or null to hide logo */
  logoUrl: string | null;
  /** Base URL of the storefront (for logo link and product images) */
  storefrontUrl: string;
}

export interface ResetPasswordEmailData extends EmailBranding {
  /** Absolute URL for the reset password link (storefront page with token) */
  resetLink: string;
  /** Expiry time in hours (e.g. 1) */
  expiryHours: number;
}

export interface OrderConfirmationEmailData extends EmailBranding {
  /** Customer first name or full name */
  customerName: string;
  /** Order ID (string) */
  orderId: string;
  /** Line items: product name, quantity, price, optional image URL */
  items: { productName: string; quantity: number; price: number; imageUrl?: string | null }[];
  /** Subtotal before discount/shipping */
  subtotal: number;
  /** Discount amount (0 if none) */
  discountAmount: number;
  /** Shipping/delivery fee */
  deliveryFee: number;
  /** Grand total */
  total: number;
  /** Formatted shipping address (single line) */
  shippingAddress: string;
  /** Payment method (e.g. COD, INSTAPAY) */
  paymentMethod: string;
  /** Optional customer notes */
  specialInstructions?: string | null;
  /** Currency symbol for display (e.g. EGP, LE) */
  currencySymbol: string;
}

export interface AdminOrderNotificationEmailData extends EmailBranding {
  orderId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  shippingAddress: string;
  total: number;
  /** Formatted line items (e.g. "Product A × 2 = 800 EGP") */
  itemsSummary: string[];
  currencySymbol: string;
}

export interface TestOrderEmailData extends EmailBranding {
  /** Sample content for test email */
  sampleOrderId: string;
  sampleCustomerName: string;
  sampleCustomerEmail: string;
  samplePayment: string;
  sampleShipping: string;
  sampleTotal: string;
  sampleItems: string[];
}

function emailHeaderBlock(branding: EmailBranding): string {
  const { storeName, logoUrl, storefrontUrl } = branding;
  const safeStoreName = escapeHtml(storeName || "Store");
  const logoBlock =
    logoUrl &&
    `
    <tr>
      <td style="padding: 32px 24px 20px; text-align: center;">
        <a href="${escapeHtml(storefrontUrl)}" style="text-decoration: none;">
          <img src="${escapeHtml(logoUrl)}" alt="${safeStoreName}" width="160" style="max-width: 160px; height: auto; display: inline-block; border: 0;" />
        </a>
      </td>
    </tr>`;
  return logoBlock || "";
}

function emailFooterBlock(branding: EmailBranding): string {
  const safeStoreName = escapeHtml(branding.storeName || "Store");
  return `
  <tr>
    <td style="padding: 24px 32px 32px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} ${safeStoreName}. All rights reserved.</p>
    </td>
  </tr>`;
}

/** Wraps content in the standard e-commerce email shell (background, card, optional logo, footer). */
function wrapEmailContent(branding: EmailBranding, title: string, contentRows: string): string {
  const header = emailHeaderBlock(branding);
  const footer = emailFooterBlock(branding);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          ${header}
          ${contentRows}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Builds the HTML body for the password reset email.
 * E-commerce style: header with logo, clear CTA button, expiry notice, footer.
 */
export function buildResetPasswordEmailHtml(data: ResetPasswordEmailData): string {
  const { storeName, logoUrl, resetLink, expiryHours, storefrontUrl } = data;
  const safeStoreName = escapeHtml(storeName || "Store");
  const hourText = expiryHours === 1 ? "1 hour" : `${expiryHours} hours`;

  const contentRows = `
    <tr>
      <td style="padding: 8px 32px 24px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1a1a1a; text-align: center;">Reset your password</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #4a4a4a;">Hello,</p>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #4a4a4a;">We received a request to reset the password for your ${safeStoreName} account. Click the button below to choose a new password.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 8px 0 24px;">
              <a href="${escapeHtml(resetLink)}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px;">Reset password</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: #6b7280;">This link expires in ${hourText}. If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; word-break: break-all;">${escapeHtml(resetLink)}</p>
      </td>
    </tr>`;

  return wrapEmailContent(
    { storeName, logoUrl, storefrontUrl },
    "Reset your password",
    contentRows
  );
}

/**
 * Builds the HTML body for the order confirmation email (customer).
 * E-commerce style: thank you message, order summary table, totals, shipping & payment info.
 */
export function buildOrderConfirmationEmailHtml(data: OrderConfirmationEmailData): string {
  const {
    storeName,
    customerName,
    orderId,
    items,
    subtotal,
    discountAmount,
    deliveryFee,
    total,
    shippingAddress,
    paymentMethod,
    specialInstructions,
    currencySymbol
  } = data;
  const safeStoreName = escapeHtml(storeName || "Store");
  const safeCustomerName = escapeHtml(customerName || "Customer");

  const itemsRows = items
    .map((item) => {
      const imgCell = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" width="50" height="50" style="object-fit: cover; border-radius: 6px; display: block;" alt="" />`
        : "";
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; vertical-align: middle;">${imgCell}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${escapeHtml(item.productName)}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #374151;">${item.quantity}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #374151;">${(item.quantity * item.price).toLocaleString()} ${escapeHtml(currencySymbol)}</td>
        </tr>`;
    })
    .join("");

  const discountRow =
    discountAmount > 0
      ? `<tr><td style="padding: 8px 24px; font-size: 14px; color: #374151;">Discount</td><td style="padding: 8px 24px; text-align: right; font-size: 14px; color: #059669;">-${discountAmount.toLocaleString()} ${escapeHtml(currencySymbol)}</td></tr>`
      : "";

  const notesBlock =
    specialInstructions && specialInstructions.trim()
      ? `<p style="margin: 16px 0 0; font-size: 14px; color: #4a4a4a;"><strong>Notes:</strong> ${escapeHtml(specialInstructions.trim())}</p>`
      : "";

  const contentRows = `
    <tr>
      <td style="padding: 8px 32px 16px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1a1a1a;">Thank you for your order, ${safeCustomerName}!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #4a4a4a;">Your order <strong>#${escapeHtml(orderId)}</strong> has been placed successfully. We'll notify you when it ships.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;"></th>
              <th style="padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Product</th>
              <th style="padding: 10px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 10px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
          <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;">Subtotal</td><td style="padding: 4px 0; text-align: right; font-size: 14px; color: #374151;">${subtotal.toLocaleString()} ${escapeHtml(currencySymbol)}</td></tr>
          ${discountRow}
          <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;">Shipping</td><td style="padding: 4px 0; text-align: right; font-size: 14px; color: #374151;">${deliveryFee.toLocaleString()} ${escapeHtml(currencySymbol)}</td></tr>
          <tr style="font-weight: 600;"><td style="padding: 12px 0 0; font-size: 16px; color: #1a1a1a;">Total</td><td style="padding: 12px 0 0; text-align: right; font-size: 16px; color: #1a1a1a;">${total.toLocaleString()} ${escapeHtml(currencySymbol)}</td></tr>
        </table>
        <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">Shipping address</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a; line-height: 1.5;">${escapeHtml(shippingAddress)}</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280;"><strong>Payment:</strong> ${escapeHtml(paymentMethod)}</p>
        </div>
        ${notesBlock}
        <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">If you have any questions, reply to this email or contact us at ${safeStoreName}.</p>
      </td>
    </tr>`;

  return wrapEmailContent(data, `Order confirmation #${orderId}`, contentRows);
}

/**
 * Builds the HTML body for the admin "new order" notification email.
 */
export function buildAdminOrderNotificationEmailHtml(data: AdminOrderNotificationEmailData): string {
  const { orderId, customerName, customerEmail, paymentMethod, shippingAddress, total, itemsSummary, currencySymbol } = data;
  const itemsList = itemsSummary.map((line) => `<li style="margin-bottom: 4px; font-size: 14px; color: #374151;">${escapeHtml(line)}</li>`).join("");

  const contentRows = `
    <tr>
      <td style="padding: 8px 32px 16px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1a1a1a;">New order received</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #4a4a4a;">Order <strong>#${escapeHtml(orderId)}</strong> has been placed.</p>
        <div style="margin: 16px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Customer</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a;">${escapeHtml(customerName)} (${escapeHtml(customerEmail)})</p>
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Payment</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a;">${escapeHtml(paymentMethod)}</p>
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Shipping</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a;">${escapeHtml(shippingAddress)}</p>
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Total</p>
          <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">${total.toLocaleString()} ${escapeHtml(currencySymbol)}</p>
        </div>
        <p style="margin: 12px 0 6px; font-size: 13px; font-weight: 600; color: #374151;">Items</p>
        <ul style="margin: 0; padding-left: 20px;">${itemsList}</ul>
      </td>
    </tr>`;

  return wrapEmailContent(data, `New order #${orderId}`, contentRows);
}

/**
 * Builds the HTML body for the "test order notification" email (from Settings).
 */
export function buildTestOrderEmailHtml(data: TestOrderEmailData): string {
  const {
    sampleOrderId,
    sampleCustomerName,
    sampleCustomerEmail,
    samplePayment,
    sampleShipping,
    sampleTotal,
    sampleItems
  } = data;
  const itemsList = sampleItems.map((line) => `<li style="margin-bottom: 4px; font-size: 14px; color: #374151;">${escapeHtml(line)}</li>`).join("");

  const contentRows = `
    <tr>
      <td style="padding: 8px 32px 16px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1a1a1a;">Test order notification</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #4a4a4a;">This is a test email. When a customer places an order, you will receive a similar email with real order details.</p>
        <div style="margin: 16px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Order ID</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a;">${escapeHtml(sampleOrderId)}</p>
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Customer</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a;">${escapeHtml(sampleCustomerName)} (${escapeHtml(sampleCustomerEmail)})</p>
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Payment</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a;">${escapeHtml(samplePayment)}</p>
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Shipping</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #4a4a4a;">${escapeHtml(sampleShipping)}</p>
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Total</p>
          <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">${escapeHtml(sampleTotal)}</p>
        </div>
        <p style="margin: 12px 0 6px; font-size: 13px; font-weight: 600; color: #374151;">Items</p>
        <ul style="margin: 0; padding-left: 20px;">${itemsList}</ul>
        <p style="margin: 20px 0 0; font-size: 13px; color: #059669; font-style: italic;">If you received this, order notifications are working.</p>
      </td>
    </tr>`;

  return wrapEmailContent(data, "Test order notification", contentRows);
}

/** Default logo path used when no custom logo is set in Settings (for emails and storefront). */
export const DEFAULT_LOGO_PATH = "/uploads/logos/default-logo.jpeg";

/**
 * Builds email branding from Settings document and storefront base URL.
 * Use this wherever you send emails so store name and logo come from Settings.
 */
export function getEmailBrandingFromSettings(
  settings: { storeName?: { en?: string; ar?: string }; logo?: string } | null,
  storefrontBaseUrl: string
): EmailBranding {
  const baseUrl = (storefrontBaseUrl || "http://localhost:4200").replace(/\/?$/, "");
  const storeName =
    (settings?.storeName?.en || settings?.storeName?.ar || "Store").trim() || "Store";
  const rawLogo = settings?.logo && String(settings.logo).trim();
  const logoPath = rawLogo ? (rawLogo.startsWith("/") ? rawLogo : `/${rawLogo}`) : DEFAULT_LOGO_PATH;
  const logoUrl = logoPath ? `${baseUrl}${logoPath}` : null;
  return { storeName, logoUrl, storefrontUrl: baseUrl };
}
