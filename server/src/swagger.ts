import { env } from "./config/env.js";

const port = env.port;
const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

const jsonContent = (schema: object) => ({ content: { "application/json": { schema } } });
const refSchema = (name: string) => jsonContent({ $ref: `#/components/schemas/${name}` });
const errDesc = (description: string) => ({ description, ...jsonContent({ $ref: "#/components/schemas/ApiError" }) });

/** Build paths as a flat object so JSON serialization never nests path keys under the first path */
function buildPaths() {
  const paths: Record<string, unknown> = {};

  paths["/api/health"] = {
    get: {
      operationId: "healthCheck",
      tags: ["Health"],
      summary: "Health check",
      responses: {
        "200": { description: "OK", ...refSchema("Health") },
      },
    },
  };

  // --- Store (public) ---
  paths["/api/store"] = {
    get: {
      operationId: "getStore",
      tags: ["Store"],
      summary: "Get store config (name, logo, links, hero, collections, newsletter flag)",
      responses: {
        "200": { description: "Store settings for storefront", ...refSchema("StoreResponse") },
      },
    },
  };

  paths["/api/store/page/{slug}"] = {
    get: {
      operationId: "getPageBySlug",
      tags: ["Store"],
      summary: "Get footer page content by slug (privacy, return-policy, shipping-policy, about, contact)",
      parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Page content (rich text)", ...refSchema("PageResponse") },
        "404": errDesc("Page not found"),
      },
    },
  };

  paths["/api/store/contact"] = {
    post: {
      operationId: "submitStoreContact",
      tags: ["Store"],
      summary: "Submit Contact Us form (public)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                phone: { type: "string" },
                comment: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Submitted", ...refSchema("MessageDataResponse") },
        "400": errDesc("Validation error"),
      },
    },
  };

  // --- Newsletter ---
  paths["/api/newsletter/subscribe"] = {
    post: {
      operationId: "subscribeNewsletter",
      tags: ["Newsletter"],
      summary: "Subscribe email to newsletter (public)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } },
          },
        },
      },
      responses: {
        "201": { description: "Subscribed", ...refSchema("MessageDataResponse") },
        "400": errDesc("Validation error"),
        "409": { description: "Email already subscribed", ...refSchema("NewsletterConflictResponse") },
      },
    },
  };

  // --- Auth ---
  paths["/api/auth/sign-in"] = {
    post: {
      operationId: "signIn",
      tags: ["Auth"],
      summary: "Sign in",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
            },
          },
        },
      },
      responses: {
        "200": { description: "Success; sets cookie and returns token and user", ...refSchema("AuthResponse") },
        "401": errDesc("Invalid credentials"),
      },
    },
  };

  paths["/api/auth/sign-up"] = {
    post: {
      operationId: "signUp",
      tags: ["Auth"],
      summary: "Register",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password", "name"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string" },
                name: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Created; sets cookie and returns token and user", ...refSchema("AuthResponse") },
        "400": errDesc("Validation error"),
        "409": errDesc("User already exists"),
      },
    },
  };

  paths["/api/auth/profile"] = {
    get: {
      operationId: "getProfile",
      tags: ["Auth"],
      summary: "Current user profile",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "User profile", ...refSchema("ProfileResponse") },
        "401": errDesc("Unauthorized"),
      },
    },
  };

  paths["/api/auth/sign-out"] = {
    post: {
      operationId: "signOut",
      tags: ["Auth"],
      summary: "Sign out",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Signed out", ...refSchema("SignOutResponse") },
        "401": errDesc("Unauthorized"),
      },
    },
  };

  // --- Subscribers (Admin) ---
  paths["/api/subscribers"] = {
    get: {
      operationId: "listSubscribers",
      tags: ["Subscribers"],
      summary: "List newsletter subscribers (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
      responses: {
        "200": { description: "Paginated subscribers", ...refSchema("PaginatedSubscribersResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  // --- Products (data shape: components/schemas/ProductData) ---
  paths["/api/products"] = {
    get: {
      operationId: "listProducts",
      tags: ["Products"],
      summary: "List products",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" }, description: "Page number (default 1)" },
        { name: "limit", in: "query", schema: { type: "integer" }, description: "Items per page (default 20, max 100)" },
        { name: "category", in: "query", schema: { type: "string" }, description: "Category ID filter" },
        { name: "search", in: "query", schema: { type: "string" }, description: "Search in name/description" },
        { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] }, description: "Product status (storefront uses ACTIVE)" },
        { name: "newArrival", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Filter by new-arrival flag (home page uses true)" },
        { name: "availability", in: "query", schema: { type: "string", enum: ["all", "inStock", "outOfStock"], default: "all" }, description: "Stock filter. Get options with labels: GET /api/products/filters/availability" },
        { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "priceAsc", "priceDesc", "nameAsc", "nameDesc", "bestSelling", "highestSelling", "lowSelling"], default: "newest" }, description: "Sort order. Get options with labels: GET /api/products/filters/sort" },
        { name: "minPrice", in: "query", schema: { type: "number" }, description: "Min price (EGP)" },
        { name: "maxPrice", in: "query", schema: { type: "number" }, description: "Max price (EGP)" },
        { name: "color", in: "query", schema: { type: "string" }, description: "Filter by color (case-insensitive)" },
        { name: "minRating", in: "query", schema: { type: "number", minimum: 1, maximum: 5 }, description: "Only products with average rating >= this (1–5)" },
      ],
      responses: {
        "200": { description: "Products list: success, data (array), pagination", ...refSchema("PaginatedProductsResponse") },
        "400": errDesc("Validation error"),
      },
    },
    post: {
      operationId: "createProduct",
      tags: ["Products"],
      summary: "Create product (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "201": { description: "Created product", ...refSchema("ProductResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "400": errDesc("Validation error"),
      },
    },
  };

  paths["/api/products/filters/availability"] = {
    get: {
      operationId: "getAvailabilityFilters",
      tags: ["Products", "E-commerce filters"],
      summary: "Get availability filter options",
      description: "Returns options for the E-commerce availability dropdown. Each item has value (use in GET /api/products?availability=), labelEn and labelAr for UI. No auth required.",
      responses: {
        "200": {
          description: "List of availability options (all, inStock, outOfStock) with value and labels",
          ...refSchema("AvailabilityFiltersResponse"),
        },
      },
    },
  };

  paths["/api/products/filters/sort"] = {
    get: {
      operationId: "getSortFilters",
      tags: ["Products", "E-commerce filters"],
      summary: "Get sort filter options",
      description: "Returns options for the E-commerce sort dropdown. Each item has value (use in GET /api/products?sort=), labelEn and labelAr for UI. No auth required.",
      responses: {
        "200": {
          description: "List of sort options (newest, priceAsc, priceDesc, nameAsc, nameDesc, bestSelling, highestSelling, lowSelling) with value and labels",
          ...refSchema("SortFiltersResponse"),
        },
      },
    },
  };

  paths["/api/products/{id}"] = {
    get: {
      operationId: "getProduct",
      tags: ["Products"],
      summary: "Get product by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Product", ...refSchema("ProductResponse") },
        "404": errDesc("Not found"),
      },
    },
    put: {
      operationId: "updateProduct",
      tags: ["Products"],
      summary: "Update product (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "200": { description: "Updated product", ...refSchema("ProductResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
    delete: {
      operationId: "deleteProduct",
      tags: ["Products"],
      summary: "Delete product (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Deleted", ...refSchema("MessageDataResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/products/{id}/related"] = {
    get: {
      operationId: "getRelatedProducts",
      tags: ["Products"],
      summary: "Get related products",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Related products list", ...refSchema("RelatedProductsResponse") },
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/products/{id}/status"] = {
    patch: {
      operationId: "setProductStatus",
      tags: ["Products"],
      summary: "Set product status DRAFT/PUBLISHED (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["DRAFT", "PUBLISHED"] } } },
          },
        },
      },
      responses: {
        "200": { description: "Status updated", ...refSchema("ProductResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/products/{id}/stock"] = {
    patch: {
      operationId: "updateProductStock",
      tags: ["Products"],
      summary: "Update product stock (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: { type: "object", required: ["stock"], properties: { stock: { type: "integer" } } },
          },
        },
      },
      responses: {
        "200": { description: "Stock updated", ...refSchema("ProductResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/products/images"] = {
    post: {
      operationId: "uploadProductImages",
      tags: ["Products"],
      summary: "Upload product images (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: { "multipart/form-data": { schema: { type: "object", properties: { images: { type: "array", items: { type: "string", format: "binary" } } } } } },
      },
      responses: {
        "200": { description: "Uploaded image URLs", ...refSchema("UploadUrlsResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/products/videos"] = {
    post: {
      operationId: "uploadProductVideos",
      tags: ["Products"],
      summary: "Upload product videos (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: { "multipart/form-data": { schema: { type: "object", properties: { videos: { type: "array", items: { type: "string", format: "binary" } } } } } },
      },
      responses: {
        "200": { description: "Uploaded video URLs", ...refSchema("UploadUrlsResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  // --- Categories ---
  const categoryItemSchema = {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
      slug: { type: "string" },
      status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      order: { type: "integer" },
    },
  };

  paths["/api/categories"] = {
    get: {
      operationId: "listCategories",
      tags: ["Categories"],
      summary: "List categories (optionally filter by status; store may use status=PUBLISHED for visible)",
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: ["visible", "hidden", "PUBLISHED"] }, description: "Filter by status; PUBLISHED is alias for visible" },
      ],
      responses: {
        "200": { description: "Categories list (each category includes status)", ...refSchema("CategoriesResponse") },
      },
    },
    post: {
      operationId: "createCategory",
      tags: ["Categories"],
      summary: "Create category (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "201": { description: "Created category", ...refSchema("CategoryResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/categories/{id}"] = {
    put: {
      operationId: "updateCategory",
      tags: ["Categories"],
      summary: "Update category (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "200": { description: "Updated category", ...refSchema("CategoryResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
    patch: {
      operationId: "setCategoryStatus",
      tags: ["Categories"],
      summary: "Set category status (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["DRAFT", "PUBLISHED"] } } },
          },
        },
      },
      responses: {
        "200": { description: "Status updated", ...refSchema("CategoryResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
    delete: {
      operationId: "deleteCategory",
      tags: ["Categories"],
      summary: "Delete category (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Deleted", ...refSchema("MessageDataResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  // --- Orders ---
  const orderItemSchema = {
    type: "object",
    properties: {
      _id: { type: "string" },
      orderNumber: { type: "string" },
      status: { type: "string" },
      items: { type: "array", items: { type: "object" } },
      total: { type: "number" },
      customer: { type: "object" },
      shippingAddress: { type: "object" },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  paths["/api/orders"] = {
    get: {
      operationId: "listOrders",
      tags: ["Orders"],
      summary: "List orders",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" }, description: "Page (default 1)" },
        { name: "limit", in: "query", schema: { type: "integer" }, description: "Limit (default 20, max 100)" },
        { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] } },
        { name: "paymentMethod", in: "query", schema: { type: "string", enum: ["COD", "INSTAPAY"] } },
      ],
      responses: {
        "200": { description: "Success, data (array of orders), pagination", ...refSchema("PaginatedOrdersResponse") },
        "401": errDesc("Unauthorized"),
      },
    },
    post: {
      operationId: "createOrder",
      tags: ["Orders"],
      summary: "Create order (authenticated or guest checkout)",
      security: [],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["items"],
              properties: {
                items: { type: "array", items: { type: "object", properties: { product: { type: "string" }, quantity: { type: "integer" }, price: { type: "number" } } } },
                paymentMethod: { type: "string", enum: ["COD", "INSTAPAY"] },
                shippingAddress: { type: "string" },
                deliveryFee: { type: "number" },
                guestName: { type: "string", description: "Required for guest checkout" },
                guestEmail: { type: "string", format: "email", description: "Required for guest checkout" },
                guestPhone: { type: "string", description: "Optional for guest checkout" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Success, message, data.order (includes guestName/guestEmail/guestPhone when guest)", ...refSchema("OrderResponse") },
        "400": errDesc("Validation error (e.g. guest checkout requires guestName and guestEmail)"),
      },
    },
  };

  paths["/api/orders/{id}"] = {
    get: {
      operationId: "getOrder",
      tags: ["Orders"],
      summary: "Get order by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Success, data.order (with payment; guest orders include guest fields)", ...refSchema("OrderResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/orders/{id}/status"] = {
    patch: {
      operationId: "updateOrderStatus",
      tags: ["Orders"],
      summary: "Update order status (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: { type: "object", required: ["status"], properties: { status: { type: "string" } } },
          },
        },
      },
      responses: {
        "200": { description: "Status updated", ...refSchema("OrderResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/orders/{id}/cancel"] = {
    post: {
      operationId: "cancelOrder",
      tags: ["Orders"],
      summary: "Cancel order (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": {
          description: "Order cancelled", ...refSchema("OrderResponse")
        },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/orders/{id}/payment-proof"] = {
    post: {
      operationId: "attachPaymentProof",
      tags: ["Orders"],
      summary: "Upload payment proof for order (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": {
          description: "Proof attached", ...refSchema("OrderResponse")
        },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/orders/{id}/payments/confirm"] = {
    post: {
      operationId: "confirmPayment",
      tags: ["Orders"],
      summary: "Confirm payment for order (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: { type: "object", required: ["confirmed"], properties: { confirmed: { type: "boolean" } } },
          },
        },
      },
      responses: {
        "200": { description: "Payment confirmed", ...refSchema("OrderResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  // --- Users (Admin) ---
  const userItemSchema = {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "string" },
      email: { type: "string" },
      role: { type: "string", enum: ["ADMIN", "USER"] },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  paths["/api/users"] = {
    get: {
      operationId: "listUsers",
      tags: ["Users"],
      summary: "List users (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
      responses: {
        "200": { description: "Paginated users", ...refSchema("PaginatedUsersResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/users/{id}"] = {
    get: {
      operationId: "getCustomer",
      tags: ["Users"],
      summary: "Get customer by ID (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Customer", ...refSchema("CustomerResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/users/{id}/orders"] = {
    get: {
      operationId: "getCustomerOrders",
      tags: ["Users"],
      summary: "Get customer orders (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Customer orders", ...refSchema("CustomerOrdersResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/users/{id}/role"] = {
    patch: {
      operationId: "updateUserRole",
      tags: ["Users"],
      summary: "Update user role (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: { type: "object", required: ["role"], properties: { role: { type: "string", enum: ["ADMIN", "USER"] } } },
          },
        },
      },
      responses: {
        "200": { description: "Role updated", ...refSchema("CustomerResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  // --- Cities ---
  const cityItemSchema = {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
      deliveryFee: { type: "number" },
    },
  };

  paths["/api/cities"] = {
    get: {
      operationId: "listCities",
      tags: ["Cities"],
      summary: "List cities",
      responses: {
        "200": { description: "Cities list", ...refSchema("CitiesResponse") },
      },
    },
    post: {
      operationId: "createCity",
      tags: ["Cities"],
      summary: "Create city (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "201": { description: "Created city", ...refSchema("CityResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/cities/{id}"] = {
    get: {
      operationId: "getCity",
      tags: ["Cities"],
      summary: "Get city by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "City", ...refSchema("CityResponse") },
        "404": errDesc("Not found"),
      },
    },
    put: {
      operationId: "updateCity",
      tags: ["Cities"],
      summary: "Update city (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "200": { description: "Updated city", ...refSchema("CityResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
    delete: {
      operationId: "deleteCity",
      tags: ["Cities"],
      summary: "Delete city (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Deleted", ...refSchema("MessageDataResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  // --- Contact (Admin) ---
  paths["/api/contact"] = {
    get: {
      operationId: "listContactSubmissions",
      tags: ["Contact"],
      summary: "List contact form submissions (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
      responses: {
        "200": { description: "Paginated contact submissions", ...refSchema("PaginatedContactResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  // --- Feedback (Admin) ---
  const feedbackItemSchema = {
    type: "object",
    properties: {
      _id: { type: "string" },
      product: { type: "object" },
      customerName: { type: "string" },
      message: { type: "string" },
      rating: { type: "integer" },
      image: { type: "string", nullable: true },
      approved: { type: "boolean" },
      order: { type: "integer" },
    },
  };

  paths["/api/feedback"] = {
    get: {
      operationId: "listFeedback",
      tags: ["Feedback"],
      summary: "List feedback (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
      responses: {
        "200": { description: "Paginated feedback", ...refSchema("PaginatedFeedbackResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
    post: {
      operationId: "createFeedback",
      tags: ["Feedback"],
      summary: "Create feedback (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "201": { description: "Created feedback", ...refSchema("FeedbackResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/feedback/upload-image"] = {
    post: {
      operationId: "uploadFeedbackImage",
      tags: ["Feedback"],
      summary: "Upload feedback image (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { image: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Image URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/feedback/{id}"] = {
    get: {
      operationId: "getFeedback",
      tags: ["Feedback"],
      summary: "Get feedback by ID (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Feedback", ...refSchema("FeedbackResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
    put: {
      operationId: "updateFeedback",
      tags: ["Feedback"],
      summary: "Update feedback (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "200": { description: "Updated feedback", ...refSchema("FeedbackResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
    delete: {
      operationId: "deleteFeedback",
      tags: ["Feedback"],
      summary: "Delete feedback (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Deleted", ...refSchema("MessageDataResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  paths["/api/feedback/{id}/approve"] = {
    patch: {
      operationId: "setFeedbackApproved",
      tags: ["Feedback"],
      summary: "Approve feedback (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: { type: "object", required: ["approved"], properties: { approved: { type: "boolean" } } },
          },
        },
      },
      responses: {
        "200": { description: "Approval updated", ...refSchema("FeedbackResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  // --- Inventory (Admin) ---
  paths["/api/inventory/low-stock"] = {
    get: {
      operationId: "getLowStock",
      tags: ["Inventory"],
      summary: "Get low stock products (Admin)",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Products with low stock", ...refSchema("InventoryListResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/inventory/out-of-stock"] = {
    get: {
      operationId: "getOutOfStock",
      tags: ["Inventory"],
      summary: "Get out-of-stock products (Admin)",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Products with zero stock", ...refSchema("InventoryListResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  // --- Dashboard (Admin) ---
  paths["/api/dashboard/stats"] = {
    get: {
      operationId: "getDashboardStats",
      tags: ["Dashboard"],
      summary: "Dashboard statistics (Admin)",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Stats (orders, revenue, users, etc.)", ...refSchema("DashboardStatsResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/dashboard/top-selling"] = {
    get: {
      operationId: "getTopSelling",
      tags: ["Dashboard"],
      summary: "Top selling products (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
      responses: {
        "200": { description: "Top selling products", ...refSchema("TopSellingResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  // --- Settings (Admin) ---
  paths["/api/settings"] = {
    get: {
      operationId: "getSettings",
      tags: ["Settings"],
      summary: "Get settings",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Full settings object (store, hero, collections, etc.)", ...refSchema("SettingsResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
    put: {
      operationId: "updateSettings",
      tags: ["Settings"],
      summary: "Update settings (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: {
        "200": { description: "Updated settings", ...refSchema("SettingsResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/test-order-email"] = {
    post: {
      operationId: "sendTestOrderEmail",
      tags: ["Settings"],
      summary: "Send test order notification email (Admin)",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Email sent or skipped (if SMTP not configured)", ...refSchema("MessageDataResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/logo"] = {
    post: {
      operationId: "uploadLogo",
      tags: ["Settings"],
      summary: "Upload store logo (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { logo: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Logo URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/collection-image"] = {
    post: {
      operationId: "uploadCollectionImage",
      tags: ["Settings"],
      summary: "Upload collection image (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { image: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Image URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/hero-image"] = {
    post: {
      operationId: "uploadHeroImage",
      tags: ["Settings"],
      summary: "Upload hero image (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { image: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Image URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/hero-video"] = {
    post: {
      operationId: "uploadHeroVideo",
      tags: ["Settings"],
      summary: "Upload hero video (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { video: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Video URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/section-image"] = {
    post: {
      operationId: "uploadSectionImage",
      tags: ["Settings"],
      summary: "Upload section image (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { image: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Image URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/section-video"] = {
    post: {
      operationId: "uploadSectionVideo",
      tags: ["Settings"],
      summary: "Upload section video (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { video: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Video URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/settings/promo-image"] = {
    post: {
      operationId: "uploadPromoImage",
      tags: ["Settings"],
      summary: "Upload promo image (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { image: { type: "string", format: "binary" } } } } } },
      responses: {
        "200": { description: "Image URL", ...refSchema("SingleUrlResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  // --- Reports (Admin) ---
  paths["/api/reports"] = {
    get: {
      operationId: "getReports",
      tags: ["Reports"],
      summary: "Get reports data (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "from", in: "query", schema: { type: "string", format: "date" } },
        { name: "to", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        "200": { description: "Reports (sales, orders, etc.)", ...refSchema("ReportsResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  // --- AI ---
  paths["/api/ai/settings"] = {
    get: {
      operationId: "getAiSettings",
      tags: ["AI"],
      summary: "Get AI widget settings (public)",
      responses: {
        "200": { description: "AI enabled, greeting, suggested questions", ...refSchema("AiSettingsResponse") },
      },
    },
  };

  paths["/api/ai/chat"] = {
    post: {
      operationId: "postChat",
      tags: ["AI"],
      summary: "Send chat message (public)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: { type: "string" },
                sessionId: { type: "string", description: "Optional; omit to start new session" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "AI reply and sessionId", ...refSchema("AiChatResponse") },
        "400": errDesc("Validation error"),
      },
    },
  };

  paths["/api/ai/sessions"] = {
    get: {
      operationId: "listAiSessions",
      tags: ["AI"],
      summary: "List chat sessions (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
      responses: {
        "200": { description: "Paginated sessions", ...refSchema("AiSessionsResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
      },
    },
  };

  paths["/api/ai/sessions/{id}"] = {
    get: {
      operationId: "getSessionById",
      tags: ["AI"],
      summary: "Get chat session with messages (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Session and messages", ...refSchema("AiSessionDetailResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
    delete: {
      operationId: "deleteSession",
      tags: ["AI"],
      summary: "Delete chat session (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        "200": { description: "Session deleted", ...refSchema("MessageDataResponse") },
        "401": errDesc("Unauthorized"),
        "403": errDesc("Forbidden"),
        "404": errDesc("Not found"),
      },
    },
  };

  return paths;
}

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Al-Noon API",
    version: "1.0.0",
    description: "Backend API for Al-Noon dashboard and storefront",
  },
  servers: [{ url: baseUrl, description: "API server" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT from sign-in (cookie `al_noon_token` or Authorization: Bearer <token>)",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        description: "Error response envelope (4xx/5xx). Message uses x-language / Accept-Language (en | ar).",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", description: "Human-readable message (translated)" },
          code: { type: "string", description: "i18n key or error code (e.g. CONFLICT)", nullable: true },
          data: { type: "object", nullable: true, description: "Always null on error" },
          details: { type: "object", description: "Validation or extra details", nullable: true },
        },
        example: { success: false, message: "Validation error", code: "errors.common.validation_error", data: null },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      // --- Product data contracts ---
      LocalizedString: {
        type: "object",
        description: "en/ar localized text",
        properties: { en: { type: "string" }, ar: { type: "string" } },
      },
      ProductCategoryRef: {
        type: "object",
        description: "Category when populated (list/detail)",
        properties: {
          _id: { type: "string" },
          name: { $ref: "#/components/schemas/LocalizedString" },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
        },
      },
      ProductData: {
        type: "object",
        description: "Product document (list item or single product)",
        properties: {
          _id: { type: "string" },
          name: { $ref: "#/components/schemas/LocalizedString" },
          description: { $ref: "#/components/schemas/LocalizedString", nullable: true },
          category: {
            oneOf: [
              { type: "string", description: "Category ID when not populated" },
              { $ref: "#/components/schemas/ProductCategoryRef" },
            ],
          },
          price: { type: "number" },
          discountPrice: { type: "number", nullable: true },
          images: { type: "array", items: { type: "string" } },
          imageColors: { type: "array", items: { type: "string" } },
          videos: { type: "array", items: { type: "string" } },
          stock: { type: "integer" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
          isNewArrival: { type: "boolean" },
          sizes: { type: "array", items: { type: "string" } },
          sizeDescriptions: { type: "array", items: { type: "string" } },
          colors: { type: "array", items: { type: "string" } },
          details: { $ref: "#/components/schemas/LocalizedString", nullable: true },
          stylingTip: { $ref: "#/components/schemas/LocalizedString", nullable: true },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          averageRating: { type: "number", description: "Present on list when ratings exist", nullable: true },
          ratingCount: { type: "integer", description: "Present on list", nullable: true },
          soldQty: { type: "integer", description: "Present on list (units sold)", nullable: true },
        },
      },
      ProductSingleData: {
        type: "object",
        description: "Payload for get/create/update/delete/status/stock (single product)",
        required: ["product"],
        properties: { product: { $ref: "#/components/schemas/ProductData" } },
      },
      InventoryProductsData: {
        type: "object",
        description: "Low-stock or out-of-stock list payload",
        required: ["products"],
        properties: {
          products: { type: "array", items: { $ref: "#/components/schemas/ProductData" } },
          threshold: { type: "integer", description: "Low-stock threshold (low-stock endpoint only)", nullable: true },
        },
      },
      TopSellingItem: {
        type: "object",
        description: "Top selling item (productId, name, image, totalQty)",
        properties: {
          productId: { type: "string" },
          name: { $ref: "#/components/schemas/LocalizedString" },
          image: { type: "string", nullable: true },
          totalQty: { type: "integer" },
        },
      },
      TopSellingData: {
        type: "object",
        description: "Top selling products payload",
        required: ["topSelling"],
        properties: { topSelling: { type: "array", items: { $ref: "#/components/schemas/TopSellingItem" } } },
      },
      Health: {
        type: "object",
        description: "Health check response",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              dbConnected: { type: "boolean" },
            },
          },
        },
      },
      StoreResponse: {
        type: "object",
        description: "Store settings for storefront",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              store: {
                type: "object",
                properties: {
                  storeName: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                  logo: { type: "string" },
                  quickLinks: { type: "array", items: { type: "object" } },
                  socialLinks: { type: "object" },
                  newsletterEnabled: { type: "boolean" },
                  homeCollections: { type: "array", items: { type: "object" } },
                  hero: { type: "object" },
                  heroEnabled: { type: "boolean" },
                  newArrivalsLimit: { type: "integer" },
                  feedbackSectionEnabled: { type: "boolean" },
                  feedbackDisplayLimit: { type: "integer", description: "Number of feedback items to show (0 = show all)" },
                  newArrivalsSectionImages: { type: "array", items: { type: "string" }, description: "Section media for New Arrivals block" },
                  newArrivalsSectionVideos: { type: "array", items: { type: "string" } },
                  ourCollectionSectionImages: { type: "array", items: { type: "string" }, description: "Section media for Our Collection block" },
                  ourCollectionSectionVideos: { type: "array", items: { type: "string" } },
                  feedbacks: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
      PageResponse: {
        type: "object",
        description: "Page content by slug",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              page: {
                type: "object",
                properties: {
                  slug: { type: "string" },
                  title: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                  content: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                },
              },
            },
          },
        },
      },
      MessageDataResponse: {
        type: "object",
        description: "Success response: success, optional message (translated), optional data",
        required: ["success"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", nullable: true, description: "i18n message (x-language / Accept-Language)" },
          data: { type: "object", nullable: true },
        },
      },
      NewsletterConflictResponse: {
        type: "object",
        description: "409 when email is already subscribed; FE can check code or alreadySubscribed",
        required: ["success", "message", "data", "alreadySubscribed"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", description: "Translated message" },
          code: { type: "string", example: "CONFLICT" },
          data: { type: "object", nullable: true },
          alreadySubscribed: { type: "boolean", example: true },
        },
      },
      AuthResponse: {
        type: "object",
        description: "Auth success with token and user",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              token: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string", enum: ["ADMIN", "USER"] },
                },
              },
            },
          },
        },
      },
      ProfileResponse: {
        type: "object",
        description: "Current user profile",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string", enum: ["ADMIN", "USER"] },
                },
              },
            },
          },
        },
      },
      SignOutResponse: {
        type: "object",
        description: "Signed out",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object", nullable: true },
        },
      },
      PaginatedSubscribersResponse: {
        type: "object",
        description: "Paginated subscribers list",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              subscribers: { type: "array", items: { type: "object" } },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
        },
      },
      FilterOptionItem: {
        type: "object",
        description: "Single filter option for E-commerce dropdowns (availability or sort). Use value in GET /api/products query params.",
        required: ["value", "labelEn", "labelAr"],
        properties: {
          value: { type: "string", description: "Query value (e.g. inStock, newest). Send as ?availability= or ?sort=" },
          labelEn: { type: "string", description: "Display label (English)" },
          labelAr: { type: "string", description: "Display label (Arabic)" },
        },
        example: { value: "inStock", labelEn: "In stock", labelAr: "متوفر" },
      },
      AvailabilityFiltersResponse: {
        type: "object",
        description: "Response of GET /api/products/filters/availability. Use data[].value in GET /api/products?availability=.",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/FilterOptionItem" },
            description: "Availability options. value: all | inStock | outOfStock",
          },
        },
        example: {
          success: true,
          data: [
            { value: "all", labelEn: "All", labelAr: "الكل" },
            { value: "inStock", labelEn: "In stock", labelAr: "متوفر" },
            { value: "outOfStock", labelEn: "Out of stock", labelAr: "غير متوفر" },
          ],
        },
      },
      SortFiltersResponse: {
        type: "object",
        description: "Response of GET /api/products/filters/sort. Use data[].value in GET /api/products?sort=.",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/FilterOptionItem" },
            description: "Sort options. value: newest | priceAsc | priceDesc | nameAsc | nameDesc | bestSelling | highestSelling | lowSelling",
          },
        },
        example: {
          success: true,
          data: [
            { value: "newest", labelEn: "Newest", labelAr: "الأحدث" },
            { value: "priceAsc", labelEn: "Price: Low to High", labelAr: "السعر: منخفض إلى عالي" },
            { value: "priceDesc", labelEn: "Price: High to Low", labelAr: "السعر: عالي إلى منخفض" },
            { value: "nameAsc", labelEn: "Name A–Z", labelAr: "الاسم أ–ي" },
            { value: "nameDesc", labelEn: "Name Z–A", labelAr: "الاسم ي–أ" },
            { value: "bestSelling", labelEn: "Best selling", labelAr: "الأكثر مبيعاً" },
            { value: "highestSelling", labelEn: "Highest selling", labelAr: "الأعلى مبيعاً" },
            { value: "lowSelling", labelEn: "Lowest selling", labelAr: "الأقل مبيعاً" },
          ],
        },
      },
      ProductListAppliedFilters: {
        type: "object",
        description: "Query params actually applied by list products (echo of handled filters)",
        properties: {
          sort: { type: "string", enum: ["newest", "priceAsc", "priceDesc", "nameAsc", "nameDesc", "bestSelling", "highestSelling", "lowSelling"], description: "Sort applied (default newest)" },
          availability: { type: "string", enum: ["all", "inStock", "outOfStock"], description: "Stock filter applied (all = no filter)" },
          category: { type: "string", nullable: true, description: "Category ID when filtered" },
          search: { type: "string", nullable: true, description: "Search term when provided" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], nullable: true },
          newArrival: { type: "boolean", nullable: true, description: "true when filtering new arrivals" },
          minPrice: { type: "number", nullable: true },
          maxPrice: { type: "number", nullable: true },
          color: { type: "string", nullable: true },
          minRating: { type: "number", nullable: true, description: "1–5 when filtering by min rating" },
        },
      },
      PaginatedProductsResponse: {
        type: "object",
        description: "Full response body returned by list products: success, data (array), pagination, appliedFilters (handled query params).",
        required: ["success", "data", "pagination"],
        properties: {
          success: { type: "boolean", example: true, description: "Always true on 200" },
          message: { type: "string", nullable: true, description: "Optional i18n message" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductData" },
            description: "Products list (full product objects with soldQty, averageRating, ratingCount when available)",
          },
          pagination: {
            type: "object",
            required: ["total", "page", "limit", "totalPages"],
            properties: {
              total: { type: "integer", example: 42 },
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              totalPages: { type: "integer", example: 3 },
            },
            description: "Pagination metadata",
          },
          appliedFilters: {
            $ref: "#/components/schemas/ProductListAppliedFilters",
            description: "Query params that were applied (sort, availability, category, search, etc.)",
          },
        },
        example: {
          success: true,
          data: [
            {
              _id: "507f1f77bcf86cd799439011",
              name: { en: "Product name", ar: "اسم المنتج" },
              description: { en: "Description", ar: "الوصف" },
              category: { _id: "507f1f77bcf86cd799439012", name: { en: "Category", ar: "فئة" }, status: "PUBLISHED" },
              price: 99.99,
              discountPrice: 79.99,
              images: ["/uploads/1.jpg"],
              imageColors: [""],
              videos: [],
              stock: 10,
              status: "ACTIVE",
              isNewArrival: true,
              sizes: ["S", "M", "L"],
              sizeDescriptions: [],
              colors: ["Black"],
              details: null,
              stylingTip: null,
              deletedAt: null,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
              averageRating: 4.5,
              ratingCount: 12,
              soldQty: 25,
            },
          ],
          pagination: { total: 42, page: 1, limit: 20, totalPages: 3 },
          appliedFilters: { sort: "newest", availability: "all" },
        },
      },
      ProductResponse: {
        type: "object",
        description: "Full response body returned by get/create/update/delete/status/stock: success, optional message, data.product (single product).",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true, description: "Always true on 200/201" },
          message: { type: "string", nullable: true, description: "Optional i18n message (e.g. success.product.updated)" },
          data: {
            type: "object",
            required: ["product"],
            properties: { product: { $ref: "#/components/schemas/ProductData" } },
            description: "Single product payload",
          },
        },
        example: {
          success: true,
          message: "Product updated successfully",
          data: {
            product: {
              _id: "507f1f77bcf86cd799439011",
              name: { en: "Product name", ar: "اسم المنتج" },
              description: { en: "Description", ar: "الوصف" },
              category: { _id: "507f1f77bcf86cd799439012", name: { en: "Category", ar: "فئة" }, status: "PUBLISHED" },
              price: 99.99,
              discountPrice: 79.99,
              images: ["/uploads/1.jpg"],
              imageColors: [""],
              videos: [],
              stock: 10,
              status: "ACTIVE",
              isNewArrival: true,
              sizes: ["S", "M", "L"],
              sizeDescriptions: [],
              colors: ["Black"],
              details: null,
              stylingTip: null,
              deletedAt: null,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
            },
          },
        },
      },
      RelatedProductsResponse: {
        type: "object",
        description: "Full response body returned by related products: success, data (array of products).",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true, description: "Always true on 200" },
          message: { type: "string", nullable: true, description: "Optional i18n message" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductData" },
            description: "Related products (same category)",
          },
        },
        example: {
          success: true,
          data: [
            {
              _id: "507f1f77bcf86cd799439013",
              name: { en: "Related product", ar: "منتج مرتبط" },
              description: { en: "Description", ar: "الوصف" },
              category: { _id: "507f1f77bcf86cd799439012", name: { en: "Category", ar: "فئة" }, status: "PUBLISHED" },
              price: 89.99,
              discountPrice: null,
              images: ["/uploads/2.jpg"],
              imageColors: [""],
              videos: [],
              stock: 5,
              status: "ACTIVE",
              isNewArrival: false,
              sizes: [],
              sizeDescriptions: [],
              colors: [],
              details: null,
              stylingTip: null,
              deletedAt: null,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
            },
          ],
        },
      },
      UploadUrlsResponse: {
        type: "object",
        description: "Uploaded image or video URLs",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              urls: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      CategoryData: {
        type: "object",
        description: "Category item (includes status for store filtering)",
        properties: {
          _id: { type: "string" },
          name: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
          description: { type: "object", nullable: true },
          status: { type: "string", enum: ["visible", "hidden"], description: "Store may filter by PUBLISHED (alias for visible)" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CategoriesResponse: {
        type: "object",
        description: "Full response: success, data.categories (array with status)",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", nullable: true },
          data: {
            type: "object",
            required: ["categories"],
            properties: {
              categories: {
                type: "array",
                items: { $ref: "#/components/schemas/CategoryData" },
                description: "Categories (each includes status)",
              },
            },
          },
        },
      },
      CategoryResponse: {
        type: "object",
        description: "Single category",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: { category: { type: "object" } },
          },
        },
      },
      OrderItem: {
        type: "object",
        description: "Order line item. For GET /api/orders/:id, product is always populated (full or minimal if deleted).",
        properties: {
          product: {
            description: "Product ID (list) or populated product object (single order: _id, name { en, ar }, images; minimal object if product deleted)",
            oneOf: [
              { type: "string" },
              {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  name: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                  images: { type: "array", items: { type: "string" } },
                  price: { type: "number" },
                  discountPrice: { type: "number", nullable: true },
                },
              },
            ],
          },
          quantity: { type: "integer" },
          price: { type: "number" },
        },
      },
      OrderData: {
        type: "object",
        description: "Order document (user null for guest checkout; guest fields set instead)",
        properties: {
          _id: { type: "string" },
          user: { type: "string", nullable: true, description: "User ID when authenticated; null for guest" },
          guestName: { type: "string", nullable: true, description: "Guest checkout only" },
          guestEmail: { type: "string", nullable: true, description: "Guest checkout only" },
          guestPhone: { type: "string", nullable: true, description: "Guest checkout only" },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          total: { type: "number" },
          deliveryFee: { type: "number", nullable: true },
          status: { type: "string", enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] },
          paymentMethod: { type: "string", enum: ["COD", "INSTAPAY"], nullable: true },
          shippingAddress: { type: "string", nullable: true },
          payment: {
            type: "object",
            nullable: true,
            properties: { method: { type: "string" }, status: { type: "string" }, instaPayProofUrl: { type: "string", nullable: true } },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PaginatedOrdersResponse: {
        type: "object",
        description: "Full response: success, data (array of orders), top-level pagination",
        required: ["success", "data", "pagination"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", nullable: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderData" },
            description: "Orders list",
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      OrderResponse: {
        type: "object",
        description: "Full response: success, optional message, data.order (single order; includes guest fields when guest checkout)",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", nullable: true, description: "e.g. success.order.created" },
          data: {
            type: "object",
            required: ["order"],
            properties: {
              order: { $ref: "#/components/schemas/OrderData" },
            },
          },
        },
      },
      PaginatedUsersResponse: {
        type: "object",
        description: "Paginated users list",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              users: { type: "array", items: { type: "object" } },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
        },
      },
      CustomerResponse: {
        type: "object",
        description: "Single customer/user",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: { user: { type: "object" } },
          },
        },
      },
      CustomerOrdersResponse: {
        type: "object",
        description: "Customer orders list",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: { orders: { type: "array", items: { type: "object" } } },
          },
        },
      },
      CitiesResponse: {
        type: "object",
        description: "Cities list",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: { cities: { type: "array", items: { type: "object" } } },
          },
        },
      },
      CityResponse: {
        type: "object",
        description: "Single city",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: { city: { type: "object" } },
          },
        },
      },
      PaginatedContactResponse: {
        type: "object",
        description: "Paginated contact submissions",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              submissions: { type: "array", items: { type: "object" } },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
        },
      },
      PaginatedFeedbackResponse: {
        type: "object",
        description: "Paginated feedback list",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              feedbacks: { type: "array", items: { type: "object" } },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
        },
      },
      FeedbackResponse: {
        type: "object",
        description: "Single feedback",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: { feedback: { type: "object" } },
          },
        },
      },
      SingleUrlResponse: {
        type: "object",
        description: "Single image or video URL",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: { url: { type: "string" } },
          },
        },
      },
      InventoryListResponse: {
        type: "object",
        description: "Full response: products with low or zero stock (data.products + optional data.threshold)",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/InventoryProductsData" },
        },
      },
      DashboardStatsResponse: {
        type: "object",
        description: "Dashboard statistics",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              totalOrders: { type: "integer" },
              totalRevenue: { type: "number" },
              totalUsers: { type: "integer" },
              ordersThisMonth: { type: "integer" },
              revenueThisMonth: { type: "number" },
            },
          },
        },
      },
      TopSellingResponse: {
        type: "object",
        description: "Full response: top selling products (data.topSelling)",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/TopSellingData" },
        },
      },
      SettingsResponse: {
        type: "object",
        description: "Full settings object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            description: "Store, hero, collections, etc.",
          },
        },
      },
      ReportsResponse: {
        type: "object",
        description: "Reports (sales, orders, etc.)",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              sales: { type: "array", items: { type: "object" } },
              orders: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
      // --- AI data contracts (reusable for data payload) ---
      AiSettingsData: {
        type: "object",
        description: "AI widget settings payload",
        required: ["enabled", "greeting", "suggestedQuestions"],
        properties: {
          enabled: { type: "boolean", description: "Whether AI assistant is enabled" },
          greeting: {
            type: "object",
            required: ["en", "ar"],
            properties: { en: { type: "string" }, ar: { type: "string" } },
            description: "Greeting text (en/ar)",
          },
          suggestedQuestions: {
            type: "array",
            items: {
              type: "object",
              properties: { en: { type: "string" }, ar: { type: "string" } },
            },
            description: "Suggested questions for the chat widget",
          },
        },
      },
      AiProductCard: {
        type: "object",
        description: "Product card shown in chat (id, name, image, productUrl)",
        required: ["id", "name", "image", "productUrl"],
        properties: {
          id: { type: "string" },
          name: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
          image: { type: "string" },
          productUrl: { type: "string" },
        },
      },
      AiChatData: {
        type: "object",
        description: "AI chat reply payload (sessionId, response text, optional product cards)",
        required: ["sessionId", "response", "productCards"],
        properties: {
          sessionId: { type: "string", description: "Session ID to continue the conversation" },
          response: { type: "string", description: "Assistant reply text (plain, no [id:xxx] tags)" },
          productCards: {
            type: "array",
            items: { $ref: "#/components/schemas/AiProductCard" },
            description: "Product cards to display with this reply (if any)",
          },
        },
      },
      AiSessionListItem: {
        type: "object",
        description: "Session summary in list",
        properties: {
          id: { type: "string", description: "MongoDB _id" },
          sessionId: { type: "string" },
          messageCount: { type: "integer" },
          customerName: { type: "string", nullable: true },
          customerEmail: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "closed"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AiSessionsData: {
        type: "object",
        description: "Paginated sessions list payload",
        required: ["sessions", "total", "page", "limit"],
        properties: {
          sessions: {
            type: "array",
            items: { $ref: "#/components/schemas/AiSessionListItem" },
          },
          total: { type: "integer", description: "Total session count" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
      AiChatMessage: {
        type: "object",
        description: "Single message in a chat session",
        required: ["role", "content", "timestamp"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
          productCards: {
            type: "array",
            items: { $ref: "#/components/schemas/AiProductCard" },
            description: "Present only on assistant messages when products are suggested",
          },
        },
      },
      AiSessionDetailData: {
        type: "object",
        description: "Full session with all messages (Admin)",
        required: ["id", "sessionId", "messages", "status", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", description: "MongoDB _id" },
          sessionId: { type: "string" },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/AiChatMessage" },
          },
          customerName: { type: "string", nullable: true },
          customerEmail: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "closed"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      // --- AI full response contracts (success + data) ---
      AiSettingsResponse: {
        type: "object",
        description: "Full response: AI settings (enabled, greeting, suggested questions)",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/AiSettingsData" },
        },
      },
      AiChatResponse: {
        type: "object",
        description: "Full response: AI chat reply and sessionId",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/AiChatData" },
        },
      },
      AiSessionsResponse: {
        type: "object",
        description: "Full response: paginated AI sessions list",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/AiSessionsData" },
        },
      },
      AiSessionDetailResponse: {
        type: "object",
        description: "Full response: AI session with messages",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/AiSessionDetailData" },
        },
      },
    },
  },
  paths: buildPaths(),
};
