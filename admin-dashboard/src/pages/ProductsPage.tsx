import { useEffect, useState } from "react";
import { api, ApiError, Category, Product, clearAuth } from "../services/api";

type ProductForm = {
  name: string;
  description: string;
  price: number;
  discountPrice: number | undefined;
  stock: number;
  category: string;
  status: "ACTIVE" | "INACTIVE";
  images: string[];
};

const emptyForm: ProductForm = {
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setError(null);
    try {
      const response = await api.listProducts({
        page,
        limit: 20,
        search: search || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined
      });
      setProducts(response.products ?? []);
      setTotalPages(response.totalPages ?? 1);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuth();
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load products");
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.listCategories();
      setCategories(res.categories ?? []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form,
        category: form.category,
        discountPrice: form.discountPrice && form.discountPrice > 0 ? form.discountPrice : undefined
      };
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    }
  };

  const startEdit = (product: Product) => {
    const catId = typeof product.category === "object" && product.category && "_id" in product.category
      ? product.category._id
      : (product.category as string) ?? "";
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      category: catId,
      status: product.status,
      images: product.images ?? []
    });
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Soft delete this product?")) return;
    setError(null);
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  const toggleStatus = async (id: string, current: "ACTIVE" | "INACTIVE") => {
    setError(null);
    try {
      await api.setProductStatus(id, current === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>Products</h1>
          <p>Create and manage your catalog.</p>
        </div>
      </div>
      <div className="card">
        <h3>{editingId ? "Edit product" : "New product"}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <input
            placeholder="Price"
            type="number"
            step={0.01}
            min={0}
            value={form.price || ""}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
          <input
            placeholder="Discount price (optional)"
            type="number"
            step={0.01}
            min={0}
            value={form.discountPrice ?? ""}
            onChange={(e) => setForm({ ...form, discountPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
          <input
            placeholder="Stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            required
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="button" type="submit">{editingId ? "Update" : "Create"}</button>
          {editingId && (
            <button className="button secondary" type="button" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); }}>
              Cancel
            </button>
          )}
        </form>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 160 }}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>
                  <span className="badge">{product.status}</span>
                  <button
                    type="button"
                    className="button secondary"
                    style={{ marginLeft: 8 }}
                    onClick={() => toggleStatus(product._id, product.status)}
                  >
                    Toggle
                  </button>
                </td>
                <td>
                  ${product.discountPrice != null && product.discountPrice > 0
                    ? product.discountPrice.toFixed(2)
                    : product.price.toFixed(2)}
                </td>
                <td>{product.stock}</td>
                <td>
                  <button className="button secondary" onClick={() => startEdit(product)}>Edit</button>
                  {" "}
                  <button className="button" onClick={() => removeProduct(product._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <button className="button secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ margin: "0 12px" }}>Page {page} of {totalPages}</span>
            <button className="button secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
