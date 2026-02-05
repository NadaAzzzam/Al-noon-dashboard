import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/al-noon-node",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  devWithoutDb: process.env.DEV_WITHOUT_DB === "1",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@localhost",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  adminName: process.env.ADMIN_NAME ?? "Admin"
};
