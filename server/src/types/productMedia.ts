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
 * Builds the API media object from legacy product fields.
 * DB-agnostic: only needs URLs; works with MongoDB, SQL, or any store.
 */
export function buildProductMedia(source: ProductMediaSource): ProductMedia {
  const defaultUrl =
    source.viewImage ?? (Array.isArray(source.images) ? source.images[0] : undefined) ?? "";
  const hoverUrl =
    source.hoverImage ?? (Array.isArray(source.images) ? source.images[1] : undefined);
  const videoUrl = Array.isArray(source.videos) && source.videos.length > 0 ? source.videos[0] : undefined;

  const media: ProductMedia = {
    default: {
      type: inferMediaType(defaultUrl),
      url: defaultUrl
    }
  };

  if (hoverUrl) {
    media.hover = { type: inferMediaType(hoverUrl), url: hoverUrl };
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
}

/**
 * Adds media to a product object for API response and omits legacy viewImage, hoverImage, video.
 * Use forList: true on list endpoints (list products, related, newArrivals) to omit images/videos/imageColors.
 */
export function withProductMedia<T extends ProductMediaSource>(
  product: T,
  opts?: WithProductMediaOptions
): Omit<T, "viewImage" | "hoverImage" | "video"> & { media: ProductMedia } {
  const media = buildProductMedia(product);
  const result = { ...product, media } as T & { media: ProductMedia };
  delete (result as Record<string, unknown>).viewImage;
  delete (result as Record<string, unknown>).hoverImage;
  delete (result as Record<string, unknown>).video;
  if (opts?.forList) {
    delete (result as Record<string, unknown>).images;
    delete (result as Record<string, unknown>).videos;
    delete (result as Record<string, unknown>).imageColors;
  }
  return result as Omit<T, "viewImage" | "hoverImage" | "video"> & { media: ProductMedia };
}
