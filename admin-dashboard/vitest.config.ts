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
        "src/utils/format.ts",
        "src/utils/orderUtils.ts",
        "src/utils/localized.ts",
        "src/services/storefrontApi.ts",
        "src/i18n.ts",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/utils/googleAnalytics.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    environmentOptions: {
      jsdom: {
        url: "http://localhost:5173",
      },
    },
  },
});
