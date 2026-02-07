import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, User, clearToken } from "../services/api";

const UsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const response = await api.listUsers() as { users: User[] };
        setUsers(response.users ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : t("users.failed_load"));
      }
    };
    load();
  }, []);

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("users.title")}</h1>
          <p>{t("users.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("categories.name")}</th>
              <th>{t("auth.email")}</th>
              <th>{t("common.role")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className="badge">{user.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
