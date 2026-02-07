import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getStoredLanguage, setStoredLanguage, type Lang } from "../i18n";
import { api, clearToken } from "../services/api";

const Layout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [notifications, setNotifications] = useState<{ lowStock: number; newOrders?: number }>({ lowStock: 0 });
  const currentLang = getStoredLanguage();

  useEffect(() => {
    api.getProfile().then((data: unknown) => {
      const d = data as { user?: { name: string; email: string } };
      if (d.user) setUser(d.user);
    }).catch(() => {});
    api.getDashboardStats(1).then((data: unknown) => {
      const d = data as { lowStockCount?: number; ordersToday?: number };
      setNotifications({ lowStock: d.lowStockCount ?? 0, newOrders: d.ordersToday });
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    api.signOut().catch(() => {}).finally(() => {
      clearToken();
      navigate("/login");
    });
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>{t("nav.app_name")}</h2>
        <nav>
          <NavLink className="nav-link" to="/">
            {t("nav.overview")}
          </NavLink>
          <NavLink className="nav-link" to="/products">
            {t("nav.products")}
          </NavLink>
          <NavLink className="nav-link" to="/categories">
            {t("nav.categories")}
          </NavLink>
          <NavLink className="nav-link" to="/cities">
            {t("nav.cities")}
          </NavLink>
          <NavLink className="nav-link" to="/inventory">
            {t("nav.inventory")}
          </NavLink>
          <NavLink className="nav-link" to="/orders">
            {t("nav.orders")}
          </NavLink>
          <NavLink className="nav-link" to="/customers">
            {t("nav.customers")}
          </NavLink>
          <NavLink className="nav-link" to="/users">
            {t("nav.users")}
          </NavLink>
          <NavLink className="nav-link" to="/settings">
            {t("nav.settings")}
          </NavLink>
        </nav>
        <button className="button secondary" onClick={handleLogout} style={{ marginTop: 24 }}>
          {t("nav.logout")}
        </button>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-notifications">
            {notifications.lowStock > 0 && (
              <NavLink to="/inventory" className="notif-badge low">
                {t("nav.low_stock")}: {notifications.lowStock}
              </NavLink>
            )}
            {notifications.newOrders != null && notifications.newOrders > 0 && (
              <NavLink to="/orders" className="notif-badge new">
                {t("nav.new_today")}: {notifications.newOrders}
              </NavLink>
            )}
          </div>
          <div className="lang-switcher">
            {(["en", "ar"] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                className={currentLang === lng ? "lang-btn active" : "lang-btn"}
                onClick={() => setStoredLanguage(lng as Lang)}
                aria-label={lng === "en" ? "English" : "العربية"}
              >
                {lng === "en" ? "EN" : "AR"}
              </button>
            ))}
          </div>
          {user && (
            <div className="topbar-user">
              <span>{user.name}</span>
              <span className="topbar-email">{user.email}</span>
            </div>
          )}
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
