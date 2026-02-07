import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, Order, OrderStatus, clearAuth } from "../services/api";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setError(null);
    try {
      const response = await api.listOrders({
        page,
        limit: 20,
        status: statusFilter || undefined,
        paymentMethod: paymentFilter || undefined
      });
      setOrders(response.orders ?? []);
      setTotalPages(response.totalPages ?? 1);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuth();
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, paymentFilter]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setError(null);
    try {
      await api.updateOrderStatus(id, status);
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update order");
    }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Cancel this order?")) return;
    setError(null);
    try {
      await api.cancelOrder(id);
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel");
    }
  };

  const confirmPayment = async (id: string) => {
    setError(null);
    try {
      await api.confirmPayment(id);
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to confirm payment");
    }
  };

  const statusOptions: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <h1>Orders</h1>
        <p>Track fulfillment and payment status.</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="">All payment</option>
          <option value="COD">COD</option>
          <option value="INSTAPAY">InstaPay</option>
        </select>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td><Link to={`/orders/${order._id}`}>{order._id.slice(-6).toUpperCase()}</Link></td>
                <td>{order.user?.name ?? "—"}</td>
                <td><span className="badge">{order.status}</span></td>
                <td>
                  <span className="badge">{order.paymentMethod}</span>
                  {" "}
                  <span className="badge">{order.paymentStatus}</span>
                </td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                    disabled={order.status === "CANCELLED"}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {order.paymentMethod === "INSTAPAY" && order.paymentStatus === "PENDING_APPROVAL" && (
                    <button className="button" style={{ marginLeft: 8 }} onClick={() => confirmPayment(order._id)}>
                      Approve payment
                    </button>
                  )}
                  {(order.status === "PENDING" || order.status === "CONFIRMED") && order.status !== "CANCELLED" && (
                    <button className="button secondary" style={{ marginLeft: 8 }} onClick={() => cancelOrder(order._id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ margin: "0 12px" }}>Page {page} of {totalPages}</span>
            <button className="button secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
