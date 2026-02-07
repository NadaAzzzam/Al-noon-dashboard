import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Category } from "../services/api";

const CategoriesPage = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<{ name: string; description: string; status: "visible" | "hidden" }>({
    name: "",
    description: "",
    status: "visible"
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await api.listCategories() as { categories: Category[] };
      setCategories(res.categories ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("categories.failed_load"));
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name: "", description: "", status: "visible" });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setForm({
      name: c.name,
      description: c.description ?? "",
      status: c.status ?? "visible"
    });
    setEditingId(c._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api.updateCategory(editingId, form);
      } else {
        await api.createCategory(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.failed_save"));
    }
  };

  const setStatus = async (id: string, status: "visible" | "hidden") => {
    setError(null);
    try {
      await api.setCategoryStatus(id, status);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.failed_status"));
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("categories.delete_confirm"))) return;
    setError(null);
    try {
      await api.deleteCategory(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.failed_delete"));
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("categories.title")}</h1>
          <p>{t("categories.subtitle")}</p>
        </div>
        <button className="button" onClick={openAdd}>{t("categories.add_category")}</button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("categories.name")}</th>
              <th>{t("dashboard.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>
                  <span className={`badge ${c.status === "visible" ? "badge-success" : "badge-muted"}`}>
                    {c.status === "visible" ? t("categories.visible") : t("categories.hidden")}
                  </span>
                </td>
                <td>
                  <button className="button secondary" onClick={() => openEdit(c)}>{t("common.edit")}</button>
                  <button
                    className="button secondary"
                    style={{ marginLeft: 8 }}
                    onClick={() => setStatus(c._id, c.status === "visible" ? "hidden" : "visible")}
                  >
                    {c.status === "visible" ? t("categories.hide") : t("categories.show")}
                  </button>
                  <button className="button" style={{ marginLeft: 8 }} onClick={() => remove(c._id)}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? t("categories.edit_category") : t("categories.new_category")}</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <input
                placeholder={t("categories.name")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                placeholder={t("categories.description")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "visible" | "hidden" })}
              >
                <option value="visible">{t("categories.visible")}</option>
                <option value="hidden">{t("categories.hidden")}</option>
              </select>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <button className="button" type="submit">{editingId ? t("common.update") : t("common.create")}</button>
                <button className="button secondary" type="button" onClick={() => setModalOpen(false)}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
