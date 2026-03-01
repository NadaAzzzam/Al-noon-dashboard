import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, City, hasPermission } from "../services/api";
import { validateCity } from "../utils/formValidation";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { useLocalized } from "../utils/localized";

type CityForm = { nameEn: string; nameAr: string; deliveryFee: number };

const CitiesPage = () => {
  const { t } = useTranslation();
  const canManage = hasPermission("cities.manage");
  const localized = useLocalized();
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState<CityForm>({ nameEn: "", nameAr: "", deliveryFee: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = (await api.listCities()) as { data?: { cities: City[] }; cities?: City[] };
      setCities(res.data?.cities ?? res.cities ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("cities.failed_load"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm({ nameEn: "", nameAr: "", deliveryFee: 0 });
    setEditingId(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: City) => {
    const name = typeof c.name === "object" ? c.name : { en: c.name as unknown as string, ar: c.name as unknown as string };
    setForm({ nameEn: name.en ?? "", nameAr: name.ar ?? "", deliveryFee: c.deliveryFee ?? 0 });
    setEditingId(c._id);
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const validation = validateCity(form.nameEn, form.nameAr, form.deliveryFee);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }
    try {
      const payload = { nameEn: form.nameEn.trim(), nameAr: form.nameAr.trim(), deliveryFee: form.deliveryFee };
      if (editingId) {
        await api.updateCity(editingId, payload);
      } else {
        await api.createCity(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("cities.failed_save"));
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("cities.delete_confirm"))) return;
    setError(null);
    try {
      await api.deleteCity(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("cities.failed_delete"));
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("cities.title")}</h1>
          <p>{t("cities.subtitle")}</p>
        </div>
        {canManage && <button className="button" onClick={openAdd}>{t("cities.add_city")}</button>}
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("cities.name")}</th>
              <th>{t("cities.delivery_fee")}</th>
              {canManage && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {cities.length === 0 && (
              <tr>
                <td colSpan={canManage ? 3 : 2}>{t("cities.no_cities")}</td>
              </tr>
            )}
            {cities.map((c) => (
              <tr key={c._id}>
                <td>{localized(c.name)}</td>
                <td>{Number(c.deliveryFee ?? 0).toFixed(2)} EGP</td>
                {canManage && (
                <td>
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      { label: t("common.edit"), onClick: () => openEdit(c) },
                      { label: t("common.delete"), onClick: () => remove(c._id), danger: true }
                    ]}
                  />
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? t("cities.edit_city") : t("cities.new_city")}</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <input
                  placeholder={t("cities.name_en")}
                  value={form.nameEn}
                  onChange={(e) => { setForm({ ...form, nameEn: e.target.value }); setFieldErrors((er) => ({ ...er, nameEn: "" })); }}
                  className={fieldErrors.nameEn ? "field-invalid" : ""}
                  aria-invalid={!!fieldErrors.nameEn}
                />
                {fieldErrors.nameEn && <span className="field-error" role="alert">{fieldErrors.nameEn}</span>}
              </div>
              <div className="form-group">
                <input
                  placeholder={t("cities.name_ar")}
                  value={form.nameAr}
                  onChange={(e) => { setForm({ ...form, nameAr: e.target.value }); setFieldErrors((er) => ({ ...er, nameAr: "" })); }}
                  className={fieldErrors.nameAr ? "field-invalid" : ""}
                  aria-invalid={!!fieldErrors.nameAr}
                />
                {fieldErrors.nameAr && <span className="field-error" role="alert">{fieldErrors.nameAr}</span>}
              </div>
              <div className="form-group">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder={t("cities.delivery_fee")}
                  value={form.deliveryFee}
                  onChange={(e) => { setForm({ ...form, deliveryFee: Math.max(0, Number(e.target.value) || 0) }); setFieldErrors((er) => ({ ...er, deliveryFee: "" })); }}
                  className={fieldErrors.deliveryFee ? "field-invalid" : ""}
                  aria-invalid={!!fieldErrors.deliveryFee}
                />
                {fieldErrors.deliveryFee && <span className="field-error" role="alert">{fieldErrors.deliveryFee}</span>}
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <button className="button" type="submit">
                  {editingId ? t("common.update") : t("common.create")}
                </button>
                <button className="button secondary" type="button" onClick={() => setModalOpen(false)}>
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitiesPage;
