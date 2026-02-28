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
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/test/**",
      ],
    },
    environmentOptions: {
      jsdom: {
        url: "http://localhost:5173",
      },
    },
  },
});
