export type PermissionDefinition = {
  /** Unique permission key used in JWT / checks, e.g. "products.manage". */
  key: string;
  /** High-level group for UI, e.g. "Products". */
  group: string;
  /** Human-readable label in English. */
  label: string;
  /** Optional longer description for tooltips. */
  description?: string;
};

export const PERMISSIONS: PermissionDefinition[] = [
  // Dashboard & reports
  {
    key: "dashboard.view",
    group: "Dashboard",
    label: "View dashboard overview",
  },
  {
    key: "reports.view",
    group: "Reports & analytics",
    label: "View analytics and reports",
  },

  // Catalog
  {
    key: "products.view",
    group: "Products",
    label: "View products list & details",
  },
  {
    key: "products.manage",
    group: "Products",
    label: "Create, edit, and delete products",
  },
  {
    key: "inventory.view",
    group: "Inventory",
    label: "View inventory (low / out of stock)",
  },
  {
    key: "inventory.manage",
    group: "Inventory",
    label: "Update product stock levels",
  },
  {
    key: "categories.view",
    group: "Categories",
    label: "View categories",
  },
  {
    key: "categories.manage",
    group: "Categories",
    label: "Create, edit, hide, and delete categories",
  },

  // Orders & customers
  {
    key: "orders.view",
    group: "Orders",
    label: "View orders list & details",
  },
  {
    key: "orders.manage",
    group: "Orders",
    label: "Update order status, cancel, and confirm payments",
  },
  {
    key: "customers.view",
    group: "Customers",
    label: "View customers and their orders",
  },

  // People / marketing
  {
    key: "users.view",
    group: "Users",
    label: "View admin users",
  },
  {
    key: "users.manage",
    group: "Users",
    label: "Change user roles",
  },
  {
    key: "subscribers.view",
    group: "Subscribers",
    label: "View newsletter subscribers",
  },
  {
    key: "contact.view",
    group: "Contact",
    label: "View contact submissions",
  },
  {
    key: "feedback.view",
    group: "Feedback",
    label: "View product feedback",
  },
  {
    key: "feedback.manage",
    group: "Feedback",
    label: "Create, edit, approve, and delete feedback",
  },

  // Shipping & cities
  {
    key: "cities.view",
    group: "Cities",
    label: "View shipping cities",
  },
  {
    key: "cities.manage",
    group: "Cities",
    label: "Create, edit, and delete cities",
  },
  {
    key: "shipping_methods.view",
    group: "Shipping methods",
    label: "View shipping methods",
  },
  {
    key: "shipping_methods.manage",
    group: "Shipping methods",
    label: "Create, edit, enable/disable, and delete shipping methods",
  },

  // Settings & translations
  {
    key: "settings.view",
    group: "Settings",
    label: "View store settings",
  },
  {
    key: "settings.manage",
    group: "Settings",
    label: "Update store settings and home page",
  },
  {
    key: "translations.manage",
    group: "Translations",
    label: "Manage translation keys and texts",
  },

  // AI assistant
  {
    key: "ai_chats.view",
    group: "AI assistant",
    label: "View AI chat history",
  },
  {
    key: "ai_chats.manage",
    group: "AI assistant",
    label: "Delete AI chat sessions",
  },
  {
    key: "ai_settings.manage",
    group: "AI assistant",
    label: "Manage AI assistant settings",
  },

  // Roles & permissions
  {
    key: "roles.manage",
    group: "Administration",
    label: "Manage roles and permissions",
  },
] as const;

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

