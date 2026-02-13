const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/** Default logo path used when no custom logo is set (storefront always shows this). */
export const DEFAULT_LOGO_PATH = "/uploads/logos/default-logo.png";

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
  avatar?: string;
  createdAt?: string;
};

export type LocalizedString = { en: string; ar: string };

/** Must match backend: newest | priceAsc | priceDesc | nameAsc | nameDesc | bestSelling | highestSelling | lowSelling */
export type ProductSort =
  | "newest"
  | "priceAsc"
  | "priceDesc"
  | "nameAsc"
  | "nameDesc"
  | "bestSelling"
  | "highestSelling"
  | "lowSelling";

/** Stock filter for list products: all | inStock | outOfStock */
export type ProductAvailability = "all" | "inStock" | "outOfStock";

/** Per-color info in single product response (GET /products/:id). Indicates if color has a dedicated image. */
export type ProductColorAvailability = {
  color: string;
  available: boolean;
  outOfStock: boolean;
  /** Number of sizes in stock for this color. When variants is empty, equals product.sizes.length. */
  availableSizeCount?: number;
  /** True when at least one product image is linked to this color via imageColors[]. */
  hasImage?: boolean;
  /** First image URL for this color when hasImage is true. Use for color swatch thumbnails. */
  imageUrl?: string;
};

/** Availability block on single product response (GET /products/:id). */
export type ProductAvailabilityDetail = {
  /** Total number of sizes that are available (in stock) for this product. */
  availableSizeCount?: number;
  colors: ProductColorAvailability[];
  sizes: Array<{ size: string; available: boolean; outOfStock: boolean }>;
  variants: Array<{ color?: string; size?: string; stock: number; outOfStock: boolean }>;
};

/** Handled query params returned by list products API */
export type ProductListAppliedFilters = {
  sort: ProductSort;
  availability: ProductAvailability;
  categoryId?: string;
  categoryName?: LocalizedString;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  newArrival?: boolean;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  minRating?: number;
};

/** Option for E-commerce filter dropdowns (from GET /api/products/filters/availability and /filters/sort) */
export type ProductFilterOption = { value: string; labelEn: string; labelAr: string };

/** Single media asset in product.media (image | video | gif). */
export type ProductMediaItem = { type: "image" | "video" | "gif"; url: string; alt?: string; durationSeconds?: number };
/** Product media: default (required), optional hover, optional previewVideo. */
export type ProductMedia = {
  default: ProductMediaItem;
  hover?: ProductMediaItem;
  previewVideo?: ProductMediaItem;
};

export type Product = {
  _id: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  discountPrice?: number;
  images?: string[];
  /** Structured media: default, hover, previewVideo (API response only). */
  media?: ProductMedia;
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
  /** Preferred media type for default display on product cards ("image" or "video"). */
  defaultMediaType?: "image" | "video";
  /** Preferred media type for hover display on product cards ("image" or "video"). */
  hoverMediaType?: "image" | "video";
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
  /** Present on GET /products/:id. Colors include hasImage/imageUrl when product has color-specific images. */
  availability?: ProductAvailabilityDetail;
};

/** Default image URL for a product (media.default.url or first image). */
export function getProductDefaultImageUrl(product: Product): string {
  return product.media?.default?.url ?? product.images?.[0] ?? "";
}

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
  viewImage?: string;
  hoverImage?: string;
  imageColors?: string[];
  videos?: string[];
  defaultMediaType?: "image" | "video";
  hoverMediaType?: "image" | "video";
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
  /** Delivery/shipping fee in EGP. */
  deliveryFee?: number;
  paymentMethod?: "COD" | "INSTAPAY";
  shippingAddress?: string;
  user?: { name: string; email: string };
  items?: { product: { name: LocalizedString; price: number; discountPrice?: number; images?: string[] }; quantity: number; price: number }[];
  payment?: { method: string; status: string; instaPayProofUrl?: string };
  createdAt: string;
  updatedAt?: string;
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

