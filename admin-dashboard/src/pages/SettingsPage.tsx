import { useEffect, useState } from "react";
import { api, ApiError, clearAuth, Settings } from "../services/api";

const SettingsPage = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await api.getSettings();
        setSettings(res.settings ?? {});
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load settings");
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings(settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      {saved && <div style={{ marginBottom: 16, color: "green" }}>Settings saved.</div>}
      <div className="header">
        <h1>Settings</h1>
        <p>Store info, delivery fee, payment methods, and stock threshold.</p>
      </div>
      <div className="card">
        <form className="form-grid" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
          <label>Store name</label>
          <input
            value={settings.storeName ?? ""}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            placeholder="Store name"
          />
          <label>Logo URL</label>
          <input
            value={settings.logo ?? ""}
            onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
            placeholder="https://..."
          />
          <label>Delivery fee</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={settings.deliveryFee ?? 0}
            onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
          />
          <label>InstaPay number</label>
          <input
            value={settings.instaPayNumber ?? ""}
            onChange={(e) => setSettings({ ...settings, instaPayNumber: e.target.value })}
            placeholder="Phone or account"
          />
          <label>Low stock threshold</label>
          <input
            type="number"
            min={0}
            value={settings.lowStockThreshold ?? 5}
            onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
          />
          <div style={{ gridColumn: "1 / -1" }}>
            <label>
              <input
                type="checkbox"
                checked={settings.paymentMethods?.cod ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  paymentMethods: { ...settings.paymentMethods, cod: e.target.checked, instaPay: settings.paymentMethods?.instaPay ?? true }
                })}
              />
              {" "}Cash on Delivery
            </label>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>
              <input
                type="checkbox"
                checked={settings.paymentMethods?.instaPay ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  paymentMethods: { cod: settings.paymentMethods?.cod ?? true, instaPay: e.target.checked, ...settings.paymentMethods }
                })}
              />
              {" "}InstaPay
            </label>
          </div>
          <button className="button" type="submit">Save settings</button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
