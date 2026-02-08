import dotenv from "dotenv";

dotenv.config();

// Default to 8080 so cloud platforms (Render, Railway, etc.) can reach the app when they expect 0.0.0.0:8080.
// For local dev, set PORT=4000 in server/.env.
const defaultPort = 8080;
export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : defaultPort,
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/al-noon-node",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  clientUrl: process.env.CLIENT_URL ?? process.env.RENDER_EXTERNAL_URL ?? (process.env.FLY_APP_NAME ? `https://${process.env.FLY_APP_NAME}.fly.dev` : undefined) ?? "http://localhost:5173",
  devWithoutDb: process.env.DEV_WITHOUT_DB === "1",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@localhost",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  adminName: process.env.ADMIN_NAME ?? "Admin"
};
