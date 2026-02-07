import { useRef } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Settings, getUploadsBaseUrl } from "../services/api";

type SettingsForm = {
  storeNameEn: string;
  storeNameAr: string;
  logo: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  lowStockThreshold: number;
};

const SettingsPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<SettingsForm>({
    storeNameEn: "",
    storeNameAr: "",
    logo: "",
    instaPayNumber: "",
    paymentMethods: { cod: true, instaPay: true },
    lowStockThreshold: 5
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSettings()
      .then((res: unknown) => {
        const d = (res as { settings: Settings }).settings;
        const sn = d.storeName;
        const storeNameEn = typeof sn === "object" ? (sn?.en ?? "") : (sn ?? "");
        const storeNameAr = typeof sn === "object" ? (sn?.ar ?? "") : (sn ?? "");
        setForm({
          storeNameEn,
          storeNameAr,
          logo: d.logo ?? "",
          instaPayNumber: d.instaPayNumber ?? "",
          paymentMethods: d.paymentMethods ?? { cod: true, instaPay: true },
          lowStockThreshold: d.lowStockThreshold ?? 5
        });
      })
      .catch(() => setError(t("settings.failed_load")));
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("settings.logo_invalid_type"));
      return;
    }
    setError(null);
    setLogoUploading(true);
    try {
      const logoPath = await api.uploadLogo(file);
      setForm((f) => ({ ...f, logo: logoPath }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.logo_upload_failed"));
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const removeLogo = () => {
    setForm((f) => ({ ...f, logo: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings({
        storeNameEn: form.storeNameEn.trim(),
        storeNameAr: form.storeNameAr.trim(),
        logo: form.logo,
        instaPayNumber: form.instaPayNumber,
        paymentMethods: form.paymentMethods,
        lowStockThreshold: form.lowStockThreshold
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.failed_save"));
    }
  };

  const logoFullUrl = form.logo ? getUploadsBaseUrl() + form.logo : null;

  return (
    <div className="settings-page">
      {error && <div className="error settings-message" role="alert">{error}</div>}
      {saved && <div className="badge badge-success settings-message" role="status">{t("common.saved")}</div>}
      <div className="header">
        <div>
          <h1>{t("settings.title")}</h1>
          <p className="header-subtitle">{t("settings.subtitle")}</p>
        </div>
      </div>
      <div className="card settings-card">
        <form onSubmit={handleSubmit} className="settings-form">
          <section className="settings-section">
            <h3 className="settings-section-title">{t("settings.section_store")}</h3>
            <div className="settings-fields">
              <div className="form-group">
                <label htmlFor="settings-store-name-en">{t("settings.store_name_en")}</label>
                <input
                  id="settings-store-name-en"
                  value={form.storeNameEn}
                  onChange={(e) => setForm({ ...form, storeNameEn: e.target.value })}
                  placeholder={t("settings.store_name_en")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="settings-store-name-ar">{t("settings.store_name_ar")}</label>
                <input
                  id="settings-store-name-ar"
                  value={form.storeNameAr}
                  onChange={(e) => setForm({ ...form, storeNameAr: e.target.value })}
                  placeholder={t("settings.store_name_ar")}
                />
              </div>
              <div className="form-group">
                <label>{t("settings.logo")}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                  style={{ display: "block", marginBottom: 8 }}
                />
                {logoUploading && <span className="badge">{t("common.loading")}</span>}
                {logoFullUrl && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={logoFullUrl} alt="Logo" style={{ maxHeight: 48, maxWidth: 120, objectFit: "contain" }} />
                    <button type="button" className="button secondary" onClick={removeLogo}>{t("settings.remove_logo")}</button>
                  </div>
                )}
                {!form.logo && !logoUploading && <p className="settings-hint" style={{ marginTop: 4 }}>{t("settings.logo_hint")}</p>}
              </div>
            </div>
          </section>
          <section className="settings-section">
            <h3 className="settings-section-title">{t("settings.section_delivery_payment")}</h3>
            <div className="settings-fields">
              <div className="form-group">
                <label htmlFor="settings-instapay">{t("settings.instapay_number")}</label>
                <input
                  id="settings-instapay"
                  value={form.instaPayNumber}
                  onChange={(e) => setForm({ ...form, instaPayNumber: e.target.value })}
                  placeholder={t("settings.instapay_placeholder")}
                />
              </div>
            </div>
            <p className="settings-hint">{t("settings.cities_manage_hint")}</p>
          </section>
          <section className="settings-section">
            <h3 className="settings-section-title">{t("settings.section_payment_methods")}</h3>
            <div className="settings-fields settings-fields-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.paymentMethods.cod}
                  onChange={(e) => setForm({ ...form, paymentMethods: { ...form.paymentMethods, cod: e.target.checked } })}
                />
                <span>{t("settings.cod")}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.paymentMethods.instaPay}
                  onChange={(e) => setForm({ ...form, paymentMethods: { ...form.paymentMethods, instaPay: e.target.checked } })}
                />
                <span>{t("settings.instapay")}</span>
              </label>
            </div>
          </section>
          <section className="settings-section">
            <h3 className="settings-section-title">{t("settings.section_inventory")}</h3>
            <div className="settings-fields">
              <div className="form-group form-group-narrow">
                <label htmlFor="settings-threshold">{t("settings.low_stock_threshold")}</label>
                <input
                  id="settings-threshold"
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
            </div>
          </section>
          <div className="settings-actions">
            <button className="button" type="submit">{t("settings.save_settings")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
