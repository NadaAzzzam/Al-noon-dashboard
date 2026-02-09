/**
 * Public storefront API for ecommerce users (no auth).
 * Use this from the storefront contact form.
 */

const STOREFRONT_API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/** Payload for Contact Us form (ecommerce storefront). */
export type SubmitContactPayload = {
  name: string;
  email: string;
  phone?: string;
  comment: string;
};

/** Success response from POST /api/store/contact */
export type SubmitContactResponse = {
  success: true;
  message?: string;
};

export class StorefrontApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "StorefrontApiError";
  }
}

async function parseErrorResponse(response: Response): Promise<{ message: string; code?: string; details?: unknown }> {
  let body: { message?: string; code?: string; details?: unknown } = {};
  const ct = response.headers.get("Content-Type");
  if (ct?.includes("application/json")) {
    try {
      body = (await response.json()) as typeof body;
    } catch {
      // ignore
    }
  }
  let message = body.message ?? response.statusText;
  if (response.status === 400) message = message || "Invalid request";
  if (response.status === 404) message = message || "Not found";
  if (response.status >= 500) message = message || "Server error";
  return { message, code: body.code, details: body.details };
}

/**
 * Submit Contact Us form (public). Ecommerce storefront should call this when user submits the contact form.
 * POST /api/store/contact
 */
export async function submitStoreContact(
  payload: SubmitContactPayload,
  options?: { baseUrl?: string; locale?: string }
): Promise<SubmitContactResponse> {
  const base = options?.baseUrl ?? STOREFRONT_API_BASE;
  const url = `${base.replace(/\/?$/, "")}/store/contact`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (options?.locale) headers["Accept-Language"] = options.locale;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || undefined,
      comment: payload.comment.trim(),
    }),
    credentials: "include",
  });

  if (!response.ok) {
    const { message, code, details } = await parseErrorResponse(response);
    throw new StorefrontApiError(response.status, message, code, details);
  }

  const data = (await response.json()) as SubmitContactResponse;
  return data;
}
