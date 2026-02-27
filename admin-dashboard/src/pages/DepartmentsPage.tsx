import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api, ApiError, hasPermission } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";

type Department = {
  id: string;
  name: string;
  key: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
};

type DepartmentsResponse = { data?: { departments: Department[] }; departments?: Department[] };

const DepartmentsPage = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = (await api.listDepartments()) as DepartmentsResponse;
      const d = res.data?.departments ?? res.departments ?? [];
      setDepartments(d);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("departments.failed_load", "Failed to load departments"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canView = hasPermission("departments.view");
  const canManage = hasPermission("departments.manage");

  const handleDelete = async (dept: Department) => {
    if (!confirm(t("departments.delete_confirm", "Delete this department? This cannot be undone."))) return;
    setError(null);
    try {
      await api.deleteDepartment(dept.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("departments.failed_delete", "Failed to delete department"));
    }
  };

  if (!canView) {
    return (
      <div>
        <p>{t("common.no_permission", "You do not have permission to view this page.")}</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className="header">
        <div>
          <h1>{t("departments.title", "Departments")}</h1>
          <p>{t("departments.subtitle", "Organize users by department (e.g. Marketing, Admin). Roles control which pages each user can access.")}</p>
        </div>
        {canManage && (
          <Link to="/departments/new" className="button">
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
            {t("departments.new_department", "New department")}
          </Link>
        )}
      </div>
      <div className="card">
        {departments.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>{t("departments.name_label", "Name")}</th>
                <th>{t("dashboard.status")}</th>
                {canManage && <th>{t("common.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.name}</td>
                  <td>
                    <span
                      className={`badge ${dept.status === "ACTIVE" ? "badge-success" : "badge-muted"}`}
                    >
                      {dept.status === "ACTIVE" ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <TableActionsDropdown
                        ariaLabel={t("common.actions")}
                        actions={[
                          {
                            label: t("common.edit"),
                            to: `/departments/${dept.id}/edit`,
                          },
                          {
                            label: t("common.delete"),
                            onClick: () => handleDelete(dept),
                            danger: true,
                          },
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>{t("departments.no_departments", "No departments found")}</h3>
            <p>{t("departments.no_departments_desc", "Create departments like Marketing, Admin to organize your team.")}</p>
            {canManage && (
              <Link to="/departments/new" className="button">
                {t("departments.new_department", "New department")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentsPage;
