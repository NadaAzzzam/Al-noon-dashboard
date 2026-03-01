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
        "src/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/integration/**",
        "src/test/**",
        "src/**/supertest.d.ts",
        "src/**/vitest.d.ts",
        "src/seeders/**",
        "src/swagger.ts",
        "src/app.ts",
        "src/server.ts",
        "src/**/express.d.ts",
        "src/utils/seed*.ts",
        "src/utils/ensureDefaultDepartments.ts",
        "src/utils/ensureDefaultRoles.ts",
        "src/controllers/**",
        "src/utils/email.ts",
        "src/utils/aiService.ts",
        "src/application/auth/authService.ts",
        "src/utils/chatIntents.ts",
        "src/utils/chatResponses.ts",
        "src/utils/idempotencyStore.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 40,
        branches: 65,
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
