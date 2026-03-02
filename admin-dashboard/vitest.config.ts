import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// React Testing Library requires React development build (act() unsupported in production)
process.env.NODE_ENV = "test";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/**/*.ts",
        "src/**/*.tsx",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/test/**",
        "src/vite-env.d.ts",
        "src/utils/googleAnalytics.ts",
        "src/main.tsx",
        "src/App.tsx",
        "src/services/api.ts",
        "src/pages/HomePageSettingsPage.tsx",
        "src/pages/ProductFormPage.tsx",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 45,
        branches: 62,
      },
    },
    environmentOptions: {
      jsdom: {
        url: "http://localhost:5173",
      },
    },
  },
});
