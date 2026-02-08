import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import {
  api,
  ApiError,
  Category,
  Product,
  getProductImageUrl,
} from "../services/api";
import { formatPriceEGP } from "../utils/format";
import { useLocalized } from "../utils/localized";

type TopSellingItem = {
  productId: string;
  name: { en: string; ar: string };
  image?: string;
  totalQty: number;
};

const ProductsPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topSelling, setTopSelling] = useState<TopSellingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [newArrivalFilter, setNewArrivalFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setError(null);
    try {
      const res = (await api.listProducts({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        newArrival: newArrivalFilter || undefined,
      })) as { products: Product[]; total: number };
      setProducts(res.products ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(
        err instanceof ApiError ? err.message : t("products.failed_load"),
      );
    }
  };

  const loadCategories = async () => {
    try {
      const res = (await api.listCategories()) as { categories: Category[] };
      setCategories(res.categories ?? []);
    } catch (_) {}
  };

  const loadTopSelling = async () => {
    try {
      const res = (await api.getTopSellingProducts(15)) as {
        topSelling: TopSellingItem[];
      };
      setTopSelling(res.topSelling ?? []);
    } catch (_) {}
  };

  useEffect(() => {
    loadProducts();
  }, [page, search, statusFilter, categoryFilter, newArrivalFilter]);
  useEffect(() => {
    loadCategories();
  }, []);
  useEffect(() => {
    loadTopSelling();
  }, []);

  const setStatus = async (id: string, status: "ACTIVE" | "INACTIVE") => {
    setError(null);
    try {
      await api.setProductStatus(id, status);
      loadProducts();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("products.failed_status"),
      );
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm(t("products.soft_delete_confirm"))) return;
    setError(null);
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("products.failed_delete"),
      );
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className="header">
        <div>
          <h1>{t("products.title")}</h1>
          <p>{t("products.subtitle")}</p>
        </div>
        <Link to="/products/new" className="button">
          {t("products.new_product")}
        </Link>
      </div>

      {topSelling.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>{t("dashboard.best_selling")}</h3>
          <ul className="list list-with-images">
            {topSelling.map((b, i) => (
              <li key={b.productId ?? i}>
                {b.image ? (
                  <img
                    src={getProductImageUrl(b.image)}
                    alt=""
                    className="dashboard-product-img"
                  />
                ) : (
                  <span
                    className="dashboard-product-img-placeholder"
                    aria-hidden
                  />
                )}
                <Link
                  to={`/products/${b.productId}/edit`}
                  className="list-item-label"
                >
                  {localized(b.name)}
                </Link>
                <span className="badge">
                  {b.totalQty} {t("dashboard.sold")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="filters">
          <input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t("products.all_statuses")}</option>
            <option value="ACTIVE">{t("common.active")}</option>
            <option value="INACTIVE">{t("common.inactive")}</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">{t("products.all_categories")}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {localized(c.name)}
              </option>
            ))}
          </select>
          <label className="filters-checkbox">
            <input
              type="checkbox"
              checked={newArrivalFilter}
              onChange={(e) => setNewArrivalFilter(e.target.checked)}
            />
            <span>{t("products.new_arrivals_only")}</span>
          </label>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t("inventory.image")}</th>
              <th>{t("products.name")}</th>
              <th>{t("dashboard.status")}</th>
              <th>{t("products.price")}</th>
              <th>Discount</th>
              <th>{t("products.stock")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  {product.images?.[0] ? (
                    <img
                      src={getProductImageUrl(product.images[0])}
                      alt=""
                      className="inventory-product-img"
                    />
                  ) : (
                    <span className="inventory-product-img-placeholder">
                      {t("common.none")}
                    </span>
                  )}
                </td>
                <td>
                  <span>{localized(product.name)}</span>
                  {product.isNewArrival && (
                    <span className="badge badge-new">
                      {t("products.new_arrival_badge")}
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${product.status === "ACTIVE" ? "badge-success" : "badge-muted"}`}
                  >
                    {product.status}
                  </span>
                </td>
                <td>{formatPriceEGP(product.price)}</td>
                <td>
                  {product.discountPrice != null
                    ? formatPriceEGP(product.discountPrice)
                    : "—"}
                </td>
                <td>{product.stock}</td>
                <td>
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      {
                        label: t("common.edit"),
                        to: `/products/${product._id}/edit`,
                      },
                      {
                        label:
                          product.status === "ACTIVE"
                            ? t("common.disable")
                            : t("common.enable"),
                        onClick: () =>
                          setStatus(
                            product._id,
                            product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                          ),
                      },
                      {
                        label: t("common.delete"),
                        onClick: () => removeProduct(product._id),
                        danger: true,
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="button secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("common.prev")}
            </button>
            <span>
              {t("common.page")} {page} {t("common.of")} {totalPages}
            </span>
            <button
              className="button secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
