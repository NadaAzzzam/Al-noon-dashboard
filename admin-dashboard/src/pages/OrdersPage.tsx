import { useEffect, useState } from "react";
import { api, ApiError, Order } from "../services/api";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setError(null);
    try {
      const response = await api.listOrders() as { orders: Order[] };
      setOrders(response.orders ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("al_noon_token");
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: Order["status"]) => {
    setError(null);
    try {
      await api.updateOrderStatus(id, status);
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update order");
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>Orders</h1>
          <p>Track fulfillment and payment status.</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id.slice(-6).toUpperCase()}</td>
                <td>{order.user?.name ?? "Guest"}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order._id, event.target.value as Order["status"])}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="SHIPPED">Shipped</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;