/** Per-city delivery price (city may be populated with name) */
export type ShippingMethodCityPrice = {
  city: string | { _id: string; name?: LocalizedString };
  price: number;
};

export type ShippingMethod = {
  _id: string;
  name: LocalizedString;
  description: LocalizedString;
  estimatedDays: { min: number; max: number };
  price: number;
  /** Optional per-city delivery prices. When set, storefront can use ?cityId= to get resolved price. */
  cityPrices?: ShippingMethodCityPrice[];
  enabled: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

/** Payload for create/update shipping method (API accepts cityPrices: [{ city: ObjectId, price }]) */
export type ShippingMethodPayload = {
  name: LocalizedString;
  description: LocalizedString;
  estimatedDays: { min: number; max: number };
  price: number;
  cityPrices?: { city: string; price: number }[];
  enabled?: boolean;
  order?: number;
};

export type QuickLink = { label: LocalizedString; url: string };

export type Settings = {
  storeName: LocalizedString;
  logo?: string;
  instaPayNumber: string;
  paymentMethods: { cod: boolean; instaPay: boolean };
  /** Low stock alert threshold. Fallback when BE does not send: 5. */
  lowStockThreshold: number;
  /** Show exact stock when stock ≤ this (e.g. "Only 3 left"). Fallback when BE does not send: 10. */
  stockInfoThreshold?: number;
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
  orderNotificationsEnabled?: boolean;
  orderNotificationEmail?: string;
  /** Currency code (e.g. EGP) from settings API; used for price display. */
  currency?: string;
  /** Currency symbol/prefix (e.g. LE) from settings API; used for price display. */
  currencySymbol?: string;
  advancedSettings?: {
    currency?: string;
    currencySymbol?: string;
    defaultDeliveryFee?: number;
    productsPerPage?: number;
    catalogPaginationLimit?: number;
  };
  aiAssistant?: {
    enabled: boolean;
    geminiApiKey: string;
    greeting: LocalizedString;
    systemPrompt: string;
    suggestedQuestions: LocalizedString[];
  };
};

export type ContentPage = {
  slug: string;
  title: LocalizedString;
  content: LocalizedString;
};

export type HomeCollection = { title: LocalizedString; image: string; video?: string; url: string; order: number };

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
  stockInfoThreshold: number;
  googleAnalyticsId: string;
  quickLinks: { labelEn: string; labelAr: string; url: string }[];
  socialLinks: { facebook: string; instagram: string };
  newsletterEnabled: boolean;
  homeCollections: { titleEn: string; titleAr: string; image: string; video?: string; url: string; order: number }[];
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
  orderNotificationsEnabled?: boolean;
  orderNotificationEmail?: string;
  currency?: string;
  currencySymbol?: string;
  aiAssistant?: {
    enabled?: boolean;
    geminiApiKey?: string;
    greetingEn?: string;
    greetingAr?: string;
    systemPrompt?: string;
    suggestedQuestions?: { en: string; ar: string }[];
  };
}>;

/** Unified home page data for e-commerce storefront (GET /api/store/home). Contains all sections in a single response. */
export type StoreHomeData = {
  store: {
    storeName: LocalizedString;
    logo: string;
    quickLinks: QuickLink[];
    socialLinks: { facebook: string; instagram: string };
    newsletterEnabled: boolean;
  };
  hero: HeroConfig;
  heroEnabled: boolean;
  newArrivalsLimit: number;
  newArrivals: Pick<Product, '_id' | 'name' | 'description' | 'price' | 'discountPrice' | 'media' | 'sizes' | 'colors'>[];
  newArrivalsSectionImages: string[];
  newArrivalsSectionVideos: string[];
  homeCollections: HomeCollection[];
  homeCollectionsDisplayLimit: number;
  ourCollectionSectionImages: string[];
  ourCollectionSectionVideos: string[];
  feedbackSectionEnabled: boolean;
  feedbackDisplayLimit: number;
  feedbacks: { product: { name: LocalizedString }; customerName: string; message: string; rating: number; image?: string }[];
  announcementBar: { text: LocalizedString; enabled: boolean; backgroundColor: string };
  promoBanner: { enabled: boolean; image: string; title: LocalizedString; subtitle: LocalizedString; ctaLabel: LocalizedString; ctaUrl: string };
};

