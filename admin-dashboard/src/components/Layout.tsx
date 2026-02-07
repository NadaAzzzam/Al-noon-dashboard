import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../services/api";

const Layout = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await api.logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Al-noon Admin</h2>
        <nav>
          <NavLink className="nav-link" to="/">
            Overview
          </NavLink>
          <NavLink className="nav-link" to="/products">
            Products
          </NavLink>
          <NavLink className="nav-link" to="/categories">
            Categories
          </NavLink>
          <NavLink className="nav-link" to="/inventory">
            Inventory
          </NavLink>
          <NavLink className="nav-link" to="/orders">
            Orders
          </NavLink>
          <NavLink className="nav-link" to="/customers">
            Customers
          </NavLink>
          <NavLink className="nav-link" to="/settings">
            Settings
          </NavLink>
        </nav>
        <button className="button secondary" onClick={handleLogout} style={{ marginTop: 24 }}>
          Log out
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
