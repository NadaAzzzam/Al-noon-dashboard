import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, User } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";

const CustomersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const response = (await api.listUsers()) as { data?: { users: User[] }; users?: User[] };
        setUsers(response.data?.users ?? response.users ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : t("customers.failed_load"));
      }
    };
    load();
  }, []);

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("customers.title")}</h1>
          <p>{t("customers.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("categories.name")}</th>
              <th>{t("auth.email")}</th>
              <th>{t("common.role")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className="badge">{user.role}</span></td>
                <td>
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[{ label: t("common.view"), to: `/customers/${user.id}` }]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersPage;