/** @deprecated Use StoreHomeData instead. This type is kept for backward compatibility but will be removed. */
export type StoreConfig = StoreHomeData;

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

export type ReportsTab = "sales" | "orders" | "products" | "customers";

export type SalesReportData = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalDeliveryFees: number;
  revenueOverTime: { _id: string; revenue: number }[];
  ordersOverTime: { _id: string; count: number }[];
  revenueByPaymentMethod: { _id: string; revenue: number; count: number }[];
  revenueByCategory: { _id: string; categoryName?: LocalizedString; revenue: number }[];
};

export type OrdersReportData = {
  totalOrders: number;
  cancellationRate: number;
  avgProcessingDays: number;
  statusBreakdown: { status: string; count: number }[];
  ordersByPaymentMethod: { _id: string; count: number; revenue: number }[];
  topOrders: { _id: string; total: number; status: string; paymentMethod?: string; user?: { name: string; email: string }; createdAt: string }[];
};

export type ProductsReportData = {
  bestSelling: { _id: string; name: LocalizedString; image?: string; price?: number; totalQty: number; totalRevenue: number }[];
  worstSelling: { _id: string; name: LocalizedString; image?: string; totalQty: number; totalRevenue: number }[];
  productsByCategory: { _id: string; categoryName?: LocalizedString; count: number }[];
  lowStockItems: { _id: string; name: LocalizedString; image?: string; stock: number; price: number }[];
  topRated: { _id: string; name: LocalizedString; image?: string; avgRating: number; ratingCount: number }[];
};

export type CustomersReportData = {
  newCustomersCount: number;
  repeatCustomers: number;
  newCustomersInPeriod: number;
  avgLifetimeValue: number;
  newCustomersOverTime: { _id: string; count: number }[];
  topCustomers: { _id: string; name: string; email: string; totalSpent: number; orderCount: number }[];
  orderFrequency: { orders: number; customers: number }[];
};

/** Thrown for any non-2xx API response. Backend sends { success: false, message, code, data: null }. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Current UI language for API (Accept-Language / x-language). */
function getApiLocale(): string {
  if (typeof localStorage === "undefined") return "en";
  return localStorage.getItem("al_noon_lang") === "ar" ? "ar" : "en";
}

const AUTH_TOKEN_KEY = "al_noon_token";
export const getToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);
export const setToken = (token: string) => sessionStorage.setItem(AUTH_TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(AUTH_TOKEN_KEY);

async function parseErrorResponse(response: Response): Promise<{ message: string; body?: unknown; code?: string }> {
  const text = await response.text();
  let message = response.statusText || "Request failed";
  let body: unknown;
  let code: string | undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
    if (body && typeof body === "object") {
      const b = body as { message?: string; code?: string };
      if (typeof b.message === "string") message = b.message;
      if (typeof b.code === "string") code = b.code;
    }
  } catch {
    if (text) message = text;
  }
  if (response.status === 401) message = message || "Unauthorized";
  if (response.status === 403) message = message || "Forbidden";
  if (response.status === 404) message = message || "Not found";
  if (response.status >= 500) message = message || "Server error";
  return { message, body, code };
}

