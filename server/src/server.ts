import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { ensureDefaultRoles } from "./utils/ensureDefaultRoles.js";
import { ensureDefaultDepartments } from "./utils/ensureDefaultDepartments.js";

let httpServer: ReturnType<ReturnType<typeof createApp>["listen"]> | null = null;

process.on("uncaughtException", (err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.fatal({ err, msg, stack }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ reason }, "Unhandled rejection");
  process.exit(1);
});

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down gracefully");
  if (httpServer) {
    httpServer.close(() => {
      logger.info("HTTP server closed");
    });
  }
  const mongoose = await import("mongoose");
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
  }
  process.exit(0);
}

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

const start = async () => {
  const app = createApp();
  const host = "0.0.0.0";
  const port = env.port;

  try {
    await connectDatabase();
    logger.info("MongoDB connected");
    await ensureDefaultRoles();
    await ensureDefaultDepartments();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err, msg }, "Database connection failed; running without MongoDB");
    logger.warn({ adminEmail: env.adminEmail }, "Login with admin credentials");
  }

  httpServer = app.listen(port, host, () => {
    logger.info({ host, port }, "Server listening");
  });
};

start().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.fatal({ err, message: err.message, stack: err.stack }, "Server failed to start");
  process.exit(1);
});
