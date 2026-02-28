import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageLightbox } from "../components/ImageLightbox";
import {
  api,
  ApiError,
  Product,
  getProductImageUrl,
  getProductDefaultImageUrl,
  isVideoUrl,
} from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { useLocalized } from "../utils/localized";

const InventoryPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [outOfStock, setOutOfStock] = useState<Product[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [_updatingId, setUpdatingId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [imagePopupSrc, setImagePopupSrc] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const results = await Promise.all([
        api.getLowStock(),
        api.getOutOfStock(),
      ]);
      const lowRes = results[0] as {
        data?: { products: Product[]; threshold: number };
        products?: Product[];
        threshold?: number;
      };
      const outRes = results[1] as {
        data?: { products: Product[] };
        products?: Product[];
      };
      const lowData = lowRes.data ?? lowRes;
      const outData = outRes.data ?? outRes;
      setLowStock(lowData.products ?? []);
      setOutOfStock(outData.products ?? []);
      setThreshold(lowData.threshold ?? 5);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("inventory.failed_load"),
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStock = async (productId: string) => {
    const value = stockValue[productId] ?? 0;
    setUpdatingId(productId);
    setError(null);
    try {
      await api.updateProductStock(productId, value);
      setStockValue((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("inventory.failed_update"),
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
      <div className="header">
        <div>
          <h1>{t("inventory.title")}</h1>
          <p>{t("inventory.subtitle", { count: threshold })}</p>
        </div>
      </div>
      <div className="card">
        <h3>{t("inventory.low_stock_title", { count: threshold })}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("inventory.image")}</th>
              <th>{t("order_detail.product")}</th>
              <th>{t("products.stock")}</th>
              <th>{t("common.update")}</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.length === 0 && (
              <tr>
                <td colSpan={4}>{t("common.none")}</td>
              </tr>
            )}
            {lowStock.map((p) => (
              <tr key={p._id}>
                <td>
                  {getProductDefaultImageUrl(p) || p.images?.[0] ? (
                    (() => {
                      const rawUrl =
                        getProductDefaultImageUrl(p) || p.images?.[0] || "";
                      const src = getProductImageUrl(rawUrl);
                      const isVideo = isVideoUrl(src);
                      const commonProps = {
                        className:
                          "inventory-product-img table-image-clickable",
                        role: "button" as const,
                        tabIndex: 0,
                        onClick: () => setImagePopupSrc(src),
                        onKeyDown: (e: React.KeyboardEvent) =>
                          e.key === "Enter" && setImagePopupSrc(src),
                      };
                      return isVideo ? (
                        <video
                          src={src}
                          muted
                          loop
                          playsInline
                          {...commonProps}
                        />
                      ) : (
                        <img src={src} alt="" {...commonProps} />
                      );
                    })()
                  ) : (
                    <span className="inventory-product-img-placeholder">
                      {t("common.none")}
                    </span>
                  )}
                </td>
                <td>{localized(p.name)}</td>
                <td>
                  <span className="badge badge-warning">{p.stock}</span>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("inventory.new_qty")}
                    value={stockValue[p._id] ?? ""}
                    onChange={(e) =>
                      setStockValue((prev) => ({
                        ...prev,
                        [p._id]: Number(e.target.value) || 0,
                      }))
                    }
                    style={{ width: 80, marginRight: 8 }}
                  />
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      {
                        label: t("common.update"),
                        onClick: () => updateStock(p._id),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>{t("inventory.out_of_stock")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("inventory.image")}</th>
              <th>{t("order_detail.product")}</th>
              <th>{t("products.stock")}</th>
              <th>{t("common.update")}</th>
            </tr>
          </thead>
          <tbody>
            {outOfStock.length === 0 && (
              <tr>
                <td colSpan={4}>{t("common.none")}</td>
              </tr>
            )}
            {outOfStock.map((p) => (
              <tr key={p._id}>
                <td>
                  {getProductDefaultImageUrl(p) || p.images?.[0] ? (
                    (() => {
                      const rawUrl =
                        getProductDefaultImageUrl(p) || p.images?.[0] || "";
                      const src = getProductImageUrl(rawUrl);
                      const isVideo = isVideoUrl(src);
                      const commonProps = {
                        className:
                          "inventory-product-img table-image-clickable",
                        role: "button" as const,
                        tabIndex: 0,
                        onClick: () => setImagePopupSrc(src),
                        onKeyDown: (e: React.KeyboardEvent) =>
                          e.key === "Enter" && setImagePopupSrc(src),
                      };
                      return isVideo ? (
                        <video
                          src={src}
                          muted
                          loop
                          playsInline
                          {...commonProps}
                        />
                      ) : (
                        <img src={src} alt="" {...commonProps} />
                      );
                    })()
                  ) : (
                    <span className="inventory-product-img-placeholder">
                      {t("common.none")}
                    </span>
                  )}
                </td>
                <td>{localized(p.name)}</td>
                <td>
                  <span className="badge badge-danger">0</span>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("inventory.new_qty")}
                    value={stockValue[p._id] ?? ""}
                    onChange={(e) =>
                      setStockValue((prev) => ({
                        ...prev,
                        [p._id]: Number(e.target.value) || 0,
                      }))
                    }
                    style={{ width: 80, marginRight: 8 }}
                  />
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      {
                        label: t("common.update"),
                        onClick: () => updateStock(p._id),
                      },
                    ]}
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

export default InventoryPage;
