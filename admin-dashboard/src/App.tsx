import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import RequirePermission from "./components/RequirePermission";
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
import DepartmentsPage from "./pages/DepartmentsPage";
import DepartmentFormPage from "./pages/DepartmentFormPage";
import DiscountCodesPage from "./pages/DiscountCodesPage";
import { getToken } from "./services/api";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <>
  <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
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
      <Route index element={<RequirePermission permission="dashboard.view"><DashboardPage /></RequirePermission>} />
      <Route path="reports" element={<RequirePermission permission="reports.view"><ReportsPage /></RequirePermission>} />
      <Route path="products" element={<RequirePermission permission="products.view"><ProductsPage /></RequirePermission>} />
      <Route path="products/new" element={<RequirePermission permission="products.manage"><ProductFormPage /></RequirePermission>} />
      <Route path="products/:id/edit" element={<RequirePermission permission="products.manage"><ProductFormPage /></RequirePermission>} />
      <Route path="categories" element={<RequirePermission permission="categories.view"><CategoriesPage /></RequirePermission>} />
      <Route path="cities" element={<RequirePermission permission="cities.view"><CitiesPage /></RequirePermission>} />
      <Route path="shipping-methods" element={<RequirePermission permission="shipping_methods.view"><ShippingMethodsPage /></RequirePermission>} />
      <Route path="discount-codes" element={<RequirePermission permission="settings.manage"><DiscountCodesPage /></RequirePermission>} />
      <Route path="inventory" element={<RequirePermission permission="inventory.view"><InventoryPage /></RequirePermission>} />
      <Route path="orders" element={<RequirePermission permission="orders.view"><OrdersPage /></RequirePermission>} />
      <Route path="orders/:id" element={<RequirePermission permission="orders.view"><OrderDetailPage /></RequirePermission>} />
      <Route path="customers" element={<RequirePermission permission="customers.view"><CustomersPage /></RequirePermission>} />
      <Route path="customers/:id" element={<RequirePermission permission="customers.view"><CustomerDetailPage /></RequirePermission>} />
      <Route path="users" element={<RequirePermission permission="users.view"><UsersPage /></RequirePermission>} />
      <Route path="roles" element={<RequirePermission permission={["roles.view", "departments.manage"]}><RolesPage /></RequirePermission>} />
      <Route path="roles/new" element={<RequirePermission permission="roles.manage"><RoleFormPage /></RequirePermission>} />
      <Route path="roles/:id/edit" element={<RequirePermission permission="roles.manage"><RoleFormPage /></RequirePermission>} />
      <Route path="departments" element={<RequirePermission permission="departments.view"><DepartmentsPage /></RequirePermission>} />
      <Route path="departments/new" element={<RequirePermission permission="departments.manage"><DepartmentFormPage /></RequirePermission>} />
      <Route path="departments/:id/edit" element={<RequirePermission permission="departments.manage"><DepartmentFormPage /></RequirePermission>} />
      <Route path="subscribers" element={<RequirePermission permission="subscribers.view"><SubscribersPage /></RequirePermission>} />
      <Route path="contact" element={<RequirePermission permission="contact.view"><ContactSubmissionsPage /></RequirePermission>} />
      <Route path="feedback" element={<RequirePermission permission="feedback.view"><FeedbackPage /></RequirePermission>} />
      <Route path="ai-chats" element={<RequirePermission permission="ai_chats.view"><AiChatHistoryPage /></RequirePermission>} />
      <Route path="ai-chats/:id" element={<RequirePermission permission="ai_chats.view"><AiChatHistoryPage /></RequirePermission>} />
      <Route path="settings" element={<RequirePermission permission={["settings.view", "settings.manage", "home_page.view", "home_page.manage", "content_pages.view", "content_pages.manage", "ai_settings.manage"]}><SettingsLayout /></RequirePermission>}>
        <Route index element={<SettingsPage />} />
        <Route path="home" element={<HomePageSettingsPage />} />
        <Route path="content-pages" element={<ContentPagesPage />} />
        <Route path="ai" element={<AiSettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  </>
);

export default App;
