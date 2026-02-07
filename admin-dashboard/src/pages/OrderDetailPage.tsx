import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError, Order, OrderStatus, clearAuth } from "../services/api";

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setError(null);
      try {
        const res = await api.getOrder(id);
        setOrder(res.order);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load order");
      }
    };
    load();
  }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    if (!id) return;
    setError(null);
    try {
      const res = await api.updateOrderStatus(id, status) as { order: Order };
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    }
  };

  const confirmPayment = async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await api.confirmPayment(id) as { order: Order };
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to confirm payment");
    }
  };

  const cancelOrder = async () => {
    if (!id || !confirm("Cancel this order?")) return;
    setError(null);
    try {
      const res = await api.cancelOrder(id) as { order: Order };
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel");
    }
  };

  if (!order) return <div>{error || "Loading…"}</div>;

  const statusOptions: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <Link to="/orders" className="button secondary" style={{ marginBottom: 16 }}>← Orders</Link>
        <h1>Order {order._id.slice(-8).toUpperCase()}</h1>
        <p>Status: <span className="badge">{order.status}</span> | Payment: <span className="badge">{order.paymentStatus}</span> | {order.paymentMethod}</p>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Customer</h3>
        <p>{order.user?.name} — {order.user?.email}</p>
        {order.shippingAddress && <p><strong>Address:</strong> {order.shippingAddress}</p>}
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Items</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item, i) => (
              <tr key={i}>
                <td>{item.product?.name ?? "—"}</td>
                <td>{item.quantity}</td>
                <td>${(item.price ?? 0).toFixed(2)}</td>
                <td>${((item.quantity ?? 0) * (item.price ?? 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
      </div>
      {order.paymentMethod === "INSTAPAY" && order.instaPayProof && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>InstaPay proof</h3>
          <a href={order.instaPayProof} target="_blank" rel="noreferrer">View proof</a>
        </div>
      )}
      <div className="card">
        <h3>Actions</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as OrderStatus)}
            disabled={order.status === "CANCELLED"}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {order.paymentMethod === "INSTAPAY" && order.paymentStatus === "PENDING_APPROVAL" && (
            <button className="button" onClick={confirmPayment}>Approve payment</button>
          )}
          {(order.status === "PENDING" || order.status === "CONFIRMED") && (
            <button className="button secondary" onClick={cancelOrder}>Cancel order</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
