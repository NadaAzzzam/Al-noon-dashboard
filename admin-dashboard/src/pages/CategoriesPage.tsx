import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Category } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { useLocalized } from "../utils/localized";

type CategoryForm = { nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string; status: "visible" | "hidden" };

const emptyForm: CategoryForm = { nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", status: "visible" };

const CategoriesPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = (await api.listCategories()) as { data?: { categories: Category[] }; categories?: Category[] };
      setCategories(res.data?.categories ?? res.categories ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.failed_load"));
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    const name = typeof c.name === "object" && c.name
      ? { en: c.name.en ?? "", ar: c.name.ar ?? "" }
      : { en: String(c.name ?? ""), ar: String(c.name ?? "") };
    const desc = c.description && typeof c.description === "object"
      ? { en: c.description.en ?? "", ar: c.description.ar ?? "" }
      : { en: String(c.description ?? ""), ar: String(c.description ?? "") };
    setForm({
      nameEn: name.en,
      nameAr: name.ar,
      descriptionEn: desc.en,
      descriptionAr: desc.ar,
      status: c.status ?? "visible"
    });
    setEditingId(c._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { nameEn: form.nameEn.trim(), nameAr: form.nameAr.trim(), descriptionEn: form.descriptionEn.trim() || undefined, descriptionAr: form.descriptionAr.trim() || undefined, status: form.status };
      if (editingId) {
        await api.updateCategory(editingId, payload);
      } else {
        await api.createCategory(payload);
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
                <td>{localized(c.name)}</td>
                <td>
                  <span className={`badge ${c.status === "visible" ? "badge-success" : "badge-muted"}`}>
                    {c.status === "visible" ? t("categories.visible") : t("categories.hidden")}
                  </span>
                </td>
                <td>
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      { label: t("common.edit"), onClick: () => openEdit(c) },
                      { label: c.status === "visible" ? t("categories.hide") : t("categories.show"), onClick: () => setStatus(c._id, c.status === "visible" ? "hidden" : "visible") },
                      { label: t("common.delete"), onClick: () => remove(c._id), danger: true }
                    ]}
                  />
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
                placeholder={t("categories.name_en")}
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                required
              />
              <input
                placeholder={t("categories.name_ar")}
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                required
              />
              <input
                placeholder={t("categories.description_en")}
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              />
              <input
                placeholder={t("categories.description_ar")}
                value={form.descriptionAr}
                onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
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
