/**
 * Product media response structure (REST API)
 * -------------------------------------------
 * Design goals:
 * - One generic, reusable media type for all products (image | video | gif).
 * - Explicit media type so the frontend can choose <img>, <video>, or GIF handling.
 * - Default media (required for display), optional hover media, optional preview video.
 * - DB-agnostic: stored as URLs + optional type; backend builds this shape from
 *   existing fields (images[], viewImage, hoverImage, videos[]) for backward compatibility.
 * - Extensible: MediaItem can gain optional thumbnail, alt, duration, etc. later.
 *
 * JSON shape in API response:
 *
 *   "media": {
 *     "default": { "type": "image", "url": "https://..." },   // required
 *     "hover":   { "type": "image", "url": "https://..." },   // optional
 *     "previewVideo": { "type": "video", "url": "https://..." } // optional
 *   }
 *
 * Legacy viewImage, hoverImage, video are not returned; only media is in the response.
 */

export type MediaType = "image" | "video" | "gif";

export interface ProductMediaItem {
  /** Explicit type so frontend can render <img>, <video>, or GIF. */
  type: MediaType;
  /** Absolute or relative URL to the asset. */
  url: string;
  /** Optional: for accessibility and SEO. Can be added later. */
  alt?: string;
  /** Optional: for video duration display. Can be added later. */
  durationSeconds?: number;
}

export interface ProductMedia {
  /** Shown by default (product card and detail). Required. */
  default: ProductMediaItem;
  /** Shown on hover (e.g. product card). Optional. */
  hover?: ProductMediaItem;
  /** Optional preview video (e.g. product detail). */
  previewVideo?: ProductMediaItem;
}

/** Legacy product shape from DB (images, viewImage, hoverImage, videos). */
export interface ProductMediaSource {
  images?: string[];
  viewImage?: string;
  hoverImage?: string;
  videos?: string[];
  imageColors?: string[];
  defaultMediaType?: "image" | "video";
  hoverMediaType?: "image" | "video";
}

/**
 * Infers MediaType from URL (e.g. .gif -> gif, .mp4/.webm -> video, else image).
 * Overridable if you store type in DB later.
 */
function inferMediaType(url: string): MediaType {
  if (!url) return "image";
  const lower = url.toLowerCase();
  if (lower.includes(".gif") || lower.endsWith(".gif")) return "gif";
  if (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mov") ||
    lower.includes("video")
  )
    return "video";
  return "image";
}

/**
 * Filters images by color based on imageColors array.
 * If color is specified, returns only images where imageColors[i] matches (case-insensitive).
 * Falls back to default images (empty color string) if no exact match found.
 */
function filterImagesByColor(
  images: string[] | undefined,
  imageColors: string[] | undefined,
  targetColor?: string
): string[] {
  if (!targetColor || !Array.isArray(images) || images.length === 0) {
    return images ?? [];
  }

  const colors = Array.isArray(imageColors) ? imageColors : [];
  const normalizedTarget = targetColor.toLowerCase().trim();

  // Find images matching the target color
  const matchedImages = images.filter((_, idx) => {
    const imgColor = (colors[idx] ?? "").toLowerCase().trim();
    return imgColor === normalizedTarget;
  });

  // If found, return matched images; otherwise return default (empty color) images
  if (matchedImages.length > 0) {
    return matchedImages;
  }

  // Fallback to default images (empty color string)
  const defaultImages = images.filter((_, idx) => {
    const imgColor = (colors[idx] ?? "").trim();
    return imgColor === "";
  });

  return defaultImages.length > 0 ? defaultImages : images;
}

/**
 * Builds the API media object from legacy product fields.
 * DB-agnostic: only needs URLs; works with MongoDB, SQL, or any store.
 * Supports color filtering to show color-specific images.
 * Respects defaultMediaType and hoverMediaType preferences:
 * - If defaultMediaType is "video" and videos exist, uses first video as default
 * - If hoverMediaType is "video" and videos exist, uses first video as hover
 * - Otherwise falls back to image behavior
 */
export function buildProductMedia(source: ProductMediaSource, color?: string): ProductMedia {
  const filteredImages = filterImagesByColor(source.images, source.imageColors, color);
  const hasVideos = Array.isArray(source.videos) && source.videos.length > 0;

  // Determine default media based on preference
  let defaultUrl: string;
  let defaultType: MediaType;

  if (source.defaultMediaType === "video" && hasVideos) {
    defaultUrl = source.videos![0];
    defaultType = "video";
  } else if (source.viewImage) {
    defaultUrl = source.viewImage;
    defaultType = inferMediaType(source.viewImage);
  } else if (filteredImages.length > 0) {
    defaultUrl = filteredImages[0];
    defaultType = inferMediaType(filteredImages[0]);
  } else {
    defaultUrl = "";
    defaultType = "image";
  }

  // Determine hover media based on preference
  let hoverUrl: string | undefined;
  let hoverType: MediaType | undefined;

  if (source.hoverMediaType === "video" && hasVideos) {
    hoverUrl = source.videos![0];
    hoverType = "video";
  } else if (source.hoverImage) {
    hoverUrl = source.hoverImage;
    hoverType = inferMediaType(source.hoverImage);
  } else if (filteredImages.length > 1) {
    hoverUrl = filteredImages[1];
    hoverType = inferMediaType(filteredImages[1]);
  }

  // Build preview video (only if not already used for default or hover)
  let videoUrl: string | undefined;
  if (hasVideos) {
    // If video is used for default or hover, use the second video (if available) for preview
    if (source.defaultMediaType === "video" || source.hoverMediaType === "video") {
      videoUrl = source.videos!.length > 1 ? source.videos![1] : undefined;
    } else {
      videoUrl = source.videos![0];
    }
  }

  const media: ProductMedia = {
    default: {
      type: defaultType,
      url: defaultUrl
    }
  };

  if (hoverUrl) {
    media.hover = { type: hoverType!, url: hoverUrl };
  }

  if (videoUrl) {
    media.previewVideo = { type: "video", url: videoUrl };
  }

  return media;
}

/**
 * Response shape for a product: only media (no legacy viewImage/hoverImage/video).
 */
export interface ProductResponseMedia {
  media: ProductMedia;
}

export interface WithProductMediaOptions {
  /** When true, omit images, videos, imageColors (for list/card responses; gallery only needed on detail). */
  forList?: boolean;
  /** Filter images by specific color. If provided, only returns images matching this color. Falls back to default if no match. */
  color?: string;
}

/**
 * Adds media to a product object for API response and omits legacy viewImage, hoverImage, video.
 * Use forList: true on list endpoints (list products, related, newArrivals) to omit images/videos/imageColors.
 * Use color parameter to filter images by specific color.
 */
export function withProductMedia<T extends ProductMediaSource>(
  product: T,
  opts?: WithProductMediaOptions
): Omit<T, "viewImage" | "hoverImage" | "video"> & { media: ProductMedia } {
  const media = buildProductMedia(product, opts?.color);
  const result = { ...product, media } as T & { media: ProductMedia };
  const resultRecord = result as unknown as Record<string, unknown>;
  delete resultRecord.viewImage;
  delete resultRecord.hoverImage;
  delete resultRecord.video;

  // Filter images array by color if color parameter is provided
  if (opts?.color) {
    const filteredImages = filterImagesByColor(product.images, product.imageColors, opts.color);
    resultRecord.images = filteredImages;
  }

  if (opts?.forList) {
    delete resultRecord.images;
    delete resultRecord.videos;
    delete resultRecord.imageColors;
  }
  return result as Omit<T, "viewImage" | "hoverImage" | "video"> & { media: ProductMedia };
}
