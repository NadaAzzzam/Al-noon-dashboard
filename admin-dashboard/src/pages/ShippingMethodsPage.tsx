import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  api,
  ApiError,
  City,
  ShippingMethod,
  ShippingMethodPayload,
} from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { useLocalized } from "../utils/localized";

type CityPriceRow = { cityId: string; price: number };

type FormState = {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  price: number;
  cityPrices: CityPriceRow[];
  enabled: boolean;
  order: number;
};

const emptyForm: FormState = {
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  estimatedDaysMin: 1,
  estimatedDaysMax: 3,
  price: 0,
  cityPrices: [],
  enabled: true,
  order: 0,
};

const ShippingMethodsPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const [list, setList] = useState<ShippingMethod[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCities = async () => {
    try {
      const res = (await api.listCities()) as {
        data?: { cities?: City[] };
        cities?: City[];
      };
      const arr = res.data?.cities ?? res.cities ?? [];
      setCities(arr);
    } catch {
      setCities([]);
    }
  };

  const load = async () => {
    setError(null);
    try {
      const res = (await api.listShippingMethods(true)) as {
        shippingMethods?: ShippingMethod[];
        data?: { shippingMethods?: ShippingMethod[] };
      };
      const methods = res.shippingMethods ?? res.data?.shippingMethods ?? [];
      setList(methods);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("shipping_methods.failed_load"),
      );
    }
  };

  useEffect(() => {
    load();
    loadCities();
  }, []);

  const openAdd = () => {
    setForm({
      ...emptyForm,
      cityPrices: cities.map((c) => ({ cityId: c._id, price: 0 })),
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (m: ShippingMethod) => {
    const baseCityPrices = cities.map((c) => {
      const entry = m.cityPrices?.find(
        (cp) => String((cp.city as { _id?: string })?._id ?? cp.city) === c._id,
      );
      return { cityId: c._id, price: entry?.price ?? 0 };
    });
    setForm({
      nameEn: m.name?.en ?? "",
      nameAr: m.name?.ar ?? "",
      descriptionEn: m.description?.en ?? "",
      descriptionAr: m.description?.ar ?? "",
      estimatedDaysMin: m.estimatedDays?.min ?? 1,
      estimatedDaysMax: m.estimatedDays?.max ?? 3,
      price: m.price ?? 0,
      cityPrices: baseCityPrices.length
        ? baseCityPrices
        : cities.map((c) => ({ cityId: c._id, price: 0 })),
      enabled: m.enabled ?? true,
      order: m.order ?? 0,
    });
    setEditingId(m._id);
    setModalOpen(true);
  };

  const setCityPrice = (cityId: string, value: number) => {
    const v = Math.max(0, value);
    setForm((prev) => {
      const has = prev.cityPrices.some((cp) => cp.cityId === cityId);
      return {
        ...prev,
        cityPrices: has
          ? prev.cityPrices.map((cp) =>
              cp.cityId === cityId ? { ...cp, price: v } : cp,
            )
          : [...prev.cityPrices, { cityId, price: v }],
      };
    });
  };

  const toPayload = (): ShippingMethodPayload => ({
    name: { en: form.nameEn.trim(), ar: form.nameAr.trim() },
    description: {
      en: form.descriptionEn.trim(),
      ar: form.descriptionAr.trim(),
    },
    estimatedDays: { min: form.estimatedDaysMin, max: form.estimatedDaysMax },
    price: form.price,
    cityPrices: form.cityPrices.map((cp) => ({
      city: cp.cityId,
      price: cp.price,
    })),
    enabled: form.enabled,
    order: form.order,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = toPayload();
      if (editingId) {
        await api.updateShippingMethod(editingId, payload);
      } else {
        await api.createShippingMethod(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("shipping_methods.failed_save"),
      );
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("shipping_methods.delete_confirm"))) return;
    setError(null);
    try {
      await api.deleteShippingMethod(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("shipping_methods.failed_delete"),
      );
    }
  };

  const toggle = async (id: string) => {
    setError(null);
    try {
      await api.toggleShippingMethod(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("shipping_methods.failed_toggle"),
      );
    }
  };

  return (
    <div>
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className="header">
        <div>
          <h1>{t("shipping_methods.title")}</h1>
          <p>{t("shipping_methods.subtitle")}</p>
        </div>
        <button className="button" onClick={openAdd}>
          {t("shipping_methods.add_method")}
        </button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("shipping_methods.name")}</th>
              <th>{t("shipping_methods.estimated_days")}</th>
              <th>{t("shipping_methods.price")}</th>
              <th>{t("shipping_methods.enabled")}</th>
              <th>{t("shipping_methods.order")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6}>{t("shipping_methods.no_methods")}</td>
              </tr>
            )}
            {list.map((m) => (
              <tr key={m._id}>
                <td>
                  <strong>{localized(m.name)}</strong>
                  {m.description && (
                    <div
                      style={{
                        fontSize: "0.85em",
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {localized(m.description)}
                    </div>
                  )}
                </td>
                <td>
                  {m.estimatedDays?.min ?? 0}–{m.estimatedDays?.max ?? 0}{" "}
                  {t("shipping_methods.days")}
                </td>
                <td>
                  {Number(m.price ?? 0).toFixed(0)} EGP
                  {(m.cityPrices?.length ?? 0) > 0 && (
                    <span
                      style={{
                        fontSize: "0.85em",
                        color: "var(--text-muted)",
                        display: "block",
                      }}
                    >
                      ({m.cityPrices!.length} {t("shipping_methods.city")})
                    </span>
                  )}
                </td>
                <td>{m.enabled ? t("common.active") : t("common.inactive")}</td>
                <td>{m.order ?? 0}</td>
                <td>
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      { label: t("common.edit"), onClick: () => openEdit(m) },
                      {
                        label: m.enabled
                          ? t("shipping_methods.disable")
                          : t("shipping_methods.enable"),
                        onClick: () => toggle(m._id),
                      },
                      {
                        label: t("common.delete"),
                        onClick: () => remove(m._id),
                        danger: true,
                      },
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
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <h3>
              {editingId
                ? t("shipping_methods.edit_method")
                : t("shipping_methods.new_method")}
            </h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <p
                className="form-section-label"
                style={{
                  gridColumn: "1 / -1",
                  margin: "0 0 8px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                {t("shipping_methods.section_basic")}
              </p>
              <label className="form-label">
                <span>{t("shipping_methods.name_en")}</span>
                <input
                  placeholder={t("shipping_methods.name_en")}
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  required
                />
              </label>
              <label className="form-label">
                <span>{t("shipping_methods.name_ar")}</span>
                <input
                  placeholder={t("shipping_methods.name_ar")}
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  required
                />
              </label>
              <label className="form-label" style={{ gridColumn: "1 / -1" }}>
                <span>{t("shipping_methods.description_en")}</span>
                <textarea
                  placeholder={t("shipping_methods.description_en")}
                  value={form.descriptionEn}
                  onChange={(e) =>
                    setForm({ ...form, descriptionEn: e.target.value })
                  }
                  required
                  rows={2}
                />
              </label>
              <label className="form-label" style={{ gridColumn: "1 / -1" }}>
                <span>{t("shipping_methods.description_ar")}</span>
                <textarea
                  placeholder={t("shipping_methods.description_ar")}
                  value={form.descriptionAr}
                  onChange={(e) =>
                    setForm({ ...form, descriptionAr: e.target.value })
                  }
                  required
                  rows={2}
                />
              </label>

              <p
                className="form-section-label"
                style={{
                  gridColumn: "1 / -1",
                  margin: "12px 0 8px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                {t("shipping_methods.section_delivery_time")}
              </p>
              <label className="form-label">
                <span>{t("shipping_methods.estimated_days_min")}</span>
                <input
                  type="number"
                  min={1}
                  value={form.estimatedDaysMin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimatedDaysMin: Math.max(
                        1,
                        Number(e.target.value) || 1,
                      ),
                    })
                  }
                />
              </label>
              <label className="form-label">
                <span>{t("shipping_methods.estimated_days_max")}</span>
                <input
                  type="number"
                  min={1}
                  value={form.estimatedDaysMax}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimatedDaysMax: Math.max(
                        1,
                        Number(e.target.value) || 1,
                      ),
                    })
                  }
                />
              </label>

              <p
                className="form-section-label"
                style={{
                  gridColumn: "1 / -1",
                  margin: "12px 0 8px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                {t("shipping_methods.section_default_price")}
              </p>
              <label className="form-label">
                <span>{t("shipping_methods.price")}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
              <label className="form-label">
                <span>{t("shipping_methods.order_label")}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.order}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      order: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
              <p
                className="settings-hint"
                style={{
                  gridColumn: "1 / -1",
                  margin: "-4px 0 0",
                  fontSize: "0.85rem",
                }}
              >
                {t("shipping_methods.default_price_hint")}{" "}
                {t("shipping_methods.order_hint")}
              </p>
              <label
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm({ ...form, enabled: e.target.checked })
                  }
                />
                {t("shipping_methods.enabled")}
              </label>

              {cities.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p
                    className="form-section-label"
                    style={{
                      margin: "16px 0 6px",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    {t("shipping_methods.section_city_prices")}
                  </p>
                  <p
                    className="settings-hint"
                    style={{ marginBottom: 8, fontSize: "0.85rem" }}
                  >
                    {t("shipping_methods.city_prices_hint")}
                  </p>
                  <div
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                    }}
                  >
                    <table className="table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>{t("shipping_methods.city")}</th>
                          <th>{t("shipping_methods.price")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cities.map((city) => {
                          const row = form.cityPrices.find(
                            (cp) => cp.cityId === city._id,
                          );
                          const price = row?.price ?? 0;
                          return (
                            <tr key={city._id}>
                              <td>{localized(city.name)}</td>
                              <td>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={price}
                                  onChange={(e) =>
                                    setCityPrice(
                                      city._id,
                                      Number(e.target.value) || 0,
                                    )
                                  }
                                  style={{ width: 80 }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <button className="button" type="submit">
                  {editingId ? t("common.update") : t("common.create")}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
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

export default ShippingMethodsPage;
