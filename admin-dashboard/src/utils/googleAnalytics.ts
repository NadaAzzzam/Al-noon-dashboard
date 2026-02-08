/**
 * Google Analytics 4 (GA4) integration.
 * Loads gtag when a Measurement ID is provided and sends page_view on route changes.
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
