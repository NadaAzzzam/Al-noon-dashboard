import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const start = async () => {
  try {
    await connectDatabase();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Database connection failed:", msg);
    console.warn("Running without MongoDB. Login with:", env.adminEmail, "/", env.adminPassword);
    // dbConnected stays false so login will use dev credentials
  }
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("Server failed to start:", err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
