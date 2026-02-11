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
import reportsRoutes from "./routes/reportsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import translationRoutes from "./routes/translationRoutes.js";
import shippingMethodRoutes from "./routes/shippingMethodRoutes.js";
import { swaggerSpec } from "./swagger.js";
import { isDbConnected } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { initLocales, localeMiddleware } from "./middlewares/locale.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
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
const defaultLogoSource = path.resolve(__dirname, "../default-assets/default-logo.png");
const defaultLogoDest = path.join(uploadsLogosDir, "default-logo.png");
if (fs.existsSync(defaultLogoSource) && !fs.existsSync(defaultLogoDest)) {
  fs.copyFileSync(defaultLogoSource, defaultLogoDest);
}
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
  const allowedOrigins = [
    env.clientUrl,
    "http://localhost:5173",
    "http://localhost:4200",
  ].filter(Boolean);
  const originSet = new Set(allowedOrigins);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || originSet.has(origin)) return cb(null, true);
        if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin))
          return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    })
  );
  app.use(requestIdMiddleware);
  app.use(cookieParser());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(localeMiddleware);
  app.use("/api", apiLimiter);
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (req, res) => {
    sendResponse(res, req.locale, { data: { status: "ok", dbConnected: isDbConnected() } });
  });

  // Swagger UI: custom HTML so we control which initializer runs; spec loaded by URL
  const noStore = (res: express.Response) => res.set("Cache-Control", "no-store");
  app.get(["/api-docs", "/api-docs/"], (req, res) => {
    noStore(res);
    res.type("text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Al-Noon API Docs</title>
  <link rel="stylesheet" href="/api-docs/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/api-docs/swagger-ui-bundle.js"></script>
  <script src="/api-docs/swagger-ui-standalone-preset.js"></script>
  <script src="/api-docs/swagger-initializer.js"></script>
</body>
</html>`);
  });
  app.get("/api-docs/spec.json", (_req, res) => {
    noStore(res);
    const spec = JSON.parse(JSON.stringify(swaggerSpec));
    res.type("application/json");
    res.send(JSON.stringify(spec));
  });
  app.get("/api-docs/swagger-initializer.js", (_req, res) => {
    noStore(res);
    res.type("application/javascript");
    res.send(
      `window.onload = function() {
  fetch("/api-docs/spec.json")
    .then(function(r) { return r.json(); })
    .then(function(spec) {
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        presets: [ SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset ],
        plugins: [ SwaggerUIBundle.plugins.DownloadUrl ],
        layout: "StandaloneLayout"
      });
    })
    .catch(function(e) { console.error("Failed to load spec", e); });
};`
    );
  });
  app.use("/api-docs", express.static(path.join(__dirname, "../node_modules/swagger-ui-dist")));

  app.use("/api/auth", authLimiter, authRoutes);
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
  app.use("/api/reports", reportsRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/translations", translationRoutes);
  app.use("/api/shipping-methods", shippingMethodRoutes);
  app.use("/api", checkoutRoutes);

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
