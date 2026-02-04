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
  stock: number;
  status: "ACTIVE" | "DRAFT";
  category?: { name: string } | string;
};

export type Order = {
  _id: string;
  status: "PENDING" | "PAID" | "SHIPPED";
  total: number;
  user?: { name: string; email: string };
  createdAt: string;
};

export const getToken = () => localStorage.getItem("al_noon_token");

const request = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(payload.message ?? "Request failed");
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

export const api = {
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),
  listUsers: () => request("/users"),
  listProducts: () => request("/products"),
  createProduct: (payload: Partial<Product>) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: "DELETE" }),
  listOrders: () => request("/orders"),
  updateOrderStatus: (id: string, status: Order["status"]) =>
    request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })
};
