import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Order, OrderStatus } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { formatPriceEGP } from "../utils/format";

const OrdersPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setError(null);
    try {
      const res = await api.listOrders({
        page,
        limit: 20,
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

  const totalPages = Math.ceil(total / 20);

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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t("orders.all_statuses")}</option>
            <option value="PENDING">{t("orders.pending")}</option>
            <option value="CONFIRMED">{t("orders.confirmed")}</option>
            <option value="SHIPPED">{t("orders.shipped")}</option>
            <option value="DELIVERED">{t("orders.delivered")}</option>
            <option value="CANCELLED">{t("orders.cancelled")}</option>
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="">{t("orders.all_payments")}</option>
            <option value="COD">COD</option>
            <option value="INSTAPAY">InstaPay</option>
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t("dashboard.order")}</th>
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
                <td>{order._id.slice(-8)}</td>
                <td>{order.user?.name ?? "—"}</td>
                <td><span className="badge">{order.status}</span></td>
                <td>{(order.payment as { method?: string; status?: string })?.method ?? "—"} / {(order.payment as { status?: string })?.status ?? "—"}</td>
                <td>{formatPriceEGP(order.total)}</td>
                <td>
                  {order.status !== "CANCELLED" && (
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
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
            <button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("common.prev")}</button>
            <span>{t("common.page")} {page} {t("common.of")} {totalPages}</span>
            <button className="button secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t("common.next")}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
