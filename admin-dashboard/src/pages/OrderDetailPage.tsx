import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, Order, OrderStatus } from "../services/api";

const statusOptions: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const OrderDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await api.getOrder(id) as { order: Order };
      setOrder(res.order);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("order_detail.failed_load"));
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    if (!id) return;
    setError(null);
    try {
      await api.updateOrderStatus(id, status);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("order_detail.failed_status"));
    }
  };

  const cancel = async () => {
    if (!id || !confirm(t("order_detail.cancel_confirm"))) return;
    setError(null);
    try {
      await api.cancelOrder(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("order_detail.failed_cancel"));
    }
  };

  const attachProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !proofUrl.trim()) return;
    setError(null);
    try {
      await api.attachPaymentProof(id, proofUrl.trim());
      setProofUrl("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("order_detail.failed_proof"));
    }
  };

  const confirmPayment = async (approved: boolean) => {
    if (!id) return;
    setError(null);
    try {
      await api.confirmPayment(id, approved);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("order_detail.failed_payment"));
    }
  };

  if (!order) return <div>{error || t("common.loading")}</div>;

  const payment = order.payment as { method?: string; status?: string; instaPayProofUrl?: string } | undefined;
  const isInstaPay = payment?.method === "INSTAPAY";
  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <Link to="/orders" className="button secondary">{t("order_detail.back_orders")}</Link>
      </div>
      <div className="card">
        <h3>{t("order_detail.order_id", { id: order._id.slice(-8) })}</h3>
        <p><strong>{t("order_detail.customer")}:</strong> {order.user?.name} – {order.user?.email}</p>
        {order.shippingAddress && <p><strong>{t("order_detail.address")}:</strong> {order.shippingAddress}</p>}
        <p><strong>{t("order_detail.status")}:</strong>{" "}
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as OrderStatus)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </p>
        {canCancel && (
          <button className="button secondary" style={{ marginTop: 8 }} onClick={cancel}>{t("order_detail.cancel_order")}</button>
        )}
      </div>
      <div className="card">
        <h3>{t("order_detail.payment")}</h3>
        <p><strong>{t("order_detail.method")}:</strong> {payment?.method ?? order.paymentMethod ?? "—"}</p>
        <p><strong>{t("order_detail.status")}:</strong> <span className="badge">{payment?.status ?? "UNPAID"}</span></p>
        {isInstaPay && (
          <>
            {payment?.instaPayProofUrl ? (
              <p>
                <strong>{t("order_detail.proof")}:</strong>{" "}
                <a href={payment.instaPayProofUrl} target="_blank" rel="noopener noreferrer">{t("order_detail.view_screenshot")}</a>
              </p>
            ) : (
              <form onSubmit={attachProof} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input
                  type="url"
                  placeholder={t("order_detail.instapay_proof_placeholder")}
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  style={{ flex: 1, maxWidth: 320 }}
                />
                <button className="button" type="submit">{t("order_detail.attach_proof")}</button>
              </form>
            )}
            {payment?.status === "UNPAID" && payment?.instaPayProofUrl && (
              <div style={{ marginTop: 12 }}>
                <button className="button" onClick={() => confirmPayment(true)}>{t("order_detail.approve_payment")}</button>
                <button className="button secondary" style={{ marginLeft: 8 }} onClick={() => confirmPayment(false)}>{t("order_detail.reject")}</button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="card">
        <h3>{t("order_detail.items")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("order_detail.product")}</th>
              <th>{t("order_detail.qty")}</th>
              <th>{t("order_detail.price")}</th>
              <th>{t("order_detail.subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item, i) => (
              <tr key={i}>
                <td>{item.product?.name ?? "—"}</td>
                <td>{item.quantity}</td>
                <td>${(item.price ?? 0).toFixed(2)}</td>
                <td>${((item.quantity ?? 0) * (item.price ?? 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><strong>{t("order_detail.total_label")}: ${order.total.toFixed(2)}</strong></p>
      </div>
    </div>
  );
};

export default OrderDetailPage;
