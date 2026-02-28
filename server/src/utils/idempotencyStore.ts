/**
 * In-memory idempotency store for checkout/order creation.
 * Prevents duplicate orders when user refreshes during payment callback.
 * TTL 24 hours. For multi-instance deployments, use Redis instead.
 */

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_KEYS = 10000;

interface IdempotencyEntry {
  statusCode: number;
  body: unknown;
  orderId: string;
  expiresAt: number;
}

const store = new Map<string, IdempotencyEntry>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt <= now) store.delete(k);
  }
  // If still too large, remove oldest by expiry
  if (store.size > MAX_KEYS) {
    const entries = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    for (let i = 0; i < entries.length - MAX_KEYS; i++) {
      store.delete(entries[i][0]);
    }
  }
}

export function getIdempotencyResponse(key: string): { statusCode: number; body: unknown } | null {
  pruneExpired();
  const entry = store.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return { statusCode: entry.statusCode, body: entry.body };
}

export function setIdempotencyResponse(key: string, orderId: string, statusCode: number, body: unknown): void {
  pruneExpired();
  if (store.size >= MAX_KEYS) return;
  store.set(key, {
    statusCode,
    body,
    orderId,
    expiresAt: Date.now() + TTL_MS
  });
}
