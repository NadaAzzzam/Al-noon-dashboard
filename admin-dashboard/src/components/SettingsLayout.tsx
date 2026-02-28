import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { hasPermission } from "../services/api";

const SettingsLayout = () => {
  const { t } = useTranslation();
  const canViewGeneral = hasPermission("settings.view") || hasPermission("settings.manage");
  const canViewHome = hasPermission("home_page.view") || hasPermission("home_page.manage") || hasPermission("settings.manage");
  const canViewContent = hasPermission("content_pages.view") || hasPermission("content_pages.manage") || hasPermission("settings.manage");
  const canViewAi = hasPermission("ai_settings.manage") || hasPermission("settings.manage");

  return (
    <div className="settings-layout">
      <nav className="settings-subnav" aria-label={t("settings.subnav_label")}>
        {canViewGeneral && (
          <NavLink className="settings-subnav-link" to="/settings" end>
            {t("settings.tab_general")}
          </NavLink>
        )}
        {canViewHome && (
          <NavLink className="settings-subnav-link" to="/settings/home">
            {t("settings.tab_home_page")}
          </NavLink>
        )}
        {canViewContent && (
          <NavLink className="settings-subnav-link" to="/settings/content-pages">
            {t("settings.tab_content_pages")}
          </NavLink>
        )}
        {canViewAi && (
          <NavLink className="settings-subnav-link" to="/settings/ai">
            {t("settings.tab_ai_assistant")}
          </NavLink>
        )}
      </nav>
      <Outlet />
    </div>
  );
};

export default SettingsLayout;
