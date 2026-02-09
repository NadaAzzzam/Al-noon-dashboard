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
        "200": { description: "Subscribed", ...refSchema("MessageDataResponse") },
        "400": errDesc("Validation error"),
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

  // --- Products ---
  const productItemSchema = {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
      slug: { type: "string" },
      description: { type: "object" },
      price: { type: "number" },
      compareAtPrice: { type: "number", nullable: true },
      images: { type: "array", items: { type: "string" } },
      category: { type: "object", nullable: true },
      status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      stock: { type: "integer" },
    },
  };

  paths["/api/products"] = {
    get: {
      operationId: "listProducts",
      tags: ["Products"],
      summary: "List products",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
        { name: "category", in: "query", schema: { type: "string" } },
        { name: "search", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "PUBLISHED"] } },
      ],
      responses: {
        "200": { description: "Paginated products", ...refSchema("PaginatedProductsResponse") },
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
          summary: "List categories",
          responses: {
            "200": { description: "Categories list", ...refSchema("CategoriesResponse") },
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
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Paginated orders", ...refSchema("PaginatedOrdersResponse") },
            "401": errDesc("Unauthorized"),
          },
        },
        post: {
          operationId: "createOrder",
          tags: ["Orders"],
          summary: "Create order",
          security: [{ bearerAuth: [] }],
          requestBody: { content: { "application/json": { schema: { type: "object" } } } },
          responses: {
            "201": { description: "Created order", ...refSchema("OrderResponse") },
            "401": errDesc("Unauthorized"),
            "400": errDesc("Validation error"),
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
            "200": { description: "Order", ...refSchema("OrderResponse") },
            "401": errDesc("Unauthorized"),
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
              description: "Order cancelled", ...refSchema("OrderResponse") },
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
              description: "Proof attached", ...refSchema("OrderResponse") },
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
            description: "Error response envelope",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", description: "Human-readable message (may be translated)" },
              code: { type: "string", description: "i18n key or error code", nullable: true },
              data: { type: "object", nullable: true, description: "Always null on error" },
              details: { type: "object", description: "Validation or extra details", nullable: true },
            },
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
            description: "Success with message and optional data",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
              data: { type: "object", nullable: true },
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
          PaginatedProductsResponse: {
            type: "object",
            description: "Paginated products list",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  products: { type: "array", items: { type: "object" } },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
          ProductResponse: {
            type: "object",
            description: "Single product",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: { product: { type: "object" } },
              },
            },
          },
          RelatedProductsResponse: {
            type: "object",
            description: "Related products list",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: { products: { type: "array", items: { type: "object" } } },
              },
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
          CategoriesResponse: {
            type: "object",
            description: "Categories list",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: { categories: { type: "array", items: { type: "object" } } },
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
          PaginatedOrdersResponse: {
            type: "object",
            description: "Paginated orders list",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  orders: { type: "array", items: { type: "object" } },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
          OrderResponse: {
            type: "object",
            description: "Single order",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: { order: { type: "object" } },
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
            description: "Products with low or zero stock",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: { products: { type: "array", items: { type: "object" } } },
              },
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
            description: "Top selling products",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: { topSelling: { type: "array", items: { type: "object" } } },
              },
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
          AiSettingsResponse: {
            type: "object",
            description: "AI settings (enabled, greeting, suggested questions)",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  enabled: { type: "boolean" },
                  greeting: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                  suggestedQuestions: {
                    type: "array",
                    items: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                  },
                },
              },
            },
          },
          AiChatResponse: {
            type: "object",
            description: "AI chat reply",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  reply: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                  sessionId: { type: "string" },
                },
              },
            },
          },
          AiSessionsResponse: {
            type: "object",
            description: "Paginated AI sessions",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  sessions: { type: "array", items: { type: "object" } },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
          AiSessionDetailResponse: {
            type: "object",
            description: "AI session with messages",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  session: { type: "object" },
                  messages: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
      paths: buildPaths(),
    };