/** Backend success shape: { success: true, data?, message?, pagination? }. We return the full body so callers use body.data / body.pagination. */
const request = async (path: string, options: RequestInit = {}): Promise<unknown> => {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept-Language", getApiLocale());
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new ApiError(0, `Cannot reach server. ${msg}`);
  }

  if (!response.ok) {
    const { message, body, code } = await parseErrorResponse(response);
    throw new ApiError(response.status, message, body, code);
  }
  if (response.status === 204) return null;
  const body = (await response.json()) as { success?: boolean; data?: unknown; message?: string; pagination?: unknown };
  return body;
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

  listProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    newArrival?: boolean;
    availability?: ProductAvailability;
    sort?: ProductSort;
    minPrice?: number;
    maxPrice?: number;
    color?: string;
    minRating?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    if (params?.newArrival === true) sp.set("newArrival", "true");
    if (params?.category) sp.set("category", params.category);
    if (params?.availability && params.availability !== "all") sp.set("availability", params.availability);
    if (params?.sort) sp.set("sort", params.sort);
    if (params?.minPrice != null) sp.set("minPrice", String(params.minPrice));
    if (params?.maxPrice != null) sp.set("maxPrice", String(params.maxPrice));
    if (params?.color) sp.set("color", params.color);
    if (params?.minRating != null) sp.set("minRating", String(params.minRating));
    const q = sp.toString();
    return request(`/products${q ? `?${q}` : ""}`) as Promise<{
      data: Product[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
      appliedFilters?: ProductListAppliedFilters;
    }>;
  },
  /** GET /api/products/filters/availability – options for E-commerce availability dropdown */
  getAvailabilityFilters: () =>
    request("/products/filters/availability") as Promise<{ data: ProductFilterOption[] }>,
  /** GET /api/products/filters/sort – options for E-commerce sort dropdown */
  getSortFilters: () =>
    request("/products/filters/sort") as Promise<{ data: ProductFilterOption[] }>,
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
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const body = (await response.json()) as { data?: { paths?: string[] }; paths?: string[] };
    const data = body?.data ?? body;
    return data?.paths ?? [];
  },
  /** Upload product videos; returns paths to use in product.videos (max 10, 100MB each). */
  uploadProductVideos: async (files: File[]): Promise<string[]> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const resBody = (await response.json()) as { data?: { paths?: string[] }; paths?: string[] };
    const data = resBody?.data ?? resBody;
    return data?.paths ?? [];
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

  listShippingMethods: (includeDisabled?: boolean, cityId?: string) => {
    const params = new URLSearchParams();
    if (includeDisabled) params.set("includeDisabled", "true");
    if (cityId) params.set("cityId", cityId);
    const q = params.toString();
    return request(`/shipping-methods${q ? `?${q}` : ""}`);
  },
  getShippingMethod: (id: string) => request(`/shipping-methods/${id}`),
  createShippingMethod: (payload: ShippingMethodPayload) =>
    request("/shipping-methods", { method: "POST", body: JSON.stringify(payload) }),
  updateShippingMethod: (id: string, payload: Partial<ShippingMethodPayload>) =>
    request(`/shipping-methods/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteShippingMethod: (id: string) => request(`/shipping-methods/${id}`, { method: "DELETE" }),
  toggleShippingMethod: (id: string) =>
    request(`/shipping-methods/${id}/toggle`, { method: "PATCH" }),

  /** Public: get enabled payment methods for e-commerce (COD, InstaPay from settings). */
  getPaymentMethods: () => request("/payment-methods"),

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
  /** Upload InstaPay proof file (image or PDF). Attaches proof to the order payment. */
  attachPaymentProof: async (orderId: string, file: File): Promise<void> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const formData = new FormData();
    formData.set("proof", file);
    const response = await fetch(`${API_BASE}/orders/${orderId}/payment-proof`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    if (!response.ok) {
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
  },
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
  /** Send a test order notification email to the configured admin/notification address. */
  sendTestOrderEmail: () => request("/settings/test-order-email", { method: "POST" }),

  /** AI chat sessions (admin). */
  listAiSessions: (params?: { page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    const q = sp.toString();
    return request(`/ai/sessions${q ? `?${q}` : ""}`);
  },
  getAiSession: (id: string) => request(`/ai/sessions/${id}`),
  deleteAiSession: (id: string) => request(`/ai/sessions/${id}`, { method: "DELETE" }),

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
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const body = (await response.json()) as { data?: { image?: string }; image?: string };
    const data = body?.data ?? body;
    return data?.image ?? "";
  },

  /** Upload logo image file. Returns the logo path (e.g. /uploads/logos/logo-123.png). */
  uploadLogo: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const body = (await response.json()) as { data?: { logo?: string }; logo?: string };
    const data = body?.data ?? body;
    return data?.logo ?? "";
  },
  /** Upload collection image for homepage. Returns image path (e.g. /uploads/collections/...). */
  uploadCollectionImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const resBody = (await response.json()) as { data?: { image?: string }; image?: string };
    const data = resBody?.data ?? resBody;
    return data?.image ?? "";
  },
  /** Upload hero image for storefront. Returns image path (e.g. /uploads/hero/...). */
  uploadHeroImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const resBody = (await response.json()) as { data?: { image?: string }; image?: string };
    const data = resBody?.data ?? resBody;
    return data?.image ?? "";
  },
  /** Upload section image (New Arrivals or Our Collection banner). Returns image path. */
  uploadSectionImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const resBody = (await response.json()) as { data?: { image?: string }; image?: string };
    const data = resBody?.data ?? resBody;
    return data?.image ?? "";
  },
  /** Upload hero video. Returns video path. */
  uploadHeroVideo: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const resBody = (await response.json()) as { data?: { video?: string }; video?: string };
    const data = resBody?.data ?? resBody;
    return data?.video ?? "";
  },
  /** Upload section video (New Arrivals or Our Collection). Returns video path. */
  uploadSectionVideo: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const resBody = (await response.json()) as { data?: { video?: string }; video?: string };
    const data = resBody?.data ?? resBody;
    return data?.video ?? "";
  },
  getReports: (params: { tab: ReportsTab; startDate?: string; endDate?: string; status?: string; paymentMethod?: string; category?: string }) => {
    const sp = new URLSearchParams();
    sp.set("tab", params.tab);
    if (params.startDate) sp.set("startDate", params.startDate);
    if (params.endDate) sp.set("endDate", params.endDate);
    if (params.status) sp.set("status", params.status);
    if (params.paymentMethod) sp.set("paymentMethod", params.paymentMethod);
    if (params.category) sp.set("category", params.category);
    return request(`/reports?${sp.toString()}`);
  },

  /** Upload promotional banner image. Returns image path. */
  uploadPromoImage: async (file: File): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
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
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }
    const resBody = (await response.json()) as { data?: { image?: string }; image?: string };
    const data = resBody?.data ?? resBody;
    return data?.image ?? "";
  },

  /**
   * Unified home page media upload endpoint.
   * Uploads image or video for home page settings based on media type.
   * @param file - The image or video file to upload
   * @param mediaType - The type of media: 'hero' | 'section' | 'collection' | 'promo'
   * @returns The uploaded file path
   */
  uploadHomePageMedia: async (file: File, mediaType: 'hero' | 'section' | 'collection' | 'promo' = 'section'): Promise<string> => {
    const token = getToken();
    const headers = new Headers();
    headers.set("Accept-Language", getApiLocale());
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const formData = new FormData();
    formData.set("file", file);

    const isVideo = file.type.startsWith('video/');
    const response = await fetch(`${API_BASE}/settings/upload-media?type=${mediaType}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });

    if (!response.ok) {
      const { message, body, code } = await parseErrorResponse(response);
      throw new ApiError(response.status, message, body, code);
    }

    const resBody = (await response.json()) as {
      data?: { image?: string; video?: string };
      image?: string;
      video?: string;
    };
    const data = resBody?.data ?? resBody;
    return isVideo ? (data?.video ?? "") : (data?.image ?? "");
  }
};
