import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

process.on("uncaughtException", (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error("Uncaught exception:", msg);
  if (stack) console.error(stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

const start = async () => {
  const app = createApp();
  const host = "0.0.0.0";
  const port = env.port;
  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });
  // Connect DB in background so slow/unreachable DB does not block health checks
  try {
    await connectDatabase();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Database connection failed:", msg);
    console.warn("Running without MongoDB. Login with:", env.adminEmail, "/", env.adminPassword);
  }
};

start().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("Server failed to start:", err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
