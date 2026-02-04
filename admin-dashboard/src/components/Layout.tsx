import { NavLink, Outlet, useNavigate } from "react-router-dom";

const Layout = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("al_noon_token");
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
          <NavLink className="nav-link" to="/orders">
            Orders
          </NavLink>
          <NavLink className="nav-link" to="/users">
            Users
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
