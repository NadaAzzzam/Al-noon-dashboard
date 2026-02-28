import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, Order, getProductImageUrl } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { ImageLightbox } from "../components/ImageLightbox";
import { formatPriceEGP } from "../utils/format";

type Customer = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
};

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imagePopupSrc, setImagePopupSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setError(null);
      try {
        const [custData, ordData] = await Promise.all([
          api.getCustomer(id),
          api.getCustomerOrders(id)
        ]);
        const custRes = custData as { data?: { customer: Customer }; customer?: Customer };
        const ordRes = ordData as { data?: { orders: Order[] }; orders?: Order[] };
        setCustomer(custRes.data?.customer ?? custRes.customer ?? null);
        setOrders(ordRes.data?.orders ?? ordRes.orders ?? []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("customer_detail.failed_load"));
      }
    };
    load();
  }, [id]);

  if (!customer) return <div>{error || t("common.loading")}</div>;

  const avatarUrl = customer.avatar ? getProductImageUrl(customer.avatar) : null;
  const initials = (customer.name || "?")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <ImageLightbox
        open={!!imagePopupSrc}
        src={imagePopupSrc}
        onClose={() => setImagePopupSrc(null)}
      />
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <Link to="/customers" className="button secondary">{t("customer_detail.back_customers")}</Link>
      </div>
      <div className="card customer-detail-card">
        <h3>{t("customer_detail.customer")}</h3>
        <div className="customer-detail-header">
          <button
            type="button"
            className="customer-avatar-cell customer-avatar-cell--large"
            onClick={() => avatarUrl && setImagePopupSrc(avatarUrl)}
            onKeyDown={(e) => e.key === "Enter" && avatarUrl && setImagePopupSrc(avatarUrl)}
            title={avatarUrl ? t("common.view_image") : undefined}
            disabled={!avatarUrl}
            aria-label={avatarUrl ? t("common.view_image") : undefined}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="customer-avatar-img" />
            ) : (
              <span className="customer-avatar-initials">{initials}</span>
            )}
          </button>
          <div className="customer-detail-info">
            <p className="customer-detail-name"><strong>{customer.name}</strong></p>
            <p><a href={`mailto:${customer.email}`}>{customer.email}</a></p>
            <p><span className="badge">{customer.role}</span></p>
            {customer.createdAt && (
              <p className="customer-detail-meta">
                {t("customer_detail.member_since")}{" "}
                {new Date(customer.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            )}
          </div>
        </div>
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
                <td>{formatPriceEGP(o.total)}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</td>
                <td>
                <TableActionsDropdown
                  ariaLabel={t("common.actions")}
                  actions={[{ label: t("common.view"), to: `/orders/${o._id}` }]}
                />
              </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
