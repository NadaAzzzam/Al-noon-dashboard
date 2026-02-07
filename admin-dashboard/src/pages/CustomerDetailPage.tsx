import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError, clearAuth, Order } from "../services/api";

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<{ id: string; name: string; email: string; createdAt: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setError(null);
      try {
        const [custRes, ordRes] = await Promise.all([
          api.getCustomer(id),
          api.getCustomerOrders(id)
        ]);
        setCustomer(custRes.customer);
        setOrders(ordRes.orders ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load");
      }
    };
    load();
  }, [id]);

  if (!customer) return <div>{error || "Loading…"}</div>;

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <Link to="/customers" className="button secondary" style={{ marginBottom: 16 }}>← Customers</Link>
        <h1>{customer.name}</h1>
        <p>{customer.email}</p>
      </div>
      <div className="card">
        <h3>Order history</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td><Link to={`/orders/${o._id}`}>{o._id.slice(-6).toUpperCase()}</Link></td>
                <td><span className="badge">{o.status}</span></td>
                <td><span className="badge">{o.paymentStatus}</span></td>
                <td>${o.total.toFixed(2)}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
