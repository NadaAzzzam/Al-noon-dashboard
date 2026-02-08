import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logosDir = path.resolve(__dirname, "../../uploads/logos");
const productsDir = path.resolve(__dirname, "../../uploads/products");
const productVideosDir = path.resolve(__dirname, "../../uploads/products/videos");
const collectionsDir = path.resolve(__dirname, "../../uploads/collections");
const heroDir = path.resolve(__dirname, "../../uploads/hero");
const heroVideosDir = path.resolve(__dirname, "../../uploads/hero/videos");
const sectionsDir = path.resolve(__dirname, "../../uploads/sections");
const sectionVideosDir = path.resolve(__dirname, "../../uploads/sections/videos");
const promoDir = path.resolve(__dirname, "../../uploads/promo");

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

const productVideosStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productVideosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    const safeExt = [".mp4", ".webm", ".mov", ".ogg"].includes(ext.toLowerCase()) ? ext : ".mp4";
    cb(null, `video-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`);
  }
});

const videoFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowed = /^video\/(mp4|webm|quicktime|ogg)$/i.test(file.mimetype);
  if (allowed) cb(null, true);
  else cb(new ApiError(400, "Only video files are allowed (MP4, WebM, MOV, OGG)"));
};

export const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
}).single("logo");

const collectionImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, collectionsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".png";
    cb(null, `collection-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`);
  }
});

export const uploadProductImages = multer({
  storage: productImagesStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array("images", 10);

export const uploadProductVideos = multer({
  storage: productVideosStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).array("videos", 10);

export const uploadCollectionImage = multer({
  storage: collectionImageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("image");

const heroImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, heroDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".png";
    cb(null, `hero-${Date.now()}${safeExt}`);
  }
});

export const uploadHeroImage = multer({
  storage: heroImageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("image");

const sectionImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, sectionsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".png";
    cb(null, `section-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`);
  }
});

export const uploadSectionImage = multer({
  storage: sectionImageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("image");

const heroVideoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, heroVideosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    const safeExt = [".mp4", ".webm", ".mov", ".ogg"].includes(ext.toLowerCase()) ? ext : ".mp4";
    cb(null, `hero-video-${Date.now()}${safeExt}`);
  }
});

export const uploadHeroVideo = multer({
  storage: heroVideoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).single("video");

const sectionVideoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, sectionVideosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    const safeExt = [".mp4", ".webm", ".mov", ".ogg"].includes(ext.toLowerCase()) ? ext : ".mp4";
    cb(null, `section-video-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`);
  }
});

export const uploadSectionVideo = multer({
  storage: sectionVideoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).single("video");

/** Public path for uploaded logo (used in response and stored in DB). */
export function logoPath(filename: string): string {
  return `/uploads/logos/${filename}`;
}

/** Public path for uploaded product image. */
export function productImagePath(filename: string): string {
  return `/uploads/products/${filename}`;
}

/** Public path for uploaded product video. */
export function productVideoPath(filename: string): string {
  return `/uploads/products/videos/${filename}`;
}

/** Public path for uploaded collection image (homepage). */
export function collectionImagePath(filename: string): string {
  return `/uploads/collections/${filename}`;
}

/** Public path for uploaded hero image. */
export function heroImagePath(filename: string): string {
  return `/uploads/hero/${filename}`;
}

/** Public path for uploaded hero video. */
export function heroVideoPath(filename: string): string {
  return `/uploads/hero/videos/${filename}`;
}

/** Public path for uploaded section image (New Arrivals / Our Collection banners). */
export function sectionImagePath(filename: string): string {
  return `/uploads/sections/${filename}`;
}

/** Public path for uploaded section video. */
export function sectionVideoPath(filename: string): string {
  return `/uploads/sections/videos/${filename}`;
}

const promoImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, promoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".png";
    cb(null, `promo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`);
  }
});

export const uploadPromoImage = multer({
  storage: promoImageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("image");

/** Public path for uploaded promo banner image. */
export function promoImagePath(filename: string): string {
  return `/uploads/promo/${filename}`;
}
