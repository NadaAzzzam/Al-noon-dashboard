import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api, ApiError, getCurrentUser } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";

type Role = {
  id: string;
  name: string;
  key: string;
  status?: "ACTIVE" | "INACTIVE";
  description?: string;
  permissionIds: string[];
  permissionsCount: number;
};

type RolesResponse = { data?: { roles: Role[] }; roles?: Role[] };

const RolesPage = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const rolesRes = (await api.listRoles()) as RolesResponse;
      const r = rolesRes.data?.roles ?? rolesRes.roles ?? [];
      setRoles(r);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setRoles([]);
        setError(null);
        return;
      }
      setError(err instanceof ApiError ? err.message : t("roles.failed_load", "Failed to load roles"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canManageRoles = getCurrentUser()?.role === "ADMIN";

  const handleDelete = async (role: Role) => {
    if (!confirm(t("roles.delete_confirm", "Delete this role? This cannot be undone."))) return;
    setError(null);
    try {
      await api.deleteRole(role.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("roles.failed_delete", "Failed to delete role"));
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
          <h1>{t("roles.title", "Roles & permissions")}</h1>
          <p>{t("roles.subtitle", "Control which parts of the dashboard each role can access.")}</p>
        </div>
        {canManageRoles && (
          <Link to="/roles/new" className="button">
            <svg
              className="button-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("roles.new_role", "New role")}
          </Link>
        )}
      </div>
      <div className="card">
        {roles.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>{t("roles.name_label", "Name")}</th>
                <th>{t("roles.role_key", "Key")}</th>
                <th>{t("dashboard.status")}</th>
                <th>{t("roles.permissions", "Permissions")}</th>
                {canManageRoles && <th>{t("common.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>
                    <span className="badge" style={{ fontFamily: "ui-monospace, monospace" }}>
                      {role.key}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${role.status === "ACTIVE" ? "badge-success" : "badge-muted"}`}
                    >
                      {role.status === "ACTIVE" ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td>{role.permissionsCount}</td>
                  {canManageRoles && (
                    <td>
                      <TableActionsDropdown
                        ariaLabel={t("common.actions")}
                        actions={[
                          {
                            label: t("common.edit"),
                            to: `/roles/${role.id}/edit`,
                          },
                          ...(role.key !== "ADMIN"
                            ? [
                                {
                                  label: t("common.delete"),
                                  onClick: () => handleDelete(role),
                                  danger: true,
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
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
            </div>
            <h3>{t("roles.no_roles", "No roles found")}</h3>
            <p>{t("roles.no_roles_desc", "Create your first role to get started")}</p>
            {canManageRoles && (
              <Link to="/roles/new" className="button">
                {t("roles.new_role", "New role")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RolesPage;
