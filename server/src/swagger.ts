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
  paths["/api/store/home"] = {
    get: {
      operationId: "getStoreHome",
      tags: ["Store"],
      summary: "Get unified home page data (store config, hero, new arrivals, collections, feedbacks, announcement bar)",
      responses: {
        "200": { description: "Complete home page data for storefront", ...refSchema("StoreHomeResponse") },
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
        "201": { description: "Contact form submitted", ...refSchema("MessageDataResponse") },
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

  // --- Products (list: ProductListItem; single: ProductData) ---
  paths["/api/products/filters/sort"] = {
    get: {
      operationId: "getSortFilters",
      tags: ["Products"],
      summary: "Get sort options (Shopify-style)",
      description: "Returns sort options in Shopify ProductCollectionSortKeys style. Use data[].value in GET /api/products?sort=.",
      responses: {
        "200": { description: "Sort options", ...refSchema("SortFiltersResponse") },
      },
    },
  };
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
        { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE", "DRAFT"] }, description: "Product status (storefront uses ACTIVE)" },
        { name: "newArrival", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Filter by new-arrival flag (home page uses true)" },
        { name: "availability", in: "query", schema: { type: "string", enum: ["all", "inStock", "outOfStock"], default: "all" }, description: "Stock filter" },
        { name: "sort", in: "query", schema: { type: "string", enum: ["BEST_SELLING", "CREATED_DESC", "PRICE_ASC", "PRICE_DESC", "TITLE_ASC", "TITLE_DESC", "MANUAL"], default: "CREATED_DESC" }, description: "Sort order (Shopify-style; legacy values also accepted)" },
        { name: "minPrice", in: "query", schema: { type: "number" }, description: "Min price (EGP)" },
        { name: "maxPrice", in: "query", schema: { type: "number" }, description: "Max price (EGP)" },
        { name: "color", in: "query", schema: { type: "string" }, description: "Filter by color (case-insensitive)" },
        { name: "minRating", in: "query", schema: { type: "number", minimum: 1, maximum: 5 }, description: "Only products with average rating >= this (1–5)" },
        { name: "tags", in: "query", schema: { type: "string" }, description: "Filter by tags (comma-separated)" },
        { name: "vendor", in: "query", schema: { type: "string" }, description: "Filter by vendor/brand (case-insensitive)" },
        { name: "hasDiscount", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Filter products with/without discount" },
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

  paths["/api/products/{id}"] = {
    get: {
      operationId: "getProduct",
      tags: ["Products"],
      summary: "Get product by ID",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "color", in: "query", required: false, schema: { type: "string" }, description: "Filter media/images by color (e.g. Black). When set, media and images arrays show only images for that color." },
      ],
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
      description: "Accepts both old flat fields (guestName, guestEmail, shippingAddress as string) and new Shopify-style structured fields. When new structured fields are present they take priority. Backward compatible.",
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
                shippingAddress: {
                  description: "Flat string (legacy) OR structured address object",
                  oneOf: [
                    { type: "string" },
                    { $ref: "#/components/schemas/StructuredAddress" }
                  ]
                },
                deliveryFee: { type: "number" },
                guestName: { type: "string", description: "Legacy: required for guest checkout if firstName/lastName not provided" },
                guestEmail: { type: "string", format: "email", description: "Legacy: required for guest checkout if email not provided" },
                guestPhone: { type: "string", description: "Legacy: optional for guest checkout" },
                email: { type: "string", format: "email", description: "Customer contact email" },
                firstName: { type: "string", description: "Customer first name" },
                lastName: { type: "string", description: "Customer last name" },
                phone: { type: "string", description: "Customer phone number" },
                billingAddress: { description: "null = same as shipping", nullable: true, allOf: [{ $ref: "#/components/schemas/StructuredAddress" }] },
                specialInstructions: { type: "string", description: "Order notes from customer" },
                shippingMethod: { type: "string", description: "e.g. 'standard', 'express'", default: "standard" },
                emailNews: { type: "boolean", description: "Opted into email marketing", default: false },
                textNews: { type: "boolean", description: "Opted into SMS marketing", default: false },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Success, message, data.order (includes both legacy guest fields and new structured fields)", ...refSchema("OrderResponse") },
        "400": errDesc("Validation error (e.g. guest checkout requires guestName/guestEmail or firstName/lastName/email)"),
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

  // --- Checkout (public) ---
  paths["/api/checkout"] = {
    post: {
      operationId: "checkout",
      tags: ["Checkout"],
      summary: "Complete checkout (create order)",
      description: "Used by the ecommerce storefront when the user submits the order on the checkout page (e.g. \"Pay now\" button). Same request body as POST /api/orders. Guest checkout: no auth, require firstName/lastName/email (or legacy guestName/guestEmail). Logged-in: send optional Bearer token; contact fields (firstName, lastName, email) can be omitted and are filled from the account. shippingAddress.city can be city name or city _id (from cities select); backend resolves _id to name for display and confirmation emails.",
      security: [],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    required: ["product", "quantity", "price"],
                    properties: {
                      product: { type: "string", description: "Product ID" },
                      quantity: { type: "integer", minimum: 1 },
                      price: { type: "number", exclusiveMinimum: 0 },
                    },
                  },
                },
                paymentMethod: { type: "string", enum: ["COD", "INSTAPAY"] },
                shippingAddress: {
                  description: "Flat string (legacy) OR structured { address, apartment?, city, postalCode?, country? }. city can be city name or city _id (e.g. from cities dropdown); backend resolves _id to name.",
                  oneOf: [
                    { type: "string" },
                    { $ref: "#/components/schemas/StructuredAddress" },
                  ],
                },
                deliveryFee: { type: "number", minimum: 0 },
                guestName: { type: "string", description: "Guest checkout: required if firstName/lastName not provided" },
                guestEmail: { type: "string", format: "email", description: "Guest checkout: required if email not provided" },
                guestPhone: { type: "string" },
                email: { type: "string", format: "email", description: "Optional when logged in (filled from account)" },
                firstName: { type: "string", description: "Optional when logged in (filled from account)" },
                lastName: { type: "string", description: "Optional when logged in (filled from account)" },
                phone: { type: "string" },
                billingAddress: { nullable: true, allOf: [{ $ref: "#/components/schemas/StructuredAddress" }] },
                specialInstructions: { type: "string" },
                shippingMethod: { type: "string", default: "standard" },
                emailNews: { type: "boolean", default: false },
                textNews: { type: "boolean", default: false },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Order created; data.order returned (includes guest fields for guest checkout)", ...refSchema("OrderResponse") },
        "400": errDesc("Validation error or guest checkout missing name/email"),
        "503": errDesc("Database unavailable"),
      },
    },
  };

  paths["/api/shipping-methods"] = {
    get: {
      operationId: "listShippingMethods",
      tags: ["Checkout"],
      summary: "List available shipping methods",
      description: "Returns available shipping methods with bilingual names and estimated delivery days. Prices are determined by the city delivery fee.",
      security: [],
      responses: {
        "200": {
          description: "Array of shipping methods",
          ...jsonContent({
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/ShippingMethod" },
              },
            },
          }),
        },
      },
    },
  };

  paths["/api/payment-methods"] = {
    get: {
      operationId: "getPaymentMethods",
      tags: ["Checkout"],
      summary: "Get enabled payment methods",
      description: "Returns payment methods enabled in store settings (e.g. COD, InstaPay) for e-commerce checkout. Public.",
      security: [],
      responses: {
        "200": {
          description: "List of enabled payment methods with id and localized name",
          ...jsonContent({
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  paymentMethods: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", enum: ["COD", "INSTAPAY"] },
                        name: {
                          type: "object",
                          properties: { en: { type: "string" }, ar: { type: "string" } },
                        },
                        instaPayNumber: { type: "string", description: "Present only for INSTAPAY; store's InstaPay number for customer transfer." },
                      },
                    },
                  },
                },
              },
            },
          }),
        },
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
      ProductMediaItem: {
        type: "object",
        description: "Single media asset (image, video, or gif) – generic and reusable",
        required: ["type", "url"],
        properties: {
          type: { type: "string", enum: ["image", "video", "gif"], description: "Explicit type for frontend rendering" },
          url: { type: "string", description: "Asset URL" },
          alt: { type: "string", description: "Optional alt text (accessibility)", nullable: true },
          durationSeconds: { type: "number", description: "Optional video duration", nullable: true },
        },
      },
      ProductMedia: {
        type: "object",
        description: "Product media: default (required), optional hover, optional preview video",
        required: ["default"],
        properties: {
          default: { $ref: "#/components/schemas/ProductMediaItem", description: "Shown by default (card and detail)" },
          hover: { $ref: "#/components/schemas/ProductMediaItem", description: "Shown on hover (e.g. product card)", nullable: true },
          previewVideo: { $ref: "#/components/schemas/ProductMediaItem", description: "Optional preview video (e.g. product detail)", nullable: true },
        },
      },
      ProductListItem: {
        type: "object",
        description: "Product in list responses (GET /products, GET /products/:id/related, store newArrivals). Has media only; images, videos, imageColors are omitted.",
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
          media: { $ref: "#/components/schemas/ProductMedia", description: "Structured media: default, hover, previewVideo" },
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
          averageRating: { type: "number", description: "Present when ratings exist", nullable: true },
          ratingCount: { type: "integer", description: "Present on list", nullable: true },
          soldQty: { type: "integer", description: "Units sold", nullable: true },
        },
      },
      ProductColorAvailability: {
        type: "object",
        description: "Per-color availability and optional image. hasImage true when imageColors[i] matches this color.",
        properties: {
          color: { type: "string" },
          available: { type: "boolean" },
          outOfStock: { type: "boolean" },
          availableSizeCount: { type: "integer", description: "Number of sizes in stock for this color. When variants is empty, equals product.sizes.length." },
          hasImage: { type: "boolean", description: "True when at least one image is linked to this color via imageColors" },
          imageUrl: { type: "string", description: "First image URL for this color when hasImage is true" },
        },
      },
      ProductAvailabilityDetail: {
        type: "object",
        description: "Availability block on GET /products/:id. Colors include hasImage/imageUrl for color-specific images. When product has no variant records, variants are synthesized from global stock (variantsSource: estimated).",
        properties: {
          variantsSource: { type: "string", enum: ["exact", "estimated"], description: "exact when variants come from DB; estimated when synthesized from global stock (no variants stored)." },
          availableSizeCount: { type: "integer", description: "Total number of sizes that are available (in stock) for this product." },
          colors: { type: "array", items: { $ref: "#/components/schemas/ProductColorAvailability" } },
          sizes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                size: { type: "string" },
                available: { type: "boolean" },
                outOfStock: { type: "boolean" },
              },
            },
          },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                color: { type: "string" },
                size: { type: "string" },
                stock: { type: "integer" },
                outOfStock: { type: "boolean" },
              },
            },
          },
        },
      },
      ProductData: {
        type: "object",
        description: "Full product (single product: GET /products/:id, create/update/delete/status). Includes media + images, videos, imageColors for detail/admin. GET response also includes availability (with hasImage/imageUrl per color) and formattedDetails.",
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
          media: { $ref: "#/components/schemas/ProductMedia", description: "Structured media: default, hover, previewVideo" },
          images: { type: "array", items: { type: "string" }, description: "Full gallery (only on single-product responses)" },
          imageColors: { type: "array", items: { type: "string" }, description: "Color per image; only on single-product responses" },
          videos: { type: "array", items: { type: "string" }, description: "Video URLs; only on single-product responses" },
          defaultMediaType: { type: "string", enum: ["image", "video"], description: "Preferred media type for default display on product cards", nullable: true },
          hoverMediaType: { type: "string", enum: ["image", "video"], description: "Preferred media type for hover display on product cards", nullable: true },
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
          averageRating: { type: "number", description: "Present when ratings exist", nullable: true },
          ratingCount: { type: "integer", description: "Present on list", nullable: true },
          soldQty: { type: "integer", description: "Units sold", nullable: true },
          availability: { $ref: "#/components/schemas/ProductAvailabilityDetail", description: "Present on GET /products/:id; colors include hasImage and imageUrl when product has color-specific images" },
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
      StoreHomeResponse: {
        type: "object",
        description: "Unified home page data for storefront (GET /api/store/home). Single endpoint with all sections: store config, hero, new arrivals, collections, feedbacks, announcement bar, promo banner.",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              home: {
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
                    },
                  },
                  hero: { type: "object", description: "Hero section config with images/videos, title, subtitle, CTA" },
                  heroEnabled: { type: "boolean" },
                  newArrivalsLimit: { type: "integer" },
                  newArrivals: { type: "array", items: { $ref: "#/components/schemas/ProductListItem" }, description: "New-arrival products with media" },
                  newArrivalsSectionImages: { type: "array", items: { type: "string" }, description: "Section media for New Arrivals block" },
                  newArrivalsSectionVideos: { type: "array", items: { type: "string" } },
                  homeCollections: { type: "array", items: { type: "object" }, description: "Home page collections/categories" },
                  homeCollectionsDisplayLimit: { type: "integer" },
                  ourCollectionSectionImages: { type: "array", items: { type: "string" }, description: "Section media for Our Collection block" },
                  ourCollectionSectionVideos: { type: "array", items: { type: "string" } },
                  feedbackSectionEnabled: { type: "boolean" },
                  feedbackDisplayLimit: { type: "integer" },
                  feedbacks: { type: "array", items: { type: "object" }, description: "Approved customer feedback/reviews" },
                  announcementBar: { type: "object", description: "Top announcement bar config" },
                  promoBanner: { type: "object", description: "Promotional banner config" },
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
        description: "Response of GET /api/products/filters/sort. Use data[].value in GET /api/products?sort=. Values follow Shopify ProductCollectionSortKeys style.",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/FilterOptionItem" },
            description: "Sort options (Shopify-style): BEST_SELLING | CREATED_DESC | PRICE_ASC | PRICE_DESC | TITLE_ASC | TITLE_DESC | MANUAL",
          },
        },
        example: {
          success: true,
          data: [
            { value: "BEST_SELLING", labelEn: "Best selling", labelAr: "الأكثر مبيعاً" },
            { value: "CREATED_DESC", labelEn: "Newest", labelAr: "الأحدث" },
            { value: "PRICE_ASC", labelEn: "Price: Low to High", labelAr: "السعر: منخفض إلى عالي" },
            { value: "PRICE_DESC", labelEn: "Price: High to Low", labelAr: "السعر: عالي إلى منخفض" },
            { value: "TITLE_ASC", labelEn: "Name A–Z", labelAr: "الاسم أ–ي" },
            { value: "TITLE_DESC", labelEn: "Name Z–A", labelAr: "الاسم ي–أ" },
            { value: "MANUAL", labelEn: "Manual", labelAr: "يدوي" },
          ],
        },
      },
      ProductListAppliedFilters: {
        type: "object",
        description: "Query params actually applied by list products (echo of handled filters)",
        properties: {
          sort: { type: "string", enum: ["newest", "priceAsc", "priceDesc", "nameAsc", "nameDesc", "bestSelling", "highestSelling", "lowSelling"], description: "Sort applied (default newest)" },
          availability: { type: "string", enum: ["all", "inStock", "outOfStock"], description: "Stock filter applied (all = no filter)" },
          categoryId: { type: "string", nullable: true, description: "Category ID when filtered" },
          categoryName: { type: "object", nullable: true, properties: { en: { type: "string" }, ar: { type: "string" } }, description: "Category name (en/ar) when filtered" },
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
        description: "Full response body returned by list products: success, data (array of ProductListItem), pagination, appliedFilters.",
        required: ["success", "data", "pagination"],
        properties: {
          success: { type: "boolean", example: true, description: "Always true on 200" },
          message: { type: "string", nullable: true, description: "Optional i18n message" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductListItem" },
            description: "Products list (media only; no images/videos/imageColors)",
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
              media: { default: { type: "image", url: "/uploads/1.jpg" }, hover: { type: "image", url: "/uploads/2.jpg" } },
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
              media: { default: { type: "image", url: "/uploads/1.jpg" }, hover: { type: "image", url: "/uploads/2.jpg" }, previewVideo: { type: "video", url: "/uploads/video.mp4" } },
              images: ["/uploads/1.jpg", "/uploads/2.jpg"],
              imageColors: ["", ""],
              videos: ["/uploads/video.mp4"],
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
        description: "Full response body returned by related products: success, data (array of ProductListItem).",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true, description: "Always true on 200" },
          message: { type: "string", nullable: true, description: "Optional i18n message" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductListItem" },
            description: "Related products (same category); media only",
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
              media: { default: { type: "image", url: "/uploads/2.jpg" } },
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
      StructuredAddress: {
        type: "object",
        description: "Shopify-style structured address (Egypt only)",
        properties: {
          address: { type: "string", description: "Street address", example: "735 Clarendon Street" },
          apartment: { type: "string", description: "Apartment, suite, etc.", example: "Apt 4B" },
          city: { type: "string", description: "City (Egyptian governorate)", example: "Cairo" },
          postalCode: { type: "string", description: "Postal code", example: "11511" },
          country: { type: "string", description: "Always Egypt", default: "Egypt", example: "Egypt" },
        },
        required: ["address", "city"],
      },
      OrderData: {
        type: "object",
        description: "Order document (user null for guest checkout; guest fields set instead). Includes both legacy flat fields and new Shopify-style structured fields.",
        properties: {
          _id: { type: "string" },
          user: { type: "string", nullable: true, description: "User ID when authenticated; null for guest" },
          guestName: { type: "string", nullable: true, description: "Legacy: guest checkout name (auto-derived from firstName+lastName when new fields used)" },
          guestEmail: { type: "string", nullable: true, description: "Legacy: guest checkout email" },
          guestPhone: { type: "string", nullable: true, description: "Legacy: guest checkout phone" },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          total: { type: "number" },
          deliveryFee: { type: "number", nullable: true },
          status: { type: "string", enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] },
          paymentMethod: { type: "string", enum: ["COD", "INSTAPAY"], nullable: true },
          shippingAddress: {
            description: "Flat string (legacy orders) OR structured address object (new orders)",
            nullable: true,
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/StructuredAddress" }
            ]
          },
          email: { type: "string", nullable: true, description: "Customer contact email" },
          firstName: { type: "string", nullable: true, description: "Customer first name" },
          lastName: { type: "string", nullable: true, description: "Customer last name" },
          phone: { type: "string", nullable: true, description: "Customer phone number" },
          billingAddress: { nullable: true, description: "null = same as shipping", allOf: [{ $ref: "#/components/schemas/StructuredAddress" }] },
          specialInstructions: { type: "string", nullable: true, description: "Order notes from customer" },
          shippingMethod: { type: "string", nullable: true, description: "e.g. 'standard'", default: "standard" },
          emailNews: { type: "boolean", description: "Opted into email marketing", default: false },
          textNews: { type: "boolean", description: "Opted into SMS marketing", default: false },
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
      // --- Checkout schemas ---
      ShippingMethod: {
        type: "object",
        description: "Available shipping method",
        properties: {
          id: { type: "string", example: "standard" },
          name: {
            type: "object",
            properties: { en: { type: "string", example: "Standard" }, ar: { type: "string", example: "عادي" } },
          },
          description: {
            type: "object",
            properties: { en: { type: "string", example: "Delivery in 3–5 business days" }, ar: { type: "string", example: "التوصيل خلال ٣-٥ أيام عمل" } },
          },
          estimatedDays: { type: "string", example: "3-5" },
        },
      },
    },
  },
  paths: buildPaths(),
};
