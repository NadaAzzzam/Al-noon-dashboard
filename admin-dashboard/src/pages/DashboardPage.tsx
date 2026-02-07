import { useEffect, useState } from "react";
import { api, ApiError, clearAuth, Order } from "../services/api";

const DashboardPage = () => {
  const [stats, setStats] = useState<{
    totalOrders: number;
    ordersToday: number;
    revenue: number;
    lowStockCount: number;
    bestSellingProducts: { name: string; totalQty: number }[];
    ordersPerDay: { date: string; count: number }[];
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.getDashboardStats(),
          api.listOrders({ limit: 5 })
        ]);
        setStats(statsRes);
        setRecentOrders(ordersRes.orders ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      }
    };
    load();
  }, []);

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
          <h3>Total Orders</h3>
          <p>{stats?.totalOrders ?? "—"}</p>
        </div>
        <div className="card">
          <h3>Orders Today</h3>
          <p>{stats?.ordersToday ?? "—"}</p>
        </div>
        <div className="card">
          <h3>Revenue (Delivered)</h3>
          <p>${stats != null ? stats.revenue.toFixed(2) : "—"}</p>
        </div>
        <div className="card">
          <h3>Low Stock</h3>
          <p>{stats?.lowStockCount ?? "—"}</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card">
          <h3>Best Selling Products</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.bestSellingProducts ?? []).slice(0, 5).map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.totalQty}</td>
                </tr>
              ))}
              {(!stats?.bestSellingProducts?.length) && (
                <tr><td colSpan={2}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Orders per day (last 30)</h3>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {(stats?.ordersPerDay ?? []).slice(-14).reverse().map((d) => (
              <div key={d.date} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span>{d.date}</span>
                <span>{d.count}</span>
              </div>
            ))}
            {(!stats?.ordersPerDay?.length) && <p>No data</p>}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Recent Orders</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order._id}>
                <td>{order._id.slice(-6).toUpperCase()}</td>
                <td>{order.user?.name ?? "—"}</td>
                <td><span className="badge">{order.status}</span></td>
                <td><span className="badge">{order.paymentStatus}</span></td>
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
