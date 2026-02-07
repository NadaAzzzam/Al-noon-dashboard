import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, Order } from "../services/api";

type Customer = { id: string; name: string; email: string; role: string; createdAt: string };

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setError(null);
      try {
        const [custData, ordData] = await Promise.all([
          api.getCustomer(id),
          api.getCustomerOrders(id)
        ]);
        const custRes = custData as unknown as { customer: Customer };
        const ordRes = ordData as unknown as { orders: Order[] };
        setCustomer(custRes.customer);
        setOrders(ordRes.orders ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : t("customer_detail.failed_load"));
      }
    };
    load();
  }, [id]);

  if (!customer) return <div>{error || t("common.loading")}</div>;

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <Link to="/customers" className="button secondary">{t("customer_detail.back_customers")}</Link>
      </div>
      <div className="card">
        <h3>{t("customer_detail.customer")}</h3>
        <p><strong>{customer.name}</strong></p>
        <p>{customer.email}</p>
        <p><span className="badge">{customer.role}</span></p>
      </div>
      <div className="card">
        <h3>{t("customer_detail.orders_history")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("dashboard.order")}</th>
              <th>{t("dashboard.status")}</th>
              <th>{t("dashboard.total")}</th>
              <th>{t("order_detail.date")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={5}>{t("customer_detail.no_orders")}</td></tr>}
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o._id.slice(-8)}</td>
                <td><span className="badge">{o.status}</span></td>
                <td>${o.total.toFixed(2)}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</td>
                <td><Link to={`/orders/${o._id}`} className="button secondary">{t("common.view")}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
