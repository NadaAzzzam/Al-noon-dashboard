import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, getCurrentUser } from "../services/api";

type Role = {
  id: string;
  name: string;
  key: string;
  status?: "ACTIVE" | "INACTIVE";
  description?: string;
  permissionIds: string[];
  permissionsCount: number;
};

type PermissionDefinition = {
  id: string;
  key: string;
  group: string;
  label: string;
  description?: string;
};

type PermsResponse = { data?: { permissions: PermissionDefinition[] }; permissions?: PermissionDefinition[] };

const RoleFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<Role>({
    id: "",
    name: "",
    key: "",
    description: "",
    status: "ACTIVE",
    permissionIds: [],
    permissionsCount: 0,
  });
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageRoles = getCurrentUser()?.role === "ADMIN";

  const loadPermissions = async () => {
    try {
      const permsRes = (await api.listRolePermissions()) as PermsResponse;
      const p = permsRes.data?.permissions ?? permsRes.permissions ?? [];
      setPermissions(p);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPermissions([]);
      }
    }
  };

  const loadRole = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getRole(id)) as { data?: { role: Role }; role?: Role };
      const role = res.data?.role ?? res.role;
      if (role) {
        setForm({
          id: role.id,
          name: role.name,
          key: role.key,
          description: role.description ?? "",
          status: role.status ?? "ACTIVE",
          permissionIds: role.permissionIds ?? [],
          permissionsCount: role.permissionsCount ?? 0,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("roles.failed_load", "Failed to load role"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      loadRole();
    }
  }, [isEdit, id]);

  const groupedPermissions = permissions.reduce<Record<string, PermissionDefinition[]>>((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {});

  const togglePermission = (permissionId: string) => {
    const has = form.permissionIds.includes(permissionId);
    setForm((prev) => ({
      ...prev,
      permissionIds: has
        ? prev.permissionIds.filter((p) => p !== permissionId)
        : [...prev.permissionIds, permissionId],
      permissionsCount: has ? prev.permissionsCount - 1 : prev.permissionsCount + 1,
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: checked ? permissions.map((p) => p.id) : [],
      permissionsCount: checked ? permissions.length : 0,
    }));
  };

  const handleSelectAllInGroup = (group: string, checked: boolean) => {
    const perms = groupedPermissions[group] ?? [];
    const permIds = perms.map((p) => p.id);
    setForm((prev) => {
      const newIds = checked
        ? [...new Set([...prev.permissionIds, ...permIds])]
        : prev.permissionIds.filter((pid) => !permIds.includes(pid));
      return {
        ...prev,
        permissionIds: newIds,
        permissionsCount: newIds.length,
      };
    });
  };

  const isGroupAllSelected = (group: string) => {
    const perms = groupedPermissions[group] ?? [];
    return perms.length > 0 && perms.every((p) => form.permissionIds.includes(p.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRoles) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && form.id) {
        await api.updateRole(form.id, {
          name: form.name,
          permissionIds: form.permissionIds,
        });
      } else {
        const key = form.name.trim().toUpperCase().replace(/\s+/g, "_") || "ROLE";
        await api.createRole({
          name: form.name,
          key,
          permissionIds: form.permissionIds,
        });
      }
      navigate("/roles");
    } catch (err) {
      const key = !isEdit && err instanceof ApiError ? "roles.failed_create" : "roles.failed_save";
      setError(err instanceof ApiError ? err.message : t(key, "Failed to save role"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id || form.key === "ADMIN") return;
    if (!confirm(t("roles.delete_confirm", "Delete this role? This cannot be undone."))) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteRole(form.id);
      navigate("/roles");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("roles.failed_delete", "Failed to delete role"));
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
      <Link to="/roles" className="product-form-back">
        {t("roles.back_roles", "← Back to roles")}
      </Link>
      <h1 className="product-form-title">
        {isEdit ? t("roles.edit_role", "Edit role") : t("roles.new_role", "New role")}
      </h1>
      <p className="product-form-subtitle">
        {isEdit
          ? t("roles.edit_subtitle", "Update role name and permissions")
          : t("roles.create_subtitle", "Create a new role and assign permissions")}
      </p>
      {error && (
        <div className="product-form-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <section className="product-form-section">
          <h2 className="product-form-section-title">{t("roles.section_basic", "Basic info")}</h2>
          <div className="product-form-grid">
            <div className="product-form-field">
              <label htmlFor="role-name">{t("roles.name_label", "Name")} *</label>
              <input
                id="role-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t("roles.name_placeholder", "Store manager")}
                required
                disabled={!canManageRoles}
              />
            </div>
          </div>
        </section>

        {canManageRoles && (
          <section className="product-form-section">
            <h2 className="product-form-section-title">{t("roles.section_permissions", "Permissions")}</h2>
            <div className="hint-block" style={{ marginBottom: 16 }}>
              <label>
                <input
                  type="checkbox"
                  checked={
                    form.permissionIds.length === permissions.length && permissions.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span>{t("roles.select_all", "Select All")}</span>
              </label>
              <p className="hint">
                {t("roles.select_all_hint", "Enables/Disables all Permissions for this role")}
              </p>
            </div>
            <div className="scroll-panel" style={{ marginTop: 16 }}>
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group} className="section-block">
                  <div className="section-header">
                    <h4 style={{ margin: 0, fontSize: 14 }}>{group}</h4>
                    <label style={{ fontSize: 13, color: "var(--color-text-secondary)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isGroupAllSelected(group)}
                        onChange={(e) => handleSelectAllInGroup(group, e.target.checked)}
                      />
                      {t("roles.select_all", "Select all")}
                    </label>
                  </div>
                  <div className="checkbox-group">
                    {perms.map((perm) => (
                      <label key={perm.id}>
                        <input
                          type="checkbox"
                          checked={form.permissionIds.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="product-form-actions" style={{ marginTop: 24 }}>
          {canManageRoles && (
            <>
              <button type="submit" className="button" disabled={saving}>
                {saving ? t("common.saving") : isEdit ? t("common.save") : t("common.create")}
              </button>
              <Link to="/roles" className="button secondary">
                {t("common.cancel")}
              </Link>
              {isEdit && form.key !== "ADMIN" && (
                <button
                  type="button"
                  className="button danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {t("roles.delete", "Delete")}
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default RoleFormPage;
