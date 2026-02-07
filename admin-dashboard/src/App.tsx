import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CategoriesPage from "./pages/CategoriesPage";
import CitiesPage from "./pages/CitiesPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import LoginPage from "./pages/LoginPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrdersPage from "./pages/OrdersPage";
import ProductFormPage from "./pages/ProductFormPage";
import ProductsPage from "./pages/ProductsPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import { getToken } from "./services/api";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={
        <RequireAuth>
          <Layout />
        </RequireAuth>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/new" element={<ProductFormPage />} />
      <Route path="products/:id/edit" element={<ProductFormPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="cities" element={<CitiesPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="customers/:id" element={<CustomerDetailPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
