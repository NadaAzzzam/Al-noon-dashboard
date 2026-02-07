import { useEffect, useState } from "react";
import { api, ApiError, Category, clearAuth } from "../services/api";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await api.listCategories();
      setCategories(res.categories ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuth();
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load categories");
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api.updateCategory(editingId, form);
      } else {
        await api.createCategory(form);
      }
      setForm({ name: "", description: "" });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  };

  const toggleVisible = async (id: string, isVisible: boolean) => {
    setError(null);
    try {
      await api.setCategoryStatus(id, !isVisible);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    }
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    setError(null);
    try {
      await api.deleteCategory(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <h1>Categories</h1>
        <p>Manage product categories and visibility.</p>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>{editingId ? "Edit category" : "New category"}</h3>
        <form className="form-grid" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="button" type="submit">{editingId ? "Update" : "Create"}</button>
          {editingId && (
            <button className="button secondary" type="button" onClick={() => { setEditingId(null); setForm({ name: "", description: "" }); }}>
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
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => toggleVisible(c._id, c.isVisible ?? true)}
                  >
                    {c.isVisible !== false ? "Hide" : "Show"}
                  </button>
                </td>
                <td>
                  <button className="button secondary" onClick={() => { setEditingId(c._id); setForm({ name: c.name, description: c.description ?? "" }); }}>Edit</button>
                  {" "}
                  <button className="button" onClick={() => deleteCat(c._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesPage;
