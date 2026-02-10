import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isCloud =
  process.env.NODE_ENV === "production" ||
  !!process.env.FLY_APP_NAME ||
  !!process.env.RENDER_EXTERNAL_URL ||
  !!process.env.RAILWAY_ENVIRONMENT;

const envSchema = z.object({
  PORT: z.string().optional().transform((v) => (v ? Number(v) : 8080)),
  MONGO_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_EXIRES_IN: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  RENDER_EXTERNAL_URL: z.string().optional(),
  FLY_APP_NAME: z.string().optional(),
  DEV_WITHOUT_DB: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  NODE_ENV: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${msg}`);
}

const raw = parsed.data;
const rawPort = raw.PORT ?? 8080;
const port = isCloud && rawPort === 4000 ? 8080 : rawPort;

export const env = {
  port,
  mongoUri: raw.MONGO_URI?.trim() || "mongodb://127.0.0.1:27017/al-noon-node",
  jwtSecret: (raw.JWT_SECRET && raw.JWT_SECRET.trim()) || "change-me",
  jwtExpiresIn: raw.JWT_EXIRES_IN?.trim() || "1d",
  clientUrl:
    raw.CLIENT_URL?.trim() ||
    raw.RENDER_EXTERNAL_URL?.trim() ||
    (raw.FLY_APP_NAME ? `https://${raw.FLY_APP_NAME}.fly.dev` : undefined) ||
    "http://localhost:5173",
  devWithoutDb: raw.DEV_WITHOUT_DB === "1",
  adminEmail: raw.ADMIN_EMAIL?.trim() || "admin@localhost",
  adminPassword: raw.ADMIN_PASSWORD ?? "admin123",
  adminName: raw.ADMIN_NAME?.trim() || "Admin",
  smtpHost: raw.SMTP_HOST?.trim() || undefined,
  smtpPort: raw.SMTP_PORT ? Number(raw.SMTP_PORT) : undefined,
  smtpSecure: raw.SMTP_SECURE === "1" || raw.SMTP_SECURE === "true",
  smtpUser: raw.SMTP_USER?.trim() || undefined,
  smtpPass: raw.SMTP_PASS?.trim() || undefined,
  smtpFrom: raw.SMTP_FROM?.trim() || raw.ADMIN_EMAIL?.trim() || undefined
};
