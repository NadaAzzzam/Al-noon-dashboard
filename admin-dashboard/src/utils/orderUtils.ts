/** Days since order was created (for "waiting" visibility). */
export function daysSinceOrder(createdAt: string | undefined): number | null {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return Math.floor((now - created) / (24 * 60 * 60 * 1000));
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/** True if order is still in progress and has been waiting 2+ days. */
export function isLongWait(days: number | null, status: OrderStatus): boolean {
  if (days == null || days < 2) return false;
  return status !== "DELIVERED" && status !== "CANCELLED";
}
