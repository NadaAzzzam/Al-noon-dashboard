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
      ],
      thresholds: {
        lines: 30,
        statements: 30,
        functions: 12,
        branches: 25,
      },
    },
    environmentOptions: {
      jsdom: {
        url: "http://localhost:5173",
      },
    },
  },
});
