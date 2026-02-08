const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/** Base URL for static uploads (logos). Use with logo path: getUploadsBaseUrl() + settings.logo */
export function getUploadsBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (base && typeof base === "string") return base.replace(/\/api\/?$/, "");
  return window.location.origin;
}

/** Full URL for a product image. Supports relative paths (uploads) and absolute URLs (e.g. seeder/Unsplash). */
export function getProductImageUrl(path: string): string {
  if (!path) return "";
  return path.startsWith("http") ? path : getUploadsBaseUrl() + path;
}

/** Full URL for a product video (uploaded path or external URL). */
export function getProductVideoUrl(path: string): string {
  if (!path) return "";
  return path.startsWith("http") ? path : getUploadsBaseUrl() + path;
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export type LocalizedString = { en: string; ar: string };

export type Product = {
  _id: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  discountPrice?: number;
  images?: string[];
  /** Same length as images; imageColors[i] = color name for images[i]. "" = default (all colors). */
  imageColors?: string[];
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  /** When true, show in "New Arrivals" on the storefront. */
  isNewArrival?: boolean;
  sizes?: string[];
  /** Optional description per size (e.g. weight), same length as sizes. */
  sizeDescriptions?: string[];
  colors?: string[];
  /** Video paths (uploaded) or external URLs. Shown with images on product detail. */
  videos?: string[];
  /** Optional "Details" section (e.g. Fabric, Color, Style, Season). */
  details?: LocalizedString;
  /** Optional styling tip for storefront. */
  stylingTip?: LocalizedString;
  category?: { name: LocalizedString; status?: string } | string;
  /** Total quantity sold (CONFIRMED/SHIPPED/DELIVERED orders). Set by list products API. */
  soldQty?: number;
  /** Average rating (1–5) from approved feedback. Set by list products API. */
  averageRating?: number;
  /** Number of users who rated this product (approved feedback). Set by list products API. */
  ratingCount?: number;
};

/** Payload for create/update product (API accepts nameEn, nameAr, etc.) */
export type ProductPayload = {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category?: string;
  status?: "ACTIVE" | "INACTIVE";
  isNewArrival?: boolean;
  images?: string[];
  imageColors?: string[];
  videos?: string[];
  detailsEn?: string;
  detailsAr?: string;
  stylingTipEn?: string;
  stylingTipAr?: string;
  sizes?: string[];
  sizeDescriptions?: string[];
  colors?: string[];
};

export type Category = {
  _id: string;
  name: LocalizedString;
  description?: LocalizedString;
  status: "visible" | "hidden";
};

/** Payload for create/update category (API accepts nameEn, nameAr, etc.) */
export type CategoryPayload = {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  status?: "visible" | "hidden";
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type Order = {
  _id: string;
  status: OrderStatus;
  total: number;
  paymentMethod?: "COD" | "INSTAPAY";
  shippingAddress?: string;
  user?: { name: string; email: string };
  items?: { product: { name: LocalizedString; price: number; discountPrice?: number }; quantity: number; price: number }[];
  payment?: { method: string; status: string; instaPayProofUrl?: string };
  createdAt: string;
};

export type DashboardStats = {
  totalOrders: number;
  ordersToday: number;
  revenue: number;
  lowStockCount: number;
  bestSelling: { productId: string; name: LocalizedString; image?: string; totalQty: number }[];
  ordersPerDay: { _id: string; count: number; revenue: number }[];
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  pendingOrdersCount: number;
  outOfStockCount: number;
  orderStatusBreakdown: { status: string; count: number }[];
  revenueThisMonth: number;
  revenueLastMonth: number;
};

export type City = {
  _id: string;
  name: LocalizedString;
  deliveryFee: number;
  createdAt?: string;
  updatedAt?: string;
};

/** Payload for create/update city (API accepts nameEn, nameAr) */
export type CityPayload = { nameEn: string; nameAr: string; deliveryFee?: number };

export type QuickLink = { label: LocalizedString; url: string };

export type Settings = {
  storeName: LocalizedString;
  logo?: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  lowStockThreshold: number;
  googleAnalyticsId?: string;
  quickLinks?: QuickLink[];
  socialLinks?: { facebook?: string; instagram?: string };
  newsletterEnabled?: boolean;
  homeCollections?: HomeCollection[];
  hero?: HeroConfig;
  heroEnabled?: boolean;
  newArrivalsLimit?: number;
  newArrivalsSectionImages?: string[];
  newArrivalsSectionVideos?: string[];
  homeCollectionsDisplayLimit?: number;
  ourCollectionSectionImages?: string[];
  ourCollectionSectionVideos?: string[];
  announcementBar?: { text: LocalizedString; enabled: boolean; backgroundColor: string };
  promoBanner?: { enabled: boolean; image: string; title: LocalizedString; subtitle: LocalizedString; ctaLabel: LocalizedString; ctaUrl: string };
  featuredProductsEnabled?: boolean;
  featuredProductsLimit?: number;
  contentPages?: ContentPage[];
};

export type ContentPage = {
  slug: string;
  title: LocalizedString;
  content: LocalizedString;
};

export type HomeCollection = { title: LocalizedString; image: string; url: string; order: number };

export type HeroConfig = {
  images: string[];
  videos: string[];
  title: LocalizedString;
  subtitle: LocalizedString;
  ctaLabel: LocalizedString;
  ctaUrl: string;
};

/** Payload for update settings (API accepts storeNameEn, storeNameAr, etc.) */
export type SettingsPayload = Partial<{
  storeNameEn: string;
  storeNameAr: string;
  logo: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  lowStockThreshold: number;
  googleAnalyticsId: string;
  quickLinks: { labelEn: string; labelAr: string; url: string }[];
  socialLinks: { facebook: string; instagram: string };
  newsletterEnabled: boolean;
  homeCollections: { titleEn: string; titleAr: string; image: string; url: string; order: number }[];
  hero: { images: string[]; videos: string[]; titleEn: string; titleAr: string; subtitleEn: string; subtitleAr: string; ctaLabelEn: string; ctaLabelAr: string; ctaUrl: string };
  heroEnabled: boolean;
  newArrivalsLimit: number;
  newArrivalsSectionImages?: string[];
  newArrivalsSectionVideos?: string[];
  homeCollectionsDisplayLimit: number;
  ourCollectionSectionImages?: string[];
  ourCollectionSectionVideos?: string[];
  announcementBar?: { textEn: string; textAr: string; enabled: boolean; backgroundColor: string };
  promoBanner?: { enabled: boolean; image: string; titleEn: string; titleAr: string; subtitleEn: string; subtitleAr: string; ctaLabelEn: string; ctaLabelAr: string; ctaUrl: string };
  featuredProductsEnabled?: boolean;
  featuredProductsLimit?: number;
  feedbackSectionEnabled?: boolean;
  feedbackDisplayLimit?: number;
  contentPages: { slug: string; titleEn: string; titleAr: string; contentEn: string; contentAr: string }[];
}>;

/** Public store config for e-commerce (store name, logo, footer, newsletter, homepage collections). */
export type StoreConfig = {
  storeName: LocalizedString;
  logo: string;
  quickLinks: QuickLink[];
  socialLinks: { facebook: string; instagram: string };
  newsletterEnabled: boolean;
  homeCollections: HomeCollection[];
  hero: HeroConfig;
  heroEnabled: boolean;
  newArrivalsLimit: number;
  newArrivalsSectionImages?: string[];
  newArrivalsSectionVideos?: string[];
  homeCollectionsDisplayLimit: number;
  ourCollectionSectionImages?: string[];
  ourCollectionSectionVideos?: string[];
};

export type Subscriber = { email: string; createdAt: string };

export type ContactSubmission = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  comment: string;
  createdAt: string;
};

export type ProductFeedback = {
  _id: string;
  product: { _id: string; name: LocalizedString } | string;
  customerName: string;
  message: string;
  rating: number;
  image?: string;
  approved: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
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

const AUTH_TOKEN_KEY = "al_noon_token";
export const getToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);
export const setToken = (token: string) => sessionStorage.setItem(AUTH_TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(AUTH_TOKEN_KEY);

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
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
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
  /** POST /auth/sign-out – clear session (cookie + FE token) */
  signOut: () => request("/auth/sign-out", { method: "POST" }),

  listUsers: () => request("/users"),
  getCustomer: (id: string) => request(`/users/${id}`),
  getCustomerOrders: (id: string) => request(`/users/${id}/orders`),

  listProducts: (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string; newArrival?: boolean; sort?: string; minRating?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    if (params?.newArrival === true) sp.set("newArrival", "true");
    if (params?.category) sp.set("category", params.category);
    if (params?.sort) sp.set("sort", params.sort);
    if (params?.minRating != null) sp.set("minRating", String(params.minRating));
    const q = sp.toString();
    return request(`/products${q ? `?${q}` : ""}`);
  },
  getProduct: (id: string) => request(`/products/${id}`),
  getRelatedProducts: (id: string, limit?: number) =>
    request(`/products/${id}/related${limit != null ? `?limit=${limit}` : ""}`),
  createProduct: (payload: ProductPayload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<ProductPayload>) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  /** Upload product images; returns paths to use in product.images (max 10, 5MB each). */
  uploadProductImages: async (files: File[]): Promise<string[]> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    const response = await fetch(`${API_BASE}/products/images`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { paths: string[] };
    return data.paths ?? [];
  },
  /** Upload product videos; returns paths to use in product.videos (max 10, 100MB each). */
  uploadProductVideos: async (files: File[]): Promise<string[]> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    files.forEach((f) => formData.append("videos", f));
    const response = await fetch(`${API_BASE}/products/videos`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { paths: string[] };
    return data.paths ?? [];
  },
  setProductStatus: (id: string, status: "ACTIVE" | "INACTIVE") =>
    request(`/products/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateProductStock: (productId: string, stock: number) =>
    request(`/products/${productId}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: "DELETE" }),

  listCities: () => request("/cities"),
  getCity: (id: string) => request(`/cities/${id}`),
  createCity: (payload: CityPayload) =>
    request("/cities", { method: "POST", body: JSON.stringify(payload) }),
  updateCity: (id: string, payload: Partial<CityPayload>) =>
    request(`/cities/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCity: (id: string) => request(`/cities/${id}`, { method: "DELETE" }),

  listCategories: () => request("/categories"),
  createCategory: (payload: CategoryPayload) =>
    request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: Partial<CategoryPayload>) =>
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

  /** GET /dashboard/top-selling – top selling products for products page. */
  getTopSellingProducts: (limit?: number) =>
    request(`/dashboard/top-selling${limit != null ? `?limit=${limit}` : ""}`),

  getSettings: () => request("/settings"),
  updateSettings: (payload: SettingsPayload) =>
    request("/settings", { method: "PUT", body: JSON.stringify(payload) }),
  listSubscribers: (params?: { page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    const q = sp.toString();
    return request(`/subscribers${q ? `?${q}` : ""}`);
  },
  listContactSubmissions: (params?: { page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    const q = sp.toString();
    return request(`/contact${q ? `?${q}` : ""}`);
  },

  listFeedback: (params?: { page?: number; limit?: number; approved?: "true" | "false"; product?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.approved) sp.set("approved", params.approved);
    if (params?.product) sp.set("product", params.product);
    const q = sp.toString();
    return request(`/feedback${q ? `?${q}` : ""}`);
  },
  getFeedback: (id: string) => request(`/feedback/${id}`),
  createFeedback: (payload: { product: string; customerName: string; message: string; rating: number; image?: string; approved?: boolean; order?: number }) =>
    request("/feedback", { method: "POST", body: JSON.stringify(payload) }),
  updateFeedback: (id: string, payload: Partial<{ product: string; customerName: string; message: string; rating: number; image?: string; approved?: boolean; order?: number }>) =>
    request(`/feedback/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteFeedback: (id: string) => request(`/feedback/${id}`, { method: "DELETE" }),
  setFeedbackApproved: (id: string, approved: boolean) =>
    request(`/feedback/${id}/approve`, { method: "PATCH", body: JSON.stringify({ approved }) }),
  /** Upload feedback/screenshot image. Returns image path for use in create/update. */
  uploadFeedbackImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("image", file);
    const response = await fetch(`${API_BASE}/feedback/upload-image`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { image: string };
    return data.image ?? "";
  },

  /** Upload logo image file. Returns the logo path (e.g. /uploads/logos/logo-123.png). */
  uploadLogo: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("logo", file);
    const response = await fetch(`${API_BASE}/settings/logo`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { logo: string };
    return data.logo;
  },
  /** Upload collection image for homepage. Returns image path (e.g. /uploads/collections/...). */
  uploadCollectionImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("image", file);
    const response = await fetch(`${API_BASE}/settings/collection-image`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { image: string };
    return data.image;
  },
  /** Upload hero image for storefront. Returns image path (e.g. /uploads/hero/...). */
  uploadHeroImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("image", file);
    const response = await fetch(`${API_BASE}/settings/hero-image`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { image: string };
    return data.image;
  },
  /** Upload section image (New Arrivals or Our Collection banner). Returns image path. */
  uploadSectionImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("image", file);
    const response = await fetch(`${API_BASE}/settings/section-image`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { image: string };
    return data.image;
  },
  /** Upload hero video. Returns video path. */
  uploadHeroVideo: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("video", file);
    const response = await fetch(`${API_BASE}/settings/hero-video`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { video: string };
    return data.video;
  },
  /** Upload section video (New Arrivals or Our Collection). Returns video path. */
  uploadSectionVideo: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("video", file);
    const response = await fetch(`${API_BASE}/settings/section-video`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { video: string };
    return data.video;
  },
  /** Upload promotional banner image. Returns image path. */
  uploadPromoImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("image", file);
    const response = await fetch(`${API_BASE}/settings/promo-image`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message } = await parseErrorResponse(response);
      throw new ApiError(response.status, message);
    }
    const data = (await response.json()) as { image: string };
    return data.image;
  }
};
