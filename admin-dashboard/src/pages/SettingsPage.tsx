import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Settings } from "../services/api";

const SettingsPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<Settings>({
    storeName: "",
    logo: "",
    instaPayNumber: "",
    paymentMethods: { cod: true, instaPay: true },
    lowStockThreshold: 5
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((res: unknown) => {
        const d = (res as { settings: Settings }).settings;
        setForm({
          storeName: d.storeName ?? "",
          logo: d.logo ?? "",
          instaPayNumber: d.instaPayNumber ?? "",
          paymentMethods: d.paymentMethods ?? { cod: true, instaPay: true },
          lowStockThreshold: d.lowStockThreshold ?? 5
        });
      })
      .catch(() => setError(t("settings.failed_load")));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings(form);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.failed_save"));
    }
  };

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
                <label htmlFor="settings-store-name">{t("settings.store_name")}</label>
                <input
                  id="settings-store-name"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  placeholder={t("settings.store_name")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="settings-logo">{t("settings.logo_url")}</label>
                <input
                  id="settings-logo"
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  placeholder="https://..."
                />
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
