import { useEffect, useState } from "react";
import { api, Order, Product, User } from "../services/api";

const DashboardPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      const [productsResponse, ordersResponse, usersResponse] = await Promise.all([
        api.listProducts(),
        api.listOrders(),
        api.listUsers()
      ]);
      setProducts(productsResponse.products ?? []);
      setOrders(ordersResponse.orders ?? []);
      setUsers(usersResponse.users ?? []);
    };
    load();
  }, []);

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
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
