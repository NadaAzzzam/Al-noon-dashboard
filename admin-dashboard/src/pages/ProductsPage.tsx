import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ImageLightbox } from "../components/ImageLightbox";
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

const PAGE_SIZE = 20;

const ProductsPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [newArrivalFilter, setNewArrivalFilter] = useState(false);
  const [salesFilter, setSalesFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [imagePopupSrc, setImagePopupSrc] = useState<string | null>(null);

  const hasFilters = !!(
    search ||
    statusFilter ||
    categoryFilter ||
    newArrivalFilter ||
    salesFilter ||
    ratingFilter
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setNewArrivalFilter(false);
    setSalesFilter("");
    setRatingFilter("");
    setPage(1);
  };

  const loadProducts = async () => {
    setError(null);
    try {
      const res = (await api.listProducts({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        newArrival: newArrivalFilter || undefined,
        sort: salesFilter || undefined,
        minRating: ratingFilter ? Number(ratingFilter) : undefined,
      })) as {
        data?: Product[];
        pagination?: { total: number };
        products?: Product[];
        total?: number;
      };
      setProducts(res.data ?? res.products ?? []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
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
      const res = (await api.listCategories()) as {
        data?: { categories: Category[] };
        categories?: Category[];
      };
      setCategories(res.data?.categories ?? res.categories ?? []);
    } catch (_) {}
  };

  useEffect(() => {
    loadProducts();
  }, [
    page,
    search,
    statusFilter,
    categoryFilter,
    newArrivalFilter,
    salesFilter,
    ratingFilter,
  ]);
  useEffect(() => {
    loadCategories();
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

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      )
        pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
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
          <h1>{t("products.title")}</h1>
          <p>{t("products.subtitle")}</p>
        </div>
        <Link to="/products/new" className="button">
          <svg
            className="button-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("products.new_product")}
        </Link>
      </div>

      <div className="card">
        <div className="filters">
          <span className="filters-label">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </span>
          <input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 200 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("products.all_statuses")}</option>
            <option value="ACTIVE">{t("common.active")}</option>
            <option value="INACTIVE">{t("common.inactive")}</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
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
              onChange={(e) => {
                setNewArrivalFilter(e.target.checked);
                setPage(1);
              }}
            />
            <span>{t("products.new_arrivals_only")}</span>
          </label>
          <select
            value={salesFilter}
            onChange={(e) => {
              setSalesFilter(e.target.value);
              setPage(1);
            }}
            title={t("products.filter_by_sales")}
          >
            <option value="">{t("products.all_sales")}</option>
            <option value="highestSelling">
              {t("products.highest_selling")}
            </option>
            <option value="lowSelling">{t("products.low_sale")}</option>
          </select>
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            title={t("products.filter_by_rating")}
          >
            <option value="">{t("products.rating_any")}</option>
            <option value="4">{t("products.rating_4_stars")}</option>
            <option value="3">{t("products.rating_3_stars")}</option>
            <option value="2">{t("products.rating_2_stars")}</option>
          </select>
          {hasFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              {t("common.clear_filters", "Clear filters")}
            </button>
          )}
        </div>

        {products.length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("inventory.image")}</th>
                  <th>{t("products.name")}</th>
                  <th>{t("dashboard.status")}</th>
                  <th>{t("products.price")}</th>
                  <th>{t("products.discount_price", "Discount")}</th>
                  <th>{t("products.stock")}</th>
                  <th>{t("products.best_selling")}</th>
                  <th>{t("products.rating")}</th>
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
                          className="inventory-product-img table-image-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setImagePopupSrc(
                              getProductImageUrl(product.images![0]),
                            )
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            setImagePopupSrc(
                              getProductImageUrl(product.images![0]),
                            )
                          }
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
                        {product.status === "ACTIVE"
                          ? t("common.active")
                          : t("common.inactive")}
                      </span>
                    </td>
                    <td>{formatPriceEGP(product.price)}</td>
                    <td>
                      {product.discountPrice != null
                        ? formatPriceEGP(product.discountPrice)
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={
                          product.stock === 0
                            ? "badge badge-danger"
                            : product.stock <= 5
                              ? "badge badge-warning"
                              : ""
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>{product.soldQty ?? 0}</td>
                    <td>
                      {product.ratingCount != null &&
                      product.ratingCount > 0 ? (
                        <span
                          title={t("products.rated_by_count", {
                            count: product.ratingCount,
                          })}
                        >
                          {product.averageRating != null
                            ? product.averageRating.toFixed(1)
                            : "—"}{" "}
                          ★ ({product.ratingCount})
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
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
                                product.status === "ACTIVE"
                                  ? "INACTIVE"
                                  : "ACTIVE",
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
                <span className="pagination-info">
                  {t("common.showing", "Showing")} {startItem}–{endItem}{" "}
                  {t("common.of")} {total}
                </span>
                <div className="pagination-pages">
                  <button
                    className="pagination-page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="pagination-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-page ${page === p ? "active" : ""}`}
                        onClick={() => setPage(p as number)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    className="pagination-page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <h3>{t("products.no_products", "No products found")}</h3>
            <p>
              {hasFilters
                ? t("products.no_products_filter", "Try adjusting your filters")
                : t(
                    "products.no_products_desc",
                    "Create your first product to get started",
                  )}
            </p>
            {!hasFilters && (
              <Link to="/products/new" className="button">
                <svg
                  className="button-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t("products.new_product")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
