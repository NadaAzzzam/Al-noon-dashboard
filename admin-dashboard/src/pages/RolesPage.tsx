import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, hasPermission } from "../services/api";

type Role = {
  id: string;
  name: string;
  key: string;
  status?: "ACTIVE" | "INACTIVE";
  description?: string;
  /** Permission IDs assigned to this role. */
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

type RolesResponse = { data?: { roles: Role[] }; roles?: Role[] };
type PermsResponse = { data?: { permissions: PermissionDefinition[] }; permissions?: PermissionDefinition[] };

const RolesPage = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const [rolesRes, permsRes] = (await Promise.all([api.listRoles(), api.listRolePermissions()])) as [
        RolesResponse,
        PermsResponse
      ];
      const r = rolesRes.data?.roles ?? rolesRes.roles ?? [];
      const p = permsRes.data?.permissions ?? permsRes.permissions ?? [];
      setRoles(r);
      setPermissions(p);
      if (!selectedRoleId && r.length > 0) {
        setSelectedRoleId(r[0].id);
        setEditingRole(r[0]);
      } else if (selectedRoleId) {
        const found = r.find((role) => role.id === selectedRoleId);
        setEditingRole(found ?? null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // No roles endpoint yet or no roles seeded – show empty state without hard error.
        setRoles([]);
        setPermissions([]);
        setEditingRole(null);
        setSelectedRoleId(null);
        setError(null);
        return;
      }
      setError(err instanceof ApiError ? err.message : t("roles.failed_load", "Failed to load roles"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSelectRole = (role: Role) => {
    setIsCreating(false);
    setSelectedRoleId(role.id);
    setEditingRole(role);
  };

  const togglePermission = (permissionId: string) => {
    if (!editingRole) return;
    const has = editingRole.permissionIds.includes(permissionId);
    const updated: Role = {
      ...editingRole,
      permissionIds: has
        ? editingRole.permissionIds.filter((p) => p !== permissionId)
        : [...editingRole.permissionIds, permissionId],
      permissionsCount: has
        ? editingRole.permissionsCount - 1
        : editingRole.permissionsCount + 1,
    };
    setEditingRole(updated);
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleSave = async () => {
    if (!editingRole) return;
    setSaving(true);
    setError(null);
    try {
      if (isCreating || !editingRole.id) {
        await api.createRole({
          name: editingRole.name,
          key: editingRole.key,
          description: editingRole.description,
          permissionIds: editingRole.permissionIds,
        });
      } else {
        await api.updateRole(editingRole.id, {
          name: editingRole.name,
          description: editingRole.description,
          permissionIds: editingRole.permissionIds,
        });
      }
      setIsCreating(false);
      await load();
    } catch (err) {
      const key =
        isCreating && err instanceof ApiError
          ? "roles.failed_create"
          : "roles.failed_save";
      setError(err instanceof ApiError ? err.message : t(key, "Failed to save role"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setSelectedRoleId(null);
    setEditingRole({
      id: "",
      name: "",
      key: "",
      description: "",
      status: "ACTIVE",
      permissionIds: [],
      permissionsCount: 0,
    });
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(t("roles.delete_confirm", "Delete this role? This cannot be undone."))) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteRole(role.id);
      setSelectedRoleId(null);
      setEditingRole(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("roles.failed_delete", "Failed to delete role"));
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce<Record<string, PermissionDefinition[]>>((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {});

  const canManageRoles = hasPermission("roles.manage");

  return (
    <div className="roles-page">
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
        <button className="button" type="button" onClick={handleCreate} disabled={saving}>
          {t("roles.new_role", "New role")}
        </button>
      </div>
      <div className="card roles-layout">
        <div className="roles-list">
          <h3>{t("roles.roles_list", "Roles")}</h3>
          <ul>
            {roles.map((role) => (
              <li
                key={role.id}
                className={role.id === selectedRoleId ? "roles-list-item active" : "roles-list-item"}
                onClick={() => onSelectRole(role)}
              >
                <div className="roles-list-item-main">
                  <span className="roles-list-name">{role.name}</span>
                  <span className="roles-list-key">{role.key}</span>
                  <span className="roles-list-count badge">
                    {role.permissionsCount}{" "}
                    {t("roles.permissions_count_label", "perms")}
                  </span>
                </div>
                {role.description && <div className="roles-list-desc">{role.description}</div>}
                {canManageRoles && role.key !== "ADMIN" && (
                  <button
                    type="button"
                    className="link-button roles-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(role);
                    }}
                  >
                    {t("roles.delete", "Delete")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="roles-permissions">
          {editingRole ? (
            <>
              <div className="roles-permissions-header">
                <div>
                  <h3>
                    {isCreating
                      ? t("roles.new_role", "New role")
                      : editingRole.name || t("roles.unnamed_role", "Unnamed role")}
                  </h3>
                  <p className="roles-permissions-key">
                    {t("roles.role_key", "Key")}: {editingRole.key}
                  </p>
                </div>
              </div>
              <div className="roles-permissions-meta">
                <div className="form-group">
                  <label>{t("roles.name_label", "Role name")}</label>
                  <input
                    value={editingRole.name}
                    onChange={(e) =>
                      setEditingRole({ ...editingRole, name: e.target.value })
                    }
                    placeholder={t("roles.name_placeholder", "Store manager")}
                    disabled={!canManageRoles}
                  />
                </div>
                <div className="form-group">
                  <label>{t("roles.key_label", "Role key")}</label>
                  <input
                    value={editingRole.key}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        key: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                      })
                    }
                    placeholder={t("roles.key_placeholder", "MANAGER")}
                    disabled={!canManageRoles || !isCreating}
                  />
                  <p className="settings-hint">
                    {t(
                      "roles.key_hint",
                      "Used internally in tokens. Uppercase letters, numbers, and underscores."
                    )}
                  </p>
                </div>
              </div>
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group} className="roles-permissions-group">
                  <h4>{group}</h4>
                  <div className="roles-permissions-grid">
                    {perms.map((perm) => {
                      const checked = editingRole.permissionIds.includes(perm.id);
                      return (
                        <label key={perm.id} className="roles-permission-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canManageRoles}
                            onChange={() => togglePermission(perm.id)}
                          />
                          <span className="roles-permission-label">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {canManageRoles && (
                <div style={{ marginTop: 16 }}>
                  <button className="button" type="button" onClick={handleSave} disabled={saving}>
                    {saving
                      ? t("common.saving")
                      : isCreating
                      ? t("common.create")
                      : t("common.save")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>{t("roles.no_role_selected", "Select a role to edit its permissions")}</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesPage;

