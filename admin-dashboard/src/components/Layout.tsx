import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getStoredLanguage, setStoredLanguage, type Lang } from "../i18n";
import { api, clearToken, getUploadsBaseUrl, DEFAULT_LOGO_PATH } from "../services/api";
import { initGoogleAnalytics, sendPageView } from "../utils/googleAnalytics";

/* ===== SVG Icon components ===== */
const IconDashboard = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconReports = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconProducts = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconCategories = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const IconCities = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconShipping = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconInventory = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconOrders = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const IconCustomers = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconUsers = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSubscribers = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconContact = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconFeedback = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconSettings = () => (
  <svg
    className="nav-link-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconLogout = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconStore = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// Map pathname to breadcrumb label key
const getBreadcrumb = (pathname: string): string => {
  const map: Record<string, string> = {
    "/": "nav.overview",
    "/products": "nav.products",
    "/categories": "nav.categories",
    "/cities": "nav.cities",
    "/shipping-methods": "nav.shipping_methods",
    "/inventory": "nav.inventory",
    "/orders": "nav.orders",
    "/customers": "nav.customers",
    "/users": "nav.users",
    "/subscribers": "nav.subscribers",
    "/contact": "nav.contact",
    "/feedback": "nav.feedback",
    "/settings": "nav.settings",
    "/reports": "nav.reports",
    "/settings/home": "settings.tab_home_page",
    "/settings/content-pages": "settings.tab_content_pages",
    "/settings/ai": "settings.tab_ai_assistant",
    "/ai-chats": "nav.ai_chats",
  };
  if (map[pathname]) return map[pathname];
  if (pathname.startsWith("/products/") && pathname.includes("/edit"))
    return "products.edit_product";
  if (pathname.startsWith("/products/new")) return "products.new_product";
  if (pathname.startsWith("/orders/")) return "order_detail.order_id";
  if (pathname.startsWith("/customers/")) return "customer_detail.customer";
  return "nav.overview";
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [notifications, setNotifications] = useState<{
    lowStock: number;
    newOrders?: number;
  }>({ lowStock: 0 });
  const currentLang = getStoredLanguage();

  useEffect(() => {
    api
      .getProfile()
      .then((res: unknown) => {
        const d = res as {
          data?: { user?: { name: string; email: string } };
          user?: { name: string; email: string };
        };
        const user = d.data?.user ?? d.user;
        if (user) setUser(user);
      })
      .catch(() => {});
    api
      .getDashboardStats(1)
      .then((res: unknown) => {
        const d = res as {
          data?: { lowStockCount?: number; ordersToday?: number };
        };
        const stats =
          d.data ?? (res as { lowStockCount?: number; ordersToday?: number });
        setNotifications({
          lowStock: stats.lowStockCount ?? 0,
          newOrders: stats.ordersToday,
        });
      })
      .catch(() => {});
    api
      .getSettings()
      .then((res: unknown) => {
        const d = res as {
          data?: { settings?: { googleAnalyticsId?: string; logo?: string } };
          settings?: { googleAnalyticsId?: string; logo?: string };
        };
        const settings = d.data?.settings ?? d.settings;
        const gaId =
          settings?.googleAnalyticsId?.trim() ||
          import.meta.env.VITE_GA_MEASUREMENT_ID;
        if (gaId) initGoogleAnalytics(gaId);
        const logoPath = settings?.logo?.trim();
        const faviconHref = getUploadsBaseUrl() + (logoPath || DEFAULT_LOGO_PATH);
        const link = document.getElementById("dashboard-favicon") as HTMLLinkElement | null;
        if (link) link.href = faviconHref;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    sendPageView(location.pathname, document.title);
  }, [location.pathname]);

  const handleLogout = () => {
    api
      .signOut()
      .catch(() => {})
      .finally(() => {
        clearToken();
        navigate("/login");
      });
  };

  const breadcrumbKey = getBreadcrumb(location.pathname);
  const orderIdFromPath = location.pathname.startsWith("/orders/")
    ? (location.pathname
        .replace(/^\/orders\//, "")
        .split("/")[0]
        ?.slice(-8) ?? "")
    : "";
  const breadcrumbOptions =
    breadcrumbKey === "order_detail.order_id" && orderIdFromPath
      ? { id: orderIdFromPath }
      : undefined;
  const userInitials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>
            <span className="sidebar-brand-icon">
              <IconStore />
            </span>
            {t("nav.app_name")}
          </h2>
        </div>
        <nav>
          <p className="nav-group-label">{t("nav.overview")}</p>
          <NavLink className="nav-link" to="/" end>
            <IconDashboard /> {t("nav.overview")}
          </NavLink>
          <NavLink className="nav-link" to="/reports">
            <IconReports /> {t("nav.reports")}
          </NavLink>

          <p className="nav-group-label">{t("nav.store_group", "Store")}</p>
          <NavLink className="nav-link" to="/products">
            <IconProducts /> {t("nav.products")}
          </NavLink>
          <NavLink className="nav-link" to="/categories">
            <IconCategories /> {t("nav.categories")}
          </NavLink>
          <NavLink className="nav-link" to="/inventory">
            <IconInventory /> {t("nav.inventory")}
          </NavLink>
          <NavLink className="nav-link" to="/orders">
            <IconOrders /> {t("nav.orders")}
          </NavLink>

          <p className="nav-group-label">{t("nav.people_group", "People")}</p>
          <NavLink className="nav-link" to="/customers">
            <IconCustomers /> {t("nav.customers")}
          </NavLink>
          <NavLink className="nav-link" to="/users">
            <IconUsers /> {t("nav.users")}
          </NavLink>
          <NavLink className="nav-link" to="/subscribers">
            <IconSubscribers /> {t("nav.subscribers")}
          </NavLink>

          <p className="nav-group-label">{t("nav.content_group", "Content")}</p>
          <NavLink className="nav-link" to="/contact">
            <IconContact /> {t("nav.contact")}
          </NavLink>
          <NavLink className="nav-link" to="/feedback">
            <IconFeedback /> {t("nav.feedback")}
          </NavLink>
          <NavLink className="nav-link" to="/ai-chats">
            <IconContact /> {t("nav.ai_chats")}
          </NavLink>
          <NavLink className="nav-link" to="/cities">
            <IconCities /> {t("nav.cities")}
          </NavLink>
          <NavLink className="nav-link" to="/shipping-methods">
            <IconShipping /> {t("nav.shipping_methods")}
          </NavLink>
          <NavLink className="nav-link" to="/settings">
            <IconSettings /> {t("nav.settings")}
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="button" onClick={handleLogout}>
            <IconLogout /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            {user && (
              <div>
                <div className="topbar-welcome">
                  {t("nav.welcome_back", "Welcome back")},{" "}
                  {user.name.split(" ")[0]}
                </div>
                <div className="topbar-breadcrumb">
                  <NavLink to="/">{t("nav.overview")}</NavLink>
                  {location.pathname !== "/" && (
                    <>
                      <span className="topbar-breadcrumb-sep">/</span>
                      <span className="topbar-breadcrumb-current">
                        {t(breadcrumbKey, breadcrumbOptions)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className="topbar-notifications">
              {notifications.lowStock > 0 && (
                <NavLink to="/inventory" className="notif-badge low">
                  {t("nav.low_stock")}: {notifications.lowStock}
                </NavLink>
              )}
              {notifications.newOrders != null &&
                notifications.newOrders > 0 && (
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
                  className={
                    currentLang === lng ? "lang-btn active" : "lang-btn"
                  }
                  onClick={() => setStoredLanguage(lng as Lang)}
                  aria-label={lng === "en" ? "English" : "العربية"}
                >
                  {lng === "en" ? "EN" : "AR"}
                </button>
              ))}
            </div>
            {user && (
              <div className="topbar-user">
                <div className="topbar-avatar">{userInitials}</div>
                <div className="topbar-user-info">
                  <span className="topbar-user-name">{user.name}</span>
                  <span className="topbar-email">{user.email}</span>
                </div>
              </div>
            )}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
