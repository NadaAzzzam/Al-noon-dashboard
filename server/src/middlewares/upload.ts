import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logosDir = path.resolve(__dirname, "../../uploads/logos");
const productsDir = path.resolve(__dirname, "../../uploads/products");

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".png";
    cb(null, `logo-${Date.now()}${safeExt}`);
  }
});

const productImagesStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".png";
    cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`);
  }
});

const imageFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowed = /^image\/(png|jpeg|jpg|gif|webp)$/i.test(file.mimetype);
  if (allowed) cb(null, true);
  else cb(new ApiError(400, "Only image files are allowed (PNG, JPG, GIF, WEBP)"));
};

export const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
}).single("logo");

export const uploadProductImages = multer({
  storage: productImagesStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array("images", 10);

/** Public path for uploaded logo (used in response and stored in DB). */
export function logoPath(filename: string): string {
  return `/uploads/logos/${filename}`;
}

/** Public path for uploaded product image. */
export function productImagePath(filename: string): string {
  return `/uploads/products/${filename}`;
}
