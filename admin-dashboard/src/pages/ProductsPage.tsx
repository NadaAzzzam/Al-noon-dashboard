import { useEffect, useState } from "react";
import { api, Product } from "../services/api";

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category: "",
  status: "ACTIVE" as const
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProducts = async () => {
    const response = await api.listProducts();
    setProducts(response.products ?? []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId) {
      await api.updateProduct(editingId, form);
    } else {
      await api.createProduct(form);
    }
    setForm({ ...emptyForm });
    setEditingId(null);
    loadProducts();
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stock: product.stock,
      category: typeof product.category === "string" ? product.category : product.category?.name ?? "",
      status: product.status
    });
  };

  const removeProduct = async (id: string) => {
    await api.deleteProduct(id);
    loadProducts();
  };

  return (
    <div>
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
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            placeholder="Category ID"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            required
          />
          <input
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
            required
          />
          <input
            placeholder="Stock"
            type="number"
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}
            required
          />
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as "ACTIVE" | "DRAFT" })}
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
          </select>
          <input
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <button className="button" type="submit">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ ...emptyForm });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>
      <div className="card">
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
                </td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>
                  <button className="button secondary" onClick={() => startEdit(product)}>
                    Edit
                  </button>
                  <button className="button" onClick={() => removeProduct(product._id)} style={{ marginLeft: 8 }}>
                    Delete
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

export default ProductsPage;
