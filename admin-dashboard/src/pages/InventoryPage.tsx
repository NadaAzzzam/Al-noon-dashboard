import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Product, getProductImageUrl } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { useLocalized } from "../utils/localized";

const InventoryPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [outOfStock, setOutOfStock] = useState<Product[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const results = await Promise.all([
        api.getLowStock(),
        api.getOutOfStock()
      ]);
      const lowRes = results[0] as { products: Product[]; threshold: number };
      const outRes = results[1] as { products: Product[] };
      setLowStock(lowRes.products ?? []);
      setOutOfStock(outRes.products ?? []);
      setThreshold(lowRes.threshold ?? 5);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("inventory.failed_load"));
    }
  };

  useEffect(() => { load(); }, []);

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
      setError(err instanceof ApiError ? err.message : t("inventory.failed_update"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
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
            {lowStock.length === 0 && <tr><td colSpan={4}>{t("common.none")}</td></tr>}
            {lowStock.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.images?.[0] ? (
                    <img src={getProductImageUrl(p.images[0])} alt="" className="inventory-product-img" />
                  ) : (
                    <span className="inventory-product-img-placeholder">{t("common.none")}</span>
                  )}
                </td>
                <td>{localized(p.name)}</td>
                <td><span className="badge badge-warning">{p.stock}</span></td>
                <td>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("inventory.new_qty")}
                    value={stockValue[p._id] ?? ""}
                    onChange={(e) => setStockValue((prev) => ({ ...prev, [p._id]: Number(e.target.value) || 0 }))}
                    style={{ width: 80, marginRight: 8 }}
                  />
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      {
                        label: t("common.update"),
                        onClick: () => updateStock(p._id)
                      }
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
            {outOfStock.length === 0 && <tr><td colSpan={4}>{t("common.none")}</td></tr>}
            {outOfStock.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.images?.[0] ? (
                    <img src={getProductImageUrl(p.images[0])} alt="" className="inventory-product-img" />
                  ) : (
                    <span className="inventory-product-img-placeholder">{t("common.none")}</span>
                  )}
                </td>
                <td>{localized(p.name)}</td>
                <td><span className="badge badge-danger">0</span></td>
                <td>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("inventory.new_qty")}
                    value={stockValue[p._id] ?? ""}
                    onChange={(e) => setStockValue((prev) => ({ ...prev, [p._id]: Number(e.target.value) || 0 }))}
                    style={{ width: 80, marginRight: 8 }}
                  />
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      {
                        label: t("common.update"),
                        onClick: () => updateStock(p._id)
                      }
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
