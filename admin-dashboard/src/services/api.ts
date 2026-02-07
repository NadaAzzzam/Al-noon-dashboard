import i18n from "../i18n";

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
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  images?: string[];
  category?: { _id: string; name: string; isVisible?: boolean } | string;
  createdAt?: string;
};

export type Category = {
  _id: string;
  name: string;
  description?: string;
  isVisible?: boolean;
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "COD" | "INSTAPAY";
export type PaymentStatus = "UNPAID" | "PENDING_APPROVAL" | "PAID";

export type Order = {
  _id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  deliveryFee?: number;
  instaPayProof?: string;
  shippingAddress?: string;
  user?: { _id: string; name: string; email: string };
  items?: { product: { _id: string; name: string; price: number; discountPrice?: number }; quantity: number; price: number }[];
  createdAt: string;
};

export type DashboardStats = {
  totalOrders: number;
  ordersToday: number;
  revenue: number;
  lowStockCount: number;
  bestSellingProducts: { name: string; totalQty: number }[];
  ordersPerDay: { date: string; count: number }[];
};

export type Settings = {
  storeName?: string;
  logo?: string;
  deliveryFee?: number;
  instaPayNumber?: string;
  paymentMethods?: { cod: boolean; instaPay: boolean };
  lowStockThreshold?: number;
};

/** Thrown for any non-2xx API response. Includes optional code for i18n. */
export interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  declare public status: number;
  declare public body: ApiErrorBody | undefined;

  constructor(
    status: number,
    message: string,
    body?: ApiErrorBody
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** User-facing message: prefer FE translation by code if available, else server message. */
  getDisplayMessage(): string {
    const code = this.body?.code;
    if (code && typeof i18n.t(code) === "string" && i18n.t(code) !== code) {
      return i18n.t(code);
    }
    return this.message;
  }
}

const TOKEN_KEY = "al_noon_token";
const REFRESH_KEY = "al_noon_refresh";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

function setTokens(token: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

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

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { token: string };
    localStorage.setItem(TOKEN_KEY, data.token);
    return true;
  } catch {
    return false;
  }
}

const request = async (path: string, options: RequestInit = {}, skipRefresh = false): Promise<unknown> => {
  const doRequest = async (token: string | null): Promise<Response> => {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let token = getToken();
  let response = await doRequest(token);

  if (response.status === 401 && !skipRefresh && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = getToken();
      response = await doRequest(token);
    }
  }

  if (!response.ok) {
    const { message, body } = await parseErrorResponse(response);
    throw new ApiError(response.status, message, body as ApiErrorBody);
  }
  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  login: async (email: string, password: string) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }, true) as { token: string; refreshToken?: string; user: User };
    setTokens(data.token, data.refreshToken);
    return data;
  },
  logout: () =>
    request("/auth/logout", { method: "POST" }).then(() => clearAuth()).catch(() => clearAuth()),
  me: () => request("/auth/me") as Promise<{ user: User }>,
  refresh: () => request("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: getRefreshToken() }) }, true),

  listUsers: () => request("/users") as Promise<{ users: User[] }>,
  listProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    if (params?.category) q.set("category", params.category);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return request(`/products${query ? `?${query}` : ""}`) as Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }>;
  },
  getProduct: (id: string) => request(`/products/${id}`) as Promise<{ product: Product }>,
  createProduct: (payload: Partial<Product>) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setProductStatus: (id: string, status: "ACTIVE" | "INACTIVE") =>
    request(`/products/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateProductStock: (id: string, stock: number) =>
    request(`/products/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: "DELETE" }),
  getLowStockProducts: () => request("/products/low-stock") as Promise<{ products: Product[]; threshold: number }>,
  getOutOfStockProducts: () => request("/products/out-of-stock") as Promise<{ products: Product[] }>,

  listCategories: () => request("/categories") as Promise<{ categories: Category[] }>,
  createCategory: (payload: { name: string; description?: string; isVisible?: boolean }) =>
    request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: Partial<Category>) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setCategoryStatus: (id: string, isVisible: boolean) =>
    request(`/categories/${id}/status`, { method: "PATCH", body: JSON.stringify({ isVisible }) }),
  deleteCategory: (id: string) => request(`/categories/${id}`, { method: "DELETE" }),

  listOrders: (params?: { page?: number; limit?: number; status?: string; paymentMethod?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status) q.set("status", params.status);
    if (params?.paymentMethod) q.set("paymentMethod", params.paymentMethod);
    const query = q.toString();
    return request(`/orders${query ? `?${query}` : ""}`) as Promise<{ orders: Order[]; total: number; page: number; limit: number; totalPages: number }>;
  },
  getOrder: (id: string) => request(`/orders/${id}`) as Promise<{ order: Order }>,
  updateOrderStatus: (id: string, status: OrderStatus) =>
    request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateOrderPayment: (id: string, payload: { paymentStatus?: PaymentStatus; instaPayProof?: string }) =>
    request(`/orders/${id}/payment`, { method: "PATCH", body: JSON.stringify(payload) }),
  cancelOrder: (id: string) => request(`/orders/${id}/cancel`, { method: "POST" }),
  confirmPayment: (id: string) => request(`/orders/${id}/confirm-payment`, { method: "POST" }),

  getDashboardStats: () => request("/dashboard/stats") as Promise<{ totalOrders: number; ordersToday: number; revenue: number; lowStockCount: number; bestSellingProducts: { name: string; totalQty: number }[]; ordersPerDay: { date: string; count: number }[] }>,

  listCustomers: () => request("/customers") as Promise<{ customers: { id: string; name: string; email: string; createdAt: string }[] }>,
  getCustomer: (id: string) => request(`/customers/${id}`) as Promise<{ customer: { id: string; name: string; email: string; createdAt: string } }>,
  getCustomerOrders: (id: string) => request(`/customers/${id}/orders`) as Promise<{ orders: Order[] }>,

  getSettings: () => request("/settings") as Promise<{ settings: Settings }>,
  updateSettings: (payload: Partial<Settings>) =>
    request("/settings", { method: "PATCH", body: JSON.stringify(payload) })
};
