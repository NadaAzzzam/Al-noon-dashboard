import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Product } from "../services/api";

const InventoryPage = () => {
  const { t } = useTranslation();
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [outOfStock, setOutOfStock] = useState<Product[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [lowRes, outRes] = await Promise.all([
        api.getLowStock() as { products: Product[]; threshold: number },
        api.getOutOfStock() as { products: Product[] }
      ]);
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
      setStockValue((prev) => ({ ...prev, [productId]: undefined }));
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
              <th>{t("order_detail.product")}</th>
              <th>{t("products.stock")}</th>
              <th>{t("common.update")}</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.length === 0 && <tr><td colSpan={3}>{t("common.none")}</td></tr>}
            {lowStock.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
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
                  <button
                    className="button"
                    disabled={updatingId === p._id}
                    onClick={() => updateStock(p._id)}
                  >
                    {updatingId === p._id ? t("inventory.updating") : t("common.update")}
                  </button>
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
              <th>{t("order_detail.product")}</th>
              <th>{t("products.stock")}</th>
              <th>{t("common.update")}</th>
            </tr>
          </thead>
          <tbody>
            {outOfStock.length === 0 && <tr><td colSpan={3}>{t("common.none")}</td></tr>}
            {outOfStock.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
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
                  <button
                    className="button"
                    disabled={updatingId === p._id}
                    onClick={() => updateStock(p._id)}
                  >
                    {updatingId === p._id ? t("inventory.updating") : t("common.update")}
                  </button>
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
