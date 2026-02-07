import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import customersRoutes from "./routes/customersRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { isDbConnected } from "./config/db.js";
import { t } from "./i18n.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { initLocales, localeMiddleware } from "./middlewares/locale.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initLocales();

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(localeMiddleware);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", dbConnected: isDbConnected() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/customers", customersRoutes);
  app.use("/api/settings", settingsRoutes);

  const clientBuildPath = path.resolve(__dirname, "../../admin-dashboard/dist");
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      const locale = (req as express.Request & { locale?: string }).locale ?? "en";
      const message = t(locale, "errors.common.not_found");
      return res.status(404).json({ message, code: "errors.common.not_found" });
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  app.use(errorHandler);

  return app;
};
