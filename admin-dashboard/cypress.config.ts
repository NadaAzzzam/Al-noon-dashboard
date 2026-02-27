import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: true,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on, config) {
      on("before:run", async () => {
        const baseUrl = config.baseUrl || "http://localhost:5173";
        const maxAttempts = 30;
        for (let i = 0; i < maxAttempts; i++) {
          try {
            const res = await fetch(baseUrl, { method: "GET" });
            if (res.ok || res.status === 200) return;
          } catch {
            // Server not ready
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        throw new Error(`Dev server at ${baseUrl} did not become ready after ${maxAttempts}s. Start it with: npm run dev`);
      });
    },
  },
});
