import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Order, OrderStatus } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { formatPriceEGP } from "../utils/format";

const PAGE_SIZE = 20;

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "badge badge-pending",
    CONFIRMED: "badge badge-confirmed",
    SHIPPED: "badge badge-shipped",
    DELIVERED: "badge badge-delivered",
    CANCELLED: "badge badge-cancelled",
  };
  return map[status] ?? "badge";
};

const OrdersPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasFilters = !!(statusFilter || paymentFilter);

  const clearFilters = () => {
    setStatusFilter("");
    setPaymentFilter("");
    setPage(1);
  };

  const loadOrders = async () => {
    setError(null);
    try {
      const res = await api.listOrders({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        paymentMethod: paymentFilter || undefined
      }) as { orders: Order[]; total: number };
      setOrders(res.orders ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("orders.failed_load"));
    }
  };

  useEffect(() => { loadOrders(); }, [page, statusFilter, paymentFilter, t]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setError(null);
    try {
      await api.updateOrderStatus(id, status);
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("orders.failed_update"));
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("orders.title")}</h1>
          <p>{t("orders.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <div className="filters">
          <span className="filters-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          </span>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">{t("orders.all_statuses")}</option>
            <option value="PENDING">{t("orders.pending")}</option>
            <option value="CONFIRMED">{t("orders.confirmed")}</option>
            <option value="SHIPPED">{t("orders.shipped")}</option>
            <option value="DELIVERED">{t("orders.delivered")}</option>
            <option value="CANCELLED">{t("orders.cancelled")}</option>
          </select>
          <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}>
            <option value="">{t("orders.all_payments")}</option>
            <option value="COD">COD</option>
            <option value="INSTAPAY">InstaPay</option>
          </select>
          {hasFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              {t("common.clear_filters", "Clear filters")}
            </button>
          )}
        </div>

        {orders.length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("dashboard.order")}</th>
                  <th>{t("orders.date")}</th>
                  <th>{t("dashboard.customer")}</th>
                  <th>{t("dashboard.status")}</th>
                  <th>{t("orders.payment")}</th>
                  <th>{t("dashboard.total")}</th>
                  <th>{t("common.update")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
                      {order._id.slice(-8)}
                    </td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
                        : "—"}
                    </td>
                    <td>{order.user?.name ?? "—"}</td>
                    <td>
                      <span className={statusBadgeClass(order.status)}>
                        {t(`orders.${order.status.toLowerCase()}`, order.status)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-muted">
                        {(order.payment as { method?: string })?.method ?? "—"}
                      </span>
                      {" / "}
                      <span className="badge" style={{ marginInlineStart: 4 }}>
                        {(order.payment as { status?: string })?.status ?? "—"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatPriceEGP(order.total)}</td>
                    <td>
                      {order.status !== "CANCELLED" && (
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                          style={{ fontSize: 13, padding: "6px 8px" }}
                        >
                          <option value="PENDING">{t("orders.pending")}</option>
                          <option value="CONFIRMED">{t("orders.confirmed")}</option>
                          <option value="SHIPPED">{t("orders.shipped")}</option>
                          <option value="DELIVERED">{t("orders.delivered")}</option>
                          <option value="CANCELLED">{t("orders.cancelled")}</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <TableActionsDropdown
                        ariaLabel={t("common.actions")}
                        actions={[{ label: t("common.view"), to: `/orders/${order._id}` }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  {t("common.showing", "Showing")} {startItem}–{endItem} {t("common.of")} {total}
                </span>
                <div className="pagination-pages">
                  <button
                    className="pagination-page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-page ${page === p ? "active" : ""}`}
                        onClick={() => setPage(p as number)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="pagination-page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h3>{t("orders.no_orders", "No orders found")}</h3>
            <p>{hasFilters ? t("orders.no_orders_filter", "Try adjusting your filters") : t("orders.no_orders_desc", "Orders will appear here when customers place them")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
