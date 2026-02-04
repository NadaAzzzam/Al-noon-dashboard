import { useEffect, useState } from "react";
import { api, User } from "../services/api";

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.listUsers();
      setUsers(response.users ?? []);
    };
    load();
  }, []);

  return (
    <div>
      <div className="header">
        <div>
          <h1>Users</h1>
          <p>Manage customer access and roles.</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
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
