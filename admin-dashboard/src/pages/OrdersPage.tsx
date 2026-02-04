import { useEffect, useState } from "react";
import { api, Order } from "../services/api";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    const response = await api.listOrders();
    setOrders(response.orders ?? []);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: Order["status"]) => {
    await api.updateOrderStatus(id, status);
    loadOrders();
  };

  return (
    <div>
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
