import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["src/integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/validators/**",
        "src/routes/**",
        "src/utils/response.ts",
        "src/utils/escapeHtml.ts",
        "src/utils/escapeRegex.ts",
        "src/utils/toStorefrontProduct.ts",
        "src/utils/sanitizeChatHtml.ts",
        "src/utils/richTextFormatter.ts",
        "src/utils/buildSeoMeta.ts",
        "src/utils/apiError.ts",
        "src/utils/asyncHandler.ts",
        "src/middlewares/validate.ts",
        "src/middlewares/locale.ts",
        "src/middlewares/rateLimit.ts",
        "src/middlewares/requestId.ts",
        "src/config/permissions.ts",
      ],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
