import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ImageLightbox } from "../components/ImageLightbox";
import {
  api,
  ApiError,
  Order,
  OrderStatus,
  getProductImageUrl,
  getUploadsBaseUrl,
} from "../services/api";

/** Full URL for payment proof (relative path or absolute URL). */
function getProofFullUrl(path: string): string {
  if (!path) return "";
  return path.startsWith("http") ? path : getUploadsBaseUrl() + (path.startsWith("/") ? path : `/${path}`);
}

/** True if the proof URL is an image (supports query strings, e.g. ?w=600). */
function isProofImageUrl(url: string): boolean {
  if (!url) return false;
  const pathname = url.split("?")[0];
  return /\.(png|jpe?g|gif|webp)$/i.test(pathname);
}

/** True if the file is an image (by MIME type). */
function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
import { formatPriceEGP } from "../utils/format";
import { useLocalized } from "../utils/localized";
import { daysSinceOrder, isLongWait } from "../utils/orderUtils";

const statusOptions: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const OrderDetailPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofImageLoadError, setProofImageLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePopupSrc, setImagePopupSrc] = useState<string | null>(null);

  // Object URL for selected proof file preview (revoke on change/unmount)
  useEffect(() => {
    if (proofFile && isImageFile(proofFile)) {
      const url = URL.createObjectURL(proofFile);
      setProofPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setProofPreviewUrl(null);
      };
    }
    setProofPreviewUrl(null);
    return undefined;
  }, [proofFile]);

  // Reset proof image error when proof URL changes (e.g. new upload or different order)
  useEffect(() => {
    setProofImageLoadError(false);
  }, [order?.payment?.instaPayProofUrl]);

  const load = async () => {
    if (!id) return;
    setError(null);
    try {
      const res = (await api.getOrder(id)) as {
        data?: { order: Order };
        order?: Order;
      };
      setOrder(res.data?.order ?? res.order ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("order_detail.failed_load"),
      );
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    if (!id) return;
    setError(null);
    try {
      await api.updateOrderStatus(id, status);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("order_detail.failed_status"),
      );
    }
  };

  const cancel = async () => {
    if (!id || !confirm(t("order_detail.cancel_confirm"))) return;
    setError(null);
    try {
      await api.cancelOrder(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("order_detail.failed_cancel"),
      );
    }
  };

  const attachProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !proofFile) return;
    setError(null);
    try {
      await api.attachPaymentProof(id, proofFile);
      setProofFile(null);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("order_detail.failed_proof"),
      );
    }
  };

  const confirmPayment = async (approved: boolean) => {
    if (!id) return;
    setError(null);
    try {
      await api.confirmPayment(id, approved);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("order_detail.failed_payment"),
      );
    }
  };

  if (!order) return <div>{error || t("common.loading")}</div>;

  const payment = order.payment as
    | { method?: string; status?: string; instaPayProofUrl?: string }
    | undefined;
  const isInstaPay = payment?.method === "INSTAPAY";
  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
  const days = daysSinceOrder(order.createdAt);
  const showLongWaitNotice = isLongWait(days, order.status);

  return (
    <div>
      <ImageLightbox
        open={!!imagePopupSrc}
        src={imagePopupSrc}
        onClose={() => setImagePopupSrc(null)}
      />
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {showLongWaitNotice && (
        <div
          className="card"
          style={{
            borderLeft: "4px solid var(--warning, #e67e22)",
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            {t("order_detail.long_wait_notice", { count: days ?? 0 })}
          </p>
        </div>
      )}
      <div className="header">
        <Link to="/orders" className="button secondary">
          {t("order_detail.back_orders")}
        </Link>
      </div>
      <div className="card">
        <h3>{t("order_detail.order_id", { id: order._id.slice(-8) })}</h3>
        <p>
          <strong>{t("order_detail.customer")}:</strong> {order.user?.name} –{" "}
          {order.user?.email}
        </p>
        {order.createdAt && (
          <p>
            <strong>{t("order_detail.date")}:</strong>{" "}
            {new Date(order.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
        {days != null && (
          <p>
            <strong>{t("order_detail.days_since_order")}:</strong>{" "}
            <span
              className={showLongWaitNotice ? "badge badge-pending" : undefined}
              style={showLongWaitNotice ? { fontWeight: 600 } : undefined}
            >
              {days === 0
                ? t("orders.today")
                : t("orders.days_count", { count: days })}
            </span>
          </p>
        )}
        {order.updatedAt && order.updatedAt !== order.createdAt && (
          <p>
            <strong>{t("order_detail.last_updated")}:</strong>{" "}
            {new Date(order.updatedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
        {order.shippingAddress && (
          <p>
            <strong>{t("order_detail.address")}:</strong>{" "}
            {order.shippingAddress}
          </p>
        )}
        <p>
          <strong>{t("order_detail.delivery_fee")}:</strong>{" "}
          {formatPriceEGP(order.deliveryFee ?? 0)}
        </p>
        <p>
          <strong>{t("order_detail.status")}:</strong>{" "}
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as OrderStatus)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </p>
        {canCancel && (
          <button
            className="button secondary"
            style={{ marginTop: 8 }}
            onClick={cancel}
          >
            {t("order_detail.cancel_order")}
          </button>
        )}
      </div>
      <div className="card">
        <h3>{t("order_detail.payment")}</h3>
        <p>
          <strong>{t("order_detail.method")}:</strong>{" "}
          {payment?.method ?? order.paymentMethod ?? "—"}
        </p>
        <p>
          <strong>{t("order_detail.status")}:</strong>{" "}
          <span className="badge">{payment?.status ?? "UNPAID"}</span>
        </p>
        {isInstaPay && (
          <div className="form-group" style={{ marginTop: 8 }}>
            <label htmlFor="order-payment-proof" style={{ display: "block", marginBottom: 4 }}>
              <strong>{t("order_detail.proof")}</strong>
            </label>
            <form
              onSubmit={attachProof}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                type="file"
                id="order-payment-proof"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                style={{ flex: "1 1 200px", minWidth: 0 }}
              />
              <button
                className="button"
                type="submit"
                disabled={!proofFile}
              >
                {t("order_detail.attach_proof")}
              </button>
            </form>
            {proofPreviewUrl && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <img
                  src={proofPreviewUrl}
                  alt={t("order_detail.proof")}
                  style={{
                    maxHeight: 280,
                    maxWidth: 360,
                    objectFit: "contain",
                    border: "1px solid var(--color-border, #e0e0e0)",
                    borderRadius: 8,
                  }}
                />
                <span style={{ marginLeft: 8, color: "var(--color-muted, #666)", fontSize: 14 }}>
                  {t("order_detail.preview_before_attach")}
                </span>
              </div>
            )}
            {payment?.instaPayProofUrl && (
              <>
                <p style={{ marginTop: 8, marginBottom: 4 }}>
                  <a
                    href={getProofFullUrl(payment.instaPayProofUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("order_detail.view_proof")}
                  </a>
                </p>
                {isProofImageUrl(payment.instaPayProofUrl) && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    {proofImageLoadError ? (
                      <p style={{ color: "var(--color-muted, #666)", margin: 0, fontSize: 14 }}>
                        {t("order_detail.proof_image_load_error")}
                      </p>
                    ) : (
                      <img
                        src={getProofFullUrl(payment.instaPayProofUrl)}
                        alt={t("order_detail.proof")}
                        onError={() => setProofImageLoadError(true)}
                        style={{
                          maxHeight: 280,
                          maxWidth: 360,
                          objectFit: "contain",
                          border: "1px solid var(--color-border, #e0e0e0)",
                          borderRadius: 8,
                        }}
                      />
                    )}
                  </div>
                )}
                {payment?.status === "UNPAID" && (
                  <div style={{ marginTop: 12 }}>
                    <button className="button" onClick={() => confirmPayment(true)}>
                      {t("order_detail.approve_payment")}
                    </button>
                    <button
                      className="button secondary"
                      style={{ marginLeft: 8 }}
                      onClick={() => confirmPayment(false)}
                    >
                      {t("order_detail.reject")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <div className="card">
        <h3>{t("order_detail.items")}</h3>
        <table className="table order-detail-items-table">
          <thead>
            <tr>
              <th>{t("order_detail.product")}</th>
              <th>{t("order_detail.qty")}</th>
              <th>{t("order_detail.price")}</th>
              <th>{t("order_detail.subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item, i) => {
              const imgPath = item.product?.images?.[0];
              return (
                <tr key={i}>
                  <td>
                    <div className="order-item-product">
                      {imgPath ? (
                        <img
                          src={getProductImageUrl(imgPath)}
                          alt=""
                          className="order-item-product-img table-image-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setImagePopupSrc(getProductImageUrl(imgPath))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            setImagePopupSrc(getProductImageUrl(imgPath))
                          }
                        />
                      ) : (
                        <span
                          className="order-item-product-placeholder"
                          aria-hidden="true"
                        />
                      )}
                      <span>
                        {item.product?.name != null
                          ? localized(item.product.name)
                          : "—"}
                      </span>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatPriceEGP(item.price ?? 0)}</td>
                  <td>
                    {formatPriceEGP((item.quantity ?? 0) * (item.price ?? 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(() => {
          const itemsSubtotal = (order.items ?? []).reduce(
            (sum, item) => sum + (item.quantity ?? 0) * (item.price ?? 0),
            0
          );
          const deliveryFee = order.deliveryFee ?? 0;
          return (
            <>
              <p>
                <strong>{t("order_detail.total_order_price")}:</strong>{" "}
                {formatPriceEGP(itemsSubtotal)}
              </p>
              <p>
                <strong>{t("order_detail.delivery_fees")}:</strong>{" "}
                {formatPriceEGP(deliveryFee)}
              </p>
              <p>
                <strong>
                  {t("order_detail.total_label")}: {formatPriceEGP(order.total)}
                </strong>
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default OrderDetailPage;
