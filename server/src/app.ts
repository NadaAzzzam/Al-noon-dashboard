import express from "express";
import cors from "cors";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import subscribersRoutes from "./routes/subscribersRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import { isDbConnected } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { initLocales, localeMiddleware } from "./middlewares/locale.js";
import { sendError, sendResponse } from "./utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, "../uploads");
const uploadsLogosDir = path.join(uploadsDir, "logos");
const uploadsProductsDir = path.join(uploadsDir, "products");
const uploadsProductVideosDir = path.join(uploadsDir, "products", "videos");
const uploadsCollectionsDir = path.join(uploadsDir, "collections");
const uploadsHeroDir = path.join(uploadsDir, "hero");
const uploadsHeroVideosDir = path.join(uploadsDir, "hero", "videos");
const uploadsSectionsDir = path.join(uploadsDir, "sections");
const uploadsSectionVideosDir = path.join(uploadsDir, "sections", "videos");
const uploadsPromoDir = path.join(uploadsDir, "promo");
const uploadsFeedbackDir = path.join(uploadsDir, "feedback");
const uploadsPaymentProofDir = path.join(uploadsDir, "payment-proof");
if (!fs.existsSync(uploadsLogosDir)) fs.mkdirSync(uploadsLogosDir, { recursive: true });
if (!fs.existsSync(uploadsProductsDir)) fs.mkdirSync(uploadsProductsDir, { recursive: true });
if (!fs.existsSync(uploadsProductVideosDir)) fs.mkdirSync(uploadsProductVideosDir, { recursive: true });
if (!fs.existsSync(uploadsCollectionsDir)) fs.mkdirSync(uploadsCollectionsDir, { recursive: true });
if (!fs.existsSync(uploadsHeroDir)) fs.mkdirSync(uploadsHeroDir, { recursive: true });
if (!fs.existsSync(uploadsHeroVideosDir)) fs.mkdirSync(uploadsHeroVideosDir, { recursive: true });
if (!fs.existsSync(uploadsSectionsDir)) fs.mkdirSync(uploadsSectionsDir, { recursive: true });
if (!fs.existsSync(uploadsSectionVideosDir)) fs.mkdirSync(uploadsSectionVideosDir, { recursive: true });
if (!fs.existsSync(uploadsPromoDir)) fs.mkdirSync(uploadsPromoDir, { recursive: true });
if (!fs.existsSync(uploadsFeedbackDir)) fs.mkdirSync(uploadsFeedbackDir, { recursive: true });
if (!fs.existsSync(uploadsPaymentProofDir)) fs.mkdirSync(uploadsPaymentProofDir, { recursive: true });

export const createApp = () => {
  initLocales();
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "https://images.unsplash.com"],
        },
      },
    })
  );
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(localeMiddleware);
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (req, res) => {
    sendResponse(res, req.locale, { data: { status: "ok", dbConnected: isDbConnected() } });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/store", storeRoutes);
  app.use("/api/newsletter", newsletterRoutes);
  app.use("/api/subscribers", subscribersRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/cities", cityRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/feedback", feedbackRoutes);

  const clientBuildPath = path.resolve(__dirname, "../../admin-dashboard/dist");
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return sendError(res, req.locale, { statusCode: 404, code: "errors.common.not_found" });
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  app.use(errorHandler);

  return app;
};
