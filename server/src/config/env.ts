import dotenv from "dotenv";

dotenv.config();

// Default to 8080 so cloud platforms (Fly, Render, Railway, etc.) can reach the app.
// For local dev, set PORT=4000 in server/.env.
const defaultPort = 8080;
const rawPort = process.env.PORT ? Number(process.env.PORT) : defaultPort;
// On Fly.io, internal_port in fly.toml is 8080; use it so the app works even if PORT=4000 was set in secrets.
const port =
  process.env.FLY_APP_NAME && rawPort === 4000 ? 8080 : rawPort;
export const env = {
  port,
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/al-noon-node",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  clientUrl: process.env.CLIENT_URL ?? process.env.RENDER_EXTERNAL_URL ?? (process.env.FLY_APP_NAME ? `https://${process.env.FLY_APP_NAME}.fly.dev` : undefined) ?? "http://localhost:5173",
  devWithoutDb: process.env.DEV_WITHOUT_DB === "1",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@localhost",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  adminName: process.env.ADMIN_NAME ?? "Admin"
};
