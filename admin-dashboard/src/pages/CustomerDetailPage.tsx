import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
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
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

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

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError(t("validation.min_length", { min: 6 }) || "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("customer_detail.change_password_failed") || "Passwords do not match");
      return;
    }
    if (!id) return;
    setPasswordSaving(true);
    try {
      await api.updateCustomerPassword(id, { newPassword, confirmPassword });
      toast.success(t("customer_detail.change_password_success"));
      closePasswordModal();
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : t("customer_detail.change_password_failed"));
    } finally {
      setPasswordSaving(false);
    }
  };

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
            <p style={{ marginTop: 12 }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setPasswordModalOpen(true)}
                data-testid="customer-change-password-btn"
              >
                {t("customer_detail.change_password")}
              </button>
            </p>
          </div>
        </div>
      </div>
      {passwordModalOpen && (
        <div
          className="modal-overlay"
          onClick={closePasswordModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
        >
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 id="change-password-title">{t("customer_detail.change_password")}</h3>
            <form onSubmit={handleChangePasswordSubmit} noValidate>
              {passwordError && (
                <div className="error" role="alert" style={{ marginBottom: 12 }}>
                  {passwordError}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="customer-new-password">{t("customer_detail.new_password")}</label>
                <input
                  id="customer-new-password"
                  type="password"
                  data-testid="customer-new-password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                  placeholder={t("customer_detail.new_password")}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="customer-confirm-password">{t("customer_detail.confirm_password")}</label>
                <input
                  id="customer-confirm-password"
                  type="password"
                  data-testid="customer-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                  placeholder={t("customer_detail.confirm_password")}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" className="button secondary" onClick={closePasswordModal} disabled={passwordSaving}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="button primary" disabled={passwordSaving} data-testid="customer-password-submit">
                  {passwordSaving ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
