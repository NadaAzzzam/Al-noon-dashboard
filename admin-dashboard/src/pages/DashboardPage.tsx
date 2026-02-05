import { useEffect, useState } from "react";
import { api, ApiError, Order, Product, User } from "../services/api";

const DashboardPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const [productsResponse, ordersResponse, usersResponse] = await Promise.all([
          api.listProducts(),
          api.listOrders(),
          api.listUsers()
        ]);
        setProducts((productsResponse as { products: Product[] }).products ?? []);
        setOrders((ordersResponse as { orders: Order[] }).orders ?? []);
        setUsers((usersResponse as { users: User[] }).users ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("al_noon_token");
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      }
    };
    load();
  }, []);

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>Dashboard</h1>
          <p>Monitor store performance and daily activity.</p>
        </div>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3>Total Revenue</h3>
          <p>${revenue.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Orders</h3>
          <p>{orders.length}</p>
        </div>
        <div className="card">
          <h3>Products</h3>
          <p>{products.length}</p>
        </div>
        <div className="card">
          <h3>Customers</h3>
          <p>{users.length}</p>
        </div>
      </div>
      <div className="card">
        <h3>Latest Orders</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((order) => (
              <tr key={order._id}>
                <td>{order._id.slice(-6).toUpperCase()}</td>
                <td>{order.user?.name ?? "Guest"}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
                <td>${order.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;
