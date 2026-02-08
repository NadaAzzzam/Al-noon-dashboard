import dotenv from "dotenv";

dotenv.config();

// Default to 8080 so cloud platforms (Fly, Render, Railway, etc.) can reach the app.
// For local dev, set PORT=4000 in server/.env.
const defaultPort = 8080;
const rawPort = process.env.PORT ? Number(process.env.PORT) : defaultPort;
// In production/cloud, always use 8080 so the platform can reach the app (even if .env has PORT=4000).
const isCloud =
  process.env.NODE_ENV === "production" ||
  process.env.FLY_APP_NAME ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.RAILWAY_ENVIRONMENT;
const port = isCloud && rawPort === 4000 ? defaultPort : rawPort;
export const env = {
  port,
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/al-noon-node",
  jwtSecret: (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  clientUrl: process.env.CLIENT_URL ?? process.env.RENDER_EXTERNAL_URL ?? (process.env.FLY_APP_NAME ? `https://${process.env.FLY_APP_NAME}.fly.dev` : undefined) ?? "http://localhost:5173",
  devWithoutDb: process.env.DEV_WITHOUT_DB === "1",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@localhost",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  adminName: process.env.ADMIN_NAME ?? "Admin",
  /** SMTP for order notification emails. If not set, notifications are skipped. */
  smtpHost: process.env.SMTP_HOST?.trim() || undefined,
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  smtpSecure: process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER?.trim() || undefined,
  smtpPass: process.env.SMTP_PASS?.trim() || undefined,
  smtpFrom: process.env.SMTP_FROM?.trim() || process.env.ADMIN_EMAIL || undefined
};
