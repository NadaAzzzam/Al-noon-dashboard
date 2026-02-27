import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CategoriesPage from "./pages/CategoriesPage";
import CitiesPage from "./pages/CitiesPage";
import ShippingMethodsPage from "./pages/ShippingMethodsPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import LoginPage from "./pages/LoginPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrdersPage from "./pages/OrdersPage";
import ProductFormPage from "./pages/ProductFormPage";
import ProductsPage from "./pages/ProductsPage";
import SettingsLayout from "./components/SettingsLayout";
import ContactSubmissionsPage from "./pages/ContactSubmissionsPage";
import FeedbackPage from "./pages/FeedbackPage";
import ContentPagesPage from "./pages/ContentPagesPage";
import HomePageSettingsPage from "./pages/HomePageSettingsPage";
import SettingsPage from "./pages/SettingsPage";
import AiSettingsPage from "./pages/AiSettingsPage";
import AiChatHistoryPage from "./pages/AiChatHistoryPage";
import SubscribersPage from "./pages/SubscribersPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import RoleFormPage from "./pages/RoleFormPage";
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
      <Route path="reports" element={<ReportsPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/new" element={<ProductFormPage />} />
      <Route path="products/:id/edit" element={<ProductFormPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="cities" element={<CitiesPage />} />
      <Route path="shipping-methods" element={<ShippingMethodsPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="customers/:id" element={<CustomerDetailPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="roles" element={<RolesPage />} />
      <Route path="roles/new" element={<RoleFormPage />} />
      <Route path="roles/:id/edit" element={<RoleFormPage />} />
      <Route path="subscribers" element={<SubscribersPage />} />
      <Route path="contact" element={<ContactSubmissionsPage />} />
      <Route path="feedback" element={<FeedbackPage />} />
      <Route path="ai-chats" element={<AiChatHistoryPage />} />
      <Route path="ai-chats/:id" element={<AiChatHistoryPage />} />
      <Route path="settings" element={<SettingsLayout />}>
        <Route index element={<SettingsPage />} />
        <Route path="home" element={<HomePageSettingsPage />} />
        <Route path="content-pages" element={<ContentPagesPage />} />
        <Route path="ai" element={<AiSettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
