import { env } from "./config/env.js";

const port = env.port;
const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

/** Build paths as a flat object so JSON serialization never nests path keys under the first path */
function buildPaths(): Record<string, object> {
  const paths: Record<string, object> = {};

  paths["/api/health"] = {
    get: {
      operationId: "healthCheck",
      tags: ["Health"],
      summary: "Health check",
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      dbConnected: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

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
      responses: { "200": { description: "Success, sets cookie or returns token" }, "401": { description: "Invalid credentials" } },
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
      responses: { "201": { description: "Created" }, "400": { description: "Validation error" } },
    },
  };

  paths["/api/auth/profile"] = {
    get: {
      operationId: "getProfile",
      tags: ["Auth"],
      summary: "Current user profile",
      security: [{ bearerAuth: [] }],
      responses: { "200": { description: "User profile" }, "401": { description: "Unauthorized" } },
    },
  };

  paths["/api/auth/sign-out"] = {
    post: {
      operationId: "signOut",
      tags: ["Auth"],
      summary: "Sign out",
      security: [{ bearerAuth: [] }],
      responses: { "200": { description: "Signed out" } },
    },
  };

  paths["/api/products"] = {
    get: {
      operationId: "listProducts",
      tags: ["Products"],
      summary: "List products",
      parameters: [
        { name: "page", "in": "query", schema: { type: "integer" } },
        { name: "limit", "in": "query", schema: { type: "integer" } },
        { name: "category", "in": "query", schema: { type: "string" } },
        { name: "search", "in": "query", schema: { type: "string" } },
        { name: "status", "in": "query", schema: { type: "string", "enum": ["DRAFT", "PUBLISHED"] } },
      ],
      responses: { "200": { description: "Paginated products" } },
    },
    post: {
      operationId: "createProduct",
      tags: ["Products"],
      summary: "Create product (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
    },
  };

  paths["/api/products/{id}"] = {
    get: {
      operationId: "getProduct",
      tags: ["Products"],
      summary: "Get product by ID",
      parameters: [{ name: "id", "in": "path", required: true, schema: { type: "string" } }],
      responses: { "200": { description: "Product" }, "404": { description: "Not found" } },
    },
    put: {
      operationId: "updateProduct",
      tags: ["Products"],
      summary: "Update product (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", "in": "path", required: true, schema: { type: "string" } }],
      responses: { "200": { description: "Updated" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
    },
    delete: {
      operationId: "deleteProduct",
      tags: ["Products"],
      summary: "Delete product (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", "in": "path", required: true, schema: { type: "string" } }],
      responses: { "200": { description: "Deleted" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
    },
  };

  paths["/api/orders"] = {
    get: {
      operationId: "listOrders",
      tags: ["Orders"],
      summary: "List orders",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", "in": "query", schema: { type: "integer" } },
        { name: "limit", "in": "query", schema: { type: "integer" } },
        { name: "status", "in": "query", schema: { type: "string" } },
      ],
      responses: { "200": { description: "Paginated orders" }, "401": { description: "Unauthorized" } },
    },
    post: {
      operationId: "createOrder",
      tags: ["Orders"],
      summary: "Create order",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
    },
  };

  paths["/api/orders/{id}"] = {
    get: {
      operationId: "getOrder",
      tags: ["Orders"],
      summary: "Get order by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", "in": "path", required: true, schema: { type: "string" } }],
      responses: { "200": { description: "Order" }, "401": { description: "Unauthorized" }, "404": { description: "Not found" } },
    },
  };

  paths["/api/ai/settings"] = {
    get: {
      operationId: "getAiSettings",
      tags: ["AI"],
      summary: "Get AI widget settings (public)",
      responses: { "200": { description: "AI enabled, greeting, suggested questions" } },
    },
  };

  paths["/api/ai/chat"] = {
    post: {
      operationId: "postChat",
      tags: ["AI"],
      summary: "Send chat message (public)",
      requestBody: {
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
      responses: { "200": { description: "AI reply and sessionId" } },
    },
  };

  paths["/api/ai/sessions"] = {
    get: {
      operationId: "listAiSessions",
      tags: ["AI"],
      summary: "List chat sessions (Admin)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", "in": "query", schema: { type: "integer" } },
        { name: "limit", "in": "query", schema: { type: "integer" } },
      ],
      responses: { "200": { description: "Paginated sessions" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
    },
  };

  paths["/api/dashboard/stats"] = {
    get: {
      operationId: "getDashboardStats",
      tags: ["Dashboard"],
      summary: "Dashboard statistics (Admin)",
      security: [{ bearerAuth: [] }],
      responses: { "200": { description: "Stats" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
    },
  };

  paths["/api/settings"] = {
    get: {
      operationId: "getSettings",
      tags: ["Settings"],
      summary: "Get settings",
      security: [{ bearerAuth: [] }],
      responses: { "200": { description: "Settings" }, "401": { description: "Unauthorized" } },
    },
    put: {
      operationId: "updateSettings",
      tags: ["Settings"],
      summary: "Update settings (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: { content: { "application/json": { schema: { type: "object" } } } },
      responses: { "200": { description: "Updated" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
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
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          code: { type: "string" },
        },
      },
      Health: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              dbConnected: { type: "boolean" },
            },
          },
        },
      },
    },
  },
  paths: buildPaths(),
};
