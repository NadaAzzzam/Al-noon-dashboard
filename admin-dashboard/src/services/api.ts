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

/** Thrown for any non-2xx API response. Includes status and server message. */
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
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

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
