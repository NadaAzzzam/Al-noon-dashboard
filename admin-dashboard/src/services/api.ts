const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  images?: string[];
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  category?: { name: string; status?: string } | string;
};

export type Category = {
  _id: string;
  name: string;
  description?: string;
  status: "visible" | "hidden";
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type Order = {
  _id: string;
  status: OrderStatus;
  total: number;
  paymentMethod?: "COD" | "INSTAPAY";
  shippingAddress?: string;
  user?: { name: string; email: string };
  items?: { product: { name: string; price: number; discountPrice?: number }; quantity: number; price: number }[];
  payment?: { method: string; status: string; instaPayProofUrl?: string };
  createdAt: string;
};

export type DashboardStats = {
  totalOrders: number;
  ordersToday: number;
  revenue: number;
  lowStockCount: number;
  bestSelling: { productId: string; name: string; totalQty: number }[];
  ordersPerDay: { _id: string; count: number; revenue: number }[];
};

export type City = {
  _id: string;
  name: string;
  deliveryFee: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Settings = {
  storeName: string;
  logo?: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  lowStockThreshold: number;
};

/** Thrown for any non-2xx API response. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const getToken = () => localStorage.getItem("al_noon_token");

async function parseErrorResponse(response: Response): Promise<{ message: string; body?: unknown }> {
  const text = await response.text();
  let message = response.statusText || "Request failed";
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
    if (body && typeof body === "object" && "message" in body && typeof (body as { message: unknown }).message === "string") {
      message = (body as { message: string }).message;
    }
  } catch {
    if (text) message = text;
  }
  if (response.status === 401) message = message || "Unauthorized";
  if (response.status === 403) message = message || "Forbidden";
  if (response.status === 404) message = message || "Not found";
  if (response.status >= 500) message = message || "Server error";
  return { message, body };
}

const request = async (path: string, options: RequestInit = {}): Promise<unknown> => {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new ApiError(0, `Cannot reach server. ${msg}`);
  }

  if (!response.ok) {
    const { message, body } = await parseErrorResponse(response);
    throw new ApiError(response.status, message, body);
  }
  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  /** POST /auth/sign-in – conventional name for login */
  signIn: (email: string, password: string) =>
    request("/auth/sign-in", { method: "POST", body: JSON.stringify({ email, password }) }),
  /** GET /auth/profile – current user (conventional name for "me") */
  getProfile: () => request("/auth/profile"),

  listUsers: () => request("/users"),
  getCustomer: (id: string) => request(`/users/${id}`),
  getCustomerOrders: (id: string) => request(`/users/${id}/orders`),

  listProducts: (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    if (params?.category) sp.set("category", params.category);
    const q = sp.toString();
    return request(`/products${q ? `?${q}` : ""}`);
  },
  getProduct: (id: string) => request(`/products/${id}`),
  createProduct: (payload: Partial<Product>) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setProductStatus: (id: string, status: "ACTIVE" | "INACTIVE") =>
    request(`/products/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateProductStock: (productId: string, stock: number) =>
    request(`/products/${productId}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: "DELETE" }),

  listCities: () => request("/cities"),
  getCity: (id: string) => request(`/cities/${id}`),
  createCity: (payload: { name: string; deliveryFee?: number }) =>
    request("/cities", { method: "POST", body: JSON.stringify(payload) }),
  updateCity: (id: string, payload: { name?: string; deliveryFee?: number }) =>
    request(`/cities/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCity: (id: string) => request(`/cities/${id}`, { method: "DELETE" }),

  listCategories: () => request("/categories"),
  createCategory: (payload: Partial<Category>) =>
    request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: Partial<Category>) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setCategoryStatus: (id: string, status: "visible" | "hidden") =>
    request(`/categories/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteCategory: (id: string) => request(`/categories/${id}`, { method: "DELETE" }),

  getLowStock: () => request("/inventory/low-stock"),
  getOutOfStock: () => request("/inventory/out-of-stock"),

  listOrders: (params?: { page?: number; limit?: number; status?: string; paymentMethod?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.status) sp.set("status", params.status);
    if (params?.paymentMethod) sp.set("paymentMethod", params.paymentMethod);
    const q = sp.toString();
    return request(`/orders${q ? `?${q}` : ""}`);
  },
  getOrder: (id: string) => request(`/orders/${id}`),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  cancelOrder: (id: string) => request(`/orders/${id}/cancel`, { method: "POST" }),
  attachPaymentProof: (orderId: string, instaPayProofUrl: string) =>
    request(`/orders/${orderId}/payment-proof`, { method: "PATCH", body: JSON.stringify({ instaPayProofUrl }) }),
  confirmPayment: (orderId: string, approved: boolean) =>
    request(`/orders/${orderId}/payments/confirm`, { method: "POST", body: JSON.stringify({ approved }) }),

  getDashboardStats: (days?: number) =>
    request(`/dashboard/stats${days != null ? `?days=${days}` : ""}`),

  getSettings: () => request("/settings"),
  updateSettings: (payload: Partial<Settings>) =>
    request("/settings", { method: "PUT", body: JSON.stringify(payload) })
};
