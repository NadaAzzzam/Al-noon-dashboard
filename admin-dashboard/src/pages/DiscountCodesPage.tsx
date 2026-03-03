import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, DiscountCode, hasPermission } from "../services/api";
import { confirmRemove } from "../utils/confirmToast";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { formatPriceEGP } from "../utils/format";

type DiscountCodeForm = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: string;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
  enabled: boolean;
};

const emptyForm: DiscountCodeForm = {
  code: "",
  type: "PERCENT",
  value: 0,
  minOrderAmount: "",
  validFrom: "",
  validUntil: "",
  usageLimit: "",
  enabled: true,
};

const DiscountCodesPage = () => {
  const { t } = useTranslation();
  const canManage = hasPermission("settings.manage");
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [form, setForm] = useState<DiscountCodeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = (await api.listDiscountCodes()) as { data?: { discountCodes: DiscountCode[] }; discountCodes?: DiscountCode[] };
      setCodes(res.data?.discountCodes ?? res.discountCodes ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("discount_codes.failed_load"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (d: DiscountCode) => {
    setForm({
      code: d.code ?? "",
      type: d.type ?? "PERCENT",
      value: d.value ?? 0,
      minOrderAmount: d.minOrderAmount != null ? String(d.minOrderAmount) : "",
      validFrom: d.validFrom ? (d.validFrom as string).slice(0, 16) : "",
      validUntil: d.validUntil ? (d.validUntil as string).slice(0, 16) : "",
      usageLimit: d.usageLimit != null ? String(d.usageLimit) : "",
      enabled: d.enabled !== false,
    });
    setEditingId(d._id);
    setFieldErrors({});
    setModalOpen(true);
  };

  const validate = (): Record<string, string> => {
    const err: Record<string, string> = {};
    if (!form.code.trim()) err.code = t("validation.required");
    if (form.type === "PERCENT" && (form.value < 0 || form.value > 100)) err.value = "Percent must be 0–100";
    if (form.type === "FIXED" && form.value < 0) err.value = t("validation.required");
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.value,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        usageLimit: form.usageLimit ? Math.max(0, parseInt(form.usageLimit, 10) || 0) : null,
        enabled: form.enabled,
      };
      if (editingId) {
        await api.updateDiscountCode(editingId, payload);
      } else {
        await api.createDiscountCode(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("discount_codes.failed_save"));
    }
  };

  const remove = async (id: string) => {
    if (!(await confirmRemove(t("common.confirm_remove")))) return;
    setError(null);
    try {
      await api.deleteDiscountCode(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("discount_codes.failed_delete"));
    }
  };

  const formatValue = (d: DiscountCode) => {
    if (d.type === "PERCENT") return `${d.value}%`;
    return formatPriceEGP(d.value);
  };

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "—";
    try {
      return new Date(s).toLocaleDateString(undefined, { dateStyle: "short" });
    } catch {
      return "—";
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("discount_codes.title")}</h1>
          <p>{t("discount_codes.subtitle")}</p>
        </div>
        {canManage && <button className="button" onClick={openAdd}>{t("discount_codes.add")}</button>}
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("discount_codes.code")}</th>
              <th>{t("discount_codes.type")}</th>
              <th>{t("discount_codes.value")}</th>
              <th>{t("discount_codes.min_order")}</th>
              <th>{t("discount_codes.valid_from")}</th>
              <th>{t("discount_codes.valid_until")}</th>
              <th>{t("discount_codes.used")}</th>
              <th>{t("discount_codes.status")}</th>
              {canManage && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 && (
              <tr>
                <td colSpan={canManage ? 9 : 8}>{t("discount_codes.no_codes")}</td>
              </tr>
            )}
            {codes.map((d) => (
              <tr key={d._id}>
                <td><strong>{d.code}</strong></td>
                <td>{d.type}</td>
                <td>{formatValue(d)}</td>
                <td>{d.minOrderAmount != null ? formatPriceEGP(d.minOrderAmount) : "—"}</td>
                <td>{formatDate(d.validFrom)}</td>
                <td>{formatDate(d.validUntil)}</td>
                <td>{d.usedCount ?? 0}{d.usageLimit != null ? ` / ${d.usageLimit}` : ""}</td>
                <td>{d.enabled ? t("common.active") : t("common.inactive")}</td>
                {canManage && (
                  <td>
                    <TableActionsDropdown
                      ariaLabel={t("common.actions")}
                      actions={[
                        { label: t("common.edit"), onClick: () => openEdit(d) },
                        { label: t("common.delete"), onClick: () => remove(d._id), danger: true }
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>{editingId ? t("discount_codes.edit") : t("discount_codes.new")}</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label>{t("discount_codes.code")}</label>
                <input
                  value={form.code}
                  onChange={(e) => { setForm({ ...form, code: e.target.value.toUpperCase() }); setFieldErrors((er) => ({ ...er, code: "" })); }}
                  placeholder="SAVE10"
                  className={fieldErrors.code ? "field-invalid" : ""}
                  disabled={!!editingId}
                />
                {fieldErrors.code && <span className="field-error" role="alert">{fieldErrors.code}</span>}
              </div>
              <div className="form-group">
                <label>{t("discount_codes.type")}</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENT" | "FIXED" })}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">{t("discount_codes.fixed_egp")}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{form.type === "PERCENT" ? t("discount_codes.percent_value") : t("discount_codes.fixed_value")}</label>
                <input
                  type="number"
                  min={0}
                  max={form.type === "PERCENT" ? 100 : undefined}
                  step={form.type === "PERCENT" ? 1 : 0.01}
                  value={form.value}
                  onChange={(e) => { setForm({ ...form, value: Math.max(0, Number(e.target.value) || 0) }); setFieldErrors((er) => ({ ...er, value: "" })); }}
                  className={fieldErrors.value ? "field-invalid" : ""}
                />
                {fieldErrors.value && <span className="field-error" role="alert">{fieldErrors.value}</span>}
              </div>
              <div className="form-group">
                <label>{t("discount_codes.min_order")} (EGP)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder={t("discount_codes.optional")}
                />
              </div>
              <div className="form-group">
                <label>{t("discount_codes.valid_from")}</label>
                <input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t("discount_codes.valid_until")}</label>
                <input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t("discount_codes.usage_limit")}</label>
                <input
                  type="number"
                  min={0}
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder={t("discount_codes.unlimited")}
                />
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="discount-enabled"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />
                <label htmlFor="discount-enabled" style={{ margin: 0 }}>{t("discount_codes.enabled")}</label>
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

export default DiscountCodesPage;
