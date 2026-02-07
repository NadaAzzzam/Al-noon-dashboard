import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, clearAuth, Order } from "../services/api";

type Customer = { id: string; name: string; email: string; createdAt: string };

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await api.listCustomers();
        setCustomers(res.customers ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load customers");
      }
    };
    load();
  }, []);

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <h1>Customers</h1>
        <p>View customer list and order history.</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>
                  <Link to={`/customers/${c.id}`} className="button secondary">Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersPage;
