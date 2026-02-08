import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SettingsLayout = () => {
  const { t } = useTranslation();
  return (
    <div className="settings-layout">
      <nav className="settings-subnav" aria-label={t("settings.subnav_label")}>
        <NavLink className="settings-subnav-link" to="/settings" end>
          {t("settings.tab_general")}
        </NavLink>
        <NavLink className="settings-subnav-link" to="/settings/home">
          {t("settings.tab_home_page")}
        </NavLink>
        <NavLink className="settings-subnav-link" to="/settings/content-pages">
          {t("settings.tab_content_pages")}
        </NavLink>
        <NavLink className="settings-subnav-link" to="/settings/ai">
          {t("settings.tab_ai_assistant")}
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
};

export default SettingsLayout;
