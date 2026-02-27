import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, User, clearToken, hasPermission } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";

type RoleOption = { id: string; key: string; name: string };
type DepartmentOption = { id: string; key: string; name: string };

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: string;
  departmentId: string;
};

const emptyForm: UserForm = { name: "", email: "", password: "", role: "", departmentId: "" };

const UsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const canManageUsers = hasPermission("users.manage");

  const load = async () => {
    setError(null);
    try {
      const response = (await api.listUsers()) as { data?: { users: User[] }; users?: User[] };
      setUsers(response.data?.users ?? response.users ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("users.failed_load"));
    }
  };

  const loadOptions = async () => {
    if (!canManageUsers) return;
    try {
      const [rolesRes, deptsRes] = await Promise.all([
        api.listUserRoleOptions() as Promise<{ data?: { roles: RoleOption[] }; roles?: RoleOption[] }>,
        api.listUserDepartmentOptions() as Promise<{ data?: { departments: DepartmentOption[] }; departments?: DepartmentOption[] }>,
      ]);
      const allRoles = rolesRes.data?.roles ?? rolesRes.roles ?? [];
      setRoleOptions(allRoles.filter((r) => r.key !== "USER"));
      setDepartmentOptions(deptsRes.data?.departments ?? deptsRes.departments ?? []);
    } catch (_) {
      setRoleOptions([]);
      setDepartmentOptions([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (canManageUsers) loadOptions();
  }, [canManageUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({
      ...emptyForm,
      role: roleOptions[0]?.key ?? "",
      departmentId: "",
    });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    if (user.isSuperAdmin) return;
    setEditingUser(user);
    const deptIds = departmentOptions.map((d) => d.id);
    const departmentId = user.departmentId && deptIds.includes(user.departmentId) ? user.departmentId : "";
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      departmentId,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    setSaving(true);
    setError(null);
    try {
      if (editingUser) {
        const payload: { name: string; email: string; departmentId?: string | null; password?: string } = {
          name: form.name.trim(),
          email: form.email.trim(),
          departmentId: form.departmentId || null,
        };
        if (form.password.trim()) payload.password = form.password;
        await api.updateUser(editingUser.id, payload);
      } else {
        const defaultRole = roleOptions[0]?.key ?? "ADMIN";
        await api.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: defaultRole,
          departmentId: form.departmentId || undefined,
        });
      }
      closeModal();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("users.failed_save", "Failed to save user"));
    } finally {
      setSaving(false);
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
          <h1>{t("users.title")}</h1>
          <p>{t("users.subtitle")}</p>
        </div>
        {canManageUsers && (
          <button className="button" onClick={openCreate}>
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
            {t("users.new_user", "New user")}
          </button>
        )}
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("categories.name")}</th>
              <th>{t("auth.email")}</th>
              <th>{t("nav.departments")}</th>
              <th>{t("common.role")}</th>
              {canManageUsers && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {user.departmentName ? (
                    <span className="badge">{user.departmentName}</span>
                  ) : (
                    <span style={{ color: "var(--color-text-secondary)" }}>—</span>
                  )}
                </td>
                <td>
                  <span className="badge">{user.role}</span>
                  {user.isSuperAdmin && (
                    <span className="badge badge-success" style={{ marginLeft: 6 }}>
                      {t("users.super_admin", "Super Admin")}
                    </span>
                  )}
                </td>
                {canManageUsers && (
                  <td>
                    {user.isSuperAdmin ? (
                      <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                        {t("users.super_admin_readonly", "Read-only")}
                      </span>
                    ) : (
                      <TableActionsDropdown
                        ariaLabel={t("common.actions")}
                        actions={[{ label: t("common.edit"), onClick: () => openEdit(user) }]}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-form-title"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 id="user-form-title">
              {editingUser ? t("users.edit_user", "Edit user") : t("users.new_user", "New user")}
            </h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="product-form-field">
                <label htmlFor="user-name">{t("categories.name")} *</label>
                <input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t("users.name_placeholder", "John Doe")}
                  required
                />
              </div>
              <div className="product-form-field">
                <label htmlFor="user-email">{t("auth.email")} *</label>
                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="product-form-field">
                <label htmlFor="user-password">
                  {t("auth.password")} {editingUser ? `(${t("users.password_optional", "optional")})` : "*"}
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder={editingUser ? t("users.password_leave_blank", "Leave blank to keep current") : ""}
                  required={!editingUser}
                  minLength={6}
                />
              </div>
              <div className="product-form-field">
                <label htmlFor="user-department">{t("nav.departments")}</label>
                <select
                  id="user-department"
                  value={form.departmentId}
                  onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
                >
                  <option value="">{t("users.no_department", "No department")}</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.key})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <button className="button" type="submit" disabled={saving}>
                  {saving ? t("common.saving") : editingUser ? t("common.save") : t("common.create")}
                </button>
                <button className="button secondary" type="button" onClick={closeModal} disabled={saving}>
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
