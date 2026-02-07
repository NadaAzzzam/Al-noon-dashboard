import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Category, Product } from "../services/api";

const emptyForm: {
  name: string;
  description: string;
  price: number;
  discountPrice: number | undefined;
  stock: number;
  category: string;
  status: "ACTIVE" | "INACTIVE";
  images: string[];
} = {
  name: "",
  description: "",
  price: 0,
  discountPrice: undefined,
  stock: 0,
  category: "",
  status: "ACTIVE",
  images: []
};

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setError(null);
    try {
      const res = await api.listProducts({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined
      }) as { products: Product[]; total: number };
      setProducts(res.products ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("products.failed_load"));
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.listCategories() as { categories: Category[] };
      setCategories(res.categories ?? []);
    } catch (_) {}
  };

  useEffect(() => { loadProducts(); }, [page, search, statusFilter, categoryFilter]);
  useEffect(() => { loadCategories(); }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = { ...form, category: form.category || undefined, discountPrice: form.discountPrice || undefined };
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.failed_save"));
    }
  };

  const startEdit = (product: Product) => {
    const catId = typeof product.category === "object" && product.category && product.category !== null && "_id" in product.category
      ? (product.category as { _id: string })._id
      : String(product.category ?? "");
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      category: catId,
      status: product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      images: product.images ?? []
    });
  };

  const setStatus = async (id: string, status: "ACTIVE" | "INACTIVE") => {
    setError(null);
    try {
      await api.setProductStatus(id, status);
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.failed_status"));
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm(t("products.soft_delete_confirm"))) return;
    setError(null);
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.failed_delete"));
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("products.title")}</h1>
          <p>{t("products.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <h3>{editingId ? t("products.edit_product") : t("products.new_product")}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <input placeholder={t("products.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
            <option value="">{t("products.select_category")}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <input placeholder={t("products.price")} type="number" step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
          <input placeholder={t("products.discount_price")} type="number" step={0.01} value={form.discountPrice ?? ""} onChange={(e) => setForm({ ...form, discountPrice: e.target.value ? Number(e.target.value) : undefined })} />
          <input placeholder={t("products.stock")} type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}>
            <option value="ACTIVE">{t("common.active")}</option>
            <option value="INACTIVE">{t("common.inactive")}</option>
          </select>
          <input placeholder={t("products.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="button" type="submit">{editingId ? t("common.update") : t("common.create")}</button>
          {editingId && (
            <button className="button secondary" type="button" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); }}>{t("common.cancel")}</button>
          )}
        </form>
      </div>
      <div className="card">
        <div className="filters">
          <input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t("products.all_statuses")}</option>
            <option value="ACTIVE">{t("common.active")}</option>
            <option value="INACTIVE">{t("common.inactive")}</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">{t("products.all_categories")}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
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
                <td>{product.name}</td>
                <td>
                  <span className={`badge ${product.status === "ACTIVE" ? "badge-success" : "badge-muted"}`}>{product.status}</span>
                </td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.discountPrice != null ? `$${product.discountPrice.toFixed(2)}` : "—"}</td>
                <td>{product.stock}</td>
                <td>
                  <button className="button secondary" onClick={() => startEdit(product)}>{t("common.edit")}</button>
                  <button className="button secondary" style={{ marginLeft: 8 }} onClick={() => setStatus(product._id, product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>
                    {product.status === "ACTIVE" ? t("common.disable") : t("common.enable")}
                  </button>
                  <button className="button" style={{ marginLeft: 8 }} onClick={() => removeProduct(product._id)}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("common.prev")}</button>
            <span>{t("common.page")} {page} {t("common.of")} {totalPages}</span>
            <button className="button secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t("common.next")}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
