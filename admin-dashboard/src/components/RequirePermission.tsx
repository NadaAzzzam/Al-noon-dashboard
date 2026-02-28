import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { hasPermission } from "../services/api";

type RequirePermissionProps = {
  permission: string | string[];
  children: JSX.Element;
};

/**
 * Route guard: redirects to dashboard if user lacks the required permission(s).
 * Pass a single permission string or an array (any one grants access).
 * On dashboard ("/") when no access, shows message instead of redirect to avoid loop.
 */
const RequirePermission = ({ permission, children }: RequirePermissionProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const perms = Array.isArray(permission) ? permission : [permission];
  const hasAccess = perms.some((p) => hasPermission(p));

  if (!hasAccess) {
    if (location.pathname === "/" || location.pathname === "") {
      return (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p>{t("common.no_permission", "You do not have permission to view this page.")}</p>
          <p style={{ marginTop: 8, color: "var(--color-text-secondary, #666)", fontSize: 14 }}>
            {t("common.use_sidebar", "Use the sidebar to navigate to pages you can access.")}
          </p>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequirePermission;
