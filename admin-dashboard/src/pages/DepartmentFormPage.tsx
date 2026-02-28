import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, hasPermission } from "../services/api";

type Department = {
  id: string;
  name: string;
  key: string;
  status?: "ACTIVE" | "INACTIVE";
  roleIds?: string[];
};

type RoleOption = {
  id: string;
  key: string;
  name: string;
  permissionsCount?: number;
};

const DepartmentFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<Department>({
    id: "",
    name: "",
    key: "",
    status: "ACTIVE",
    roleIds: [],
  });
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("departments.manage");

  const loadDepartment = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getDepartment(id)) as {
        data?: { department: Department };
        department?: Department;
      };
      const dept = res.data?.department ?? res.department;
      if (dept) {
        setForm({
          id: dept.id,
          name: dept.name,
          key: dept.key,
          status: dept.status ?? "ACTIVE",
          roleIds: dept.roleIds ?? [],
        });
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("departments.failed_load", "Failed to load department"),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRoleOptions = async () => {
    try {
      const res = (await api.listRoles()) as {
        data?: { roles?: RoleOption[] };
        roles?: RoleOption[];
      };
      const roles: RoleOption[] = res.data?.roles ?? res.roles ?? [];
      const filtered = roles.filter(
        (r) => (r as { status?: string }).status !== "INACTIVE",
      );
      setRoleOptions(filtered);
    } catch (_) {
      setRoleOptions([]);
    }
  };

  useEffect(() => {
    if (isEdit && id) loadDepartment();
  }, [isEdit, id]);

  useEffect(() => {
    loadRoleOptions();
  }, []);

  const handleRolesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setForm((prev) => ({ ...prev, roleIds: selected }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && form.id) {
        await api.updateDepartment(form.id, {
          name: form.name,
          status: form.status,
          roleIds: form.roleIds ?? [],
        });
      } else {
        await api.createDepartment({
          name: form.name,
          roleIds: form.roleIds ?? [],
        });
      }
      navigate("/departments");
    } catch (err) {
      const key =
        !isEdit && err instanceof ApiError
          ? "departments.failed_create"
          : "departments.failed_save";
      setError(
        err instanceof ApiError
          ? err.message
          : t(key, "Failed to save department"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (
      !confirm(
        t(
          "departments.delete_confirm",
          "Delete this department? This cannot be undone.",
        ),
      )
    )
      return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteDepartment(form.id);
      navigate("/departments");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("departments.failed_delete", "Failed to delete department"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) {
    return (
      <div>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (isEdit && !form.name && !error) {
    return null;
  }

  return (
    <div className="product-form-page">
      <Link to="/departments" className="product-form-back">
        {t("departments.back_departments", "← Back to departments")}
      </Link>
      <h1 className="product-form-title">
        {isEdit
          ? t("departments.edit_department", "Edit department")
          : t("departments.new_department", "New department")}
      </h1>
      <p className="product-form-subtitle">
        {isEdit
          ? t("departments.edit_subtitle", "Update department details")
          : t(
              "departments.create_subtitle",
              "Create a department (e.g. Marketing, Admin) to organize your team.",
            )}
      </p>
      {error && (
        <div className="product-form-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("departments.section_basic", "Basic info")}
          </h2>
          <div className="product-form-grid">
            <div className="product-form-field">
              <label htmlFor="dept-name">
                {t("departments.name_label", "Name")} *
              </label>
              <input
                id="dept-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("departments.name_placeholder", "Marketing")}
                required
                disabled={!canManage}
              />
            </div>
            {isEdit && (
              <div className="product-form-field">
                <label htmlFor="dept-status">{t("dashboard.status")}</label>
                <select
                  id="dept-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as "ACTIVE" | "INACTIVE",
                    }))
                  }
                  disabled={!canManage}
                >
                  <option value="ACTIVE">{t("common.active")}</option>
                  <option value="INACTIVE">{t("common.inactive")}</option>
                </select>
              </div>
            )}
          </div>
        </section>

        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("departments.roles_permissions_label", "Roles & permissions")}
          </h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            {t(
              "departments.roles_hint",
              "Assign roles to this department. Hold Ctrl/Cmd to select multiple.",
            )}
          </p>
          <div className="product-form-field">
            <label htmlFor="dept-roles">
              {t("departments.select_roles", "Select roles")}
            </label>
            <select
              id="dept-roles"
              multiple
              value={form.roleIds ?? []}
              onChange={handleRolesChange}
              disabled={!canManage}
            >
              {roleOptions.length === 0 ? (
                <option value="" disabled>
                  {t("departments.no_roles", "No roles available.")}
                </option>
              ) : (
                roleOptions.map((role) => {
                  const id = String(
                    role.id ?? (role as { _id?: string })._id ?? "",
                  );
                  return (
                    <option
                      key={id}
                      value={id}
                      title={
                        role.permissionsCount
                          ? `${role.permissionsCount} ${t("roles.permissions", "permissions")}`
                          : t("departments.no_permissions", "No permissions")
                      }
                    >
                      {role.name}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </section>

        <div className="product-form-actions" style={{ marginTop: 24 }}>
          {canManage && (
            <>
              <button type="submit" className="button" disabled={saving}>
                {saving
                  ? t("common.saving")
                  : isEdit
                    ? t("common.save")
                    : t("common.create")}
              </button>
              <Link to="/departments" className="button secondary">
                {t("common.cancel")}
              </Link>
              {isEdit && (
                <button
                  type="button"
                  className="button danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {t("common.delete")}
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default DepartmentFormPage;
