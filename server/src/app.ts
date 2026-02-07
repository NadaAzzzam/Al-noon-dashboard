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
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import { isDbConnected } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, "../uploads");
const uploadsLogosDir = path.join(uploadsDir, "logos");
const uploadsProductsDir = path.join(uploadsDir, "products");
if (!fs.existsSync(uploadsLogosDir)) fs.mkdirSync(uploadsLogosDir, { recursive: true });
if (!fs.existsSync(uploadsProductsDir)) fs.mkdirSync(uploadsProductsDir, { recursive: true });

export const createApp = () => {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", dbConnected: isDbConnected() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/cities", cityRoutes);

  const clientBuildPath = path.resolve(__dirname, "../../admin-dashboard/dist");
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  app.use(errorHandler);

  return app;
};
