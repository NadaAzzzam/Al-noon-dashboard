import { describe, it, expect } from "vitest";
import { withProductMedia } from "./productMedia.js";

describe("productMedia", () => {
  describe("withProductMedia - videos and defaultMediaType / hoverMediaType", () => {
    it("uses first video as default when defaultMediaType is video", () => {
      const product = {
        _id: "p1",
        name: { en: "Test", ar: "" },
        images: ["/a.jpg", "/b.jpg"],
        videos: ["/v1.mp4", "/v2.mp4"],
        defaultMediaType: "video" as const,
        hoverMediaType: "image" as const,
      };
      const result = withProductMedia(product);
      expect(result.media.default).toEqual({ type: "video", url: "/v1.mp4" });
      expect(result.media.hover).toEqual({ type: "image", url: "/b.jpg" });
      expect(result.media.previewVideo).toEqual({ type: "video", url: "/v2.mp4" });
    });

    it("uses first video as hover when hoverMediaType is video", () => {
      const product = {
        _id: "p1",
        name: { en: "Test", ar: "" },
        images: ["/a.jpg", "/b.jpg"],
        videos: ["/v1.mp4"],
        defaultMediaType: "image" as const,
        hoverMediaType: "video" as const,
      };
      const result = withProductMedia(product);
      expect(result.media.default).toEqual({ type: "image", url: "/a.jpg" });
      expect(result.media.hover).toEqual({ type: "video", url: "/v1.mp4" });
      expect(result.media.previewVideo).toBeUndefined();
    });

    it("uses video for both default and hover when both set to video", () => {
      const product = {
        _id: "p1",
        name: { en: "Test", ar: "" },
        images: ["/a.jpg"],
        videos: ["/v1.mp4", "/v2.mp4"],
        defaultMediaType: "video" as const,
        hoverMediaType: "video" as const,
      };
      const result = withProductMedia(product);
      expect(result.media.default).toEqual({ type: "video", url: "/v1.mp4" });
      expect(result.media.hover).toEqual({ type: "video", url: "/v1.mp4" });
      expect(result.media.previewVideo).toEqual({ type: "video", url: "/v2.mp4" });
    });

    it("falls back to image when defaultMediaType is video but no videos", () => {
      const product = {
        _id: "p1",
        name: { en: "Test", ar: "" },
        images: ["/a.jpg"],
        videos: [],
        defaultMediaType: "video" as const,
        hoverMediaType: "image" as const,
      };
      const result = withProductMedia(product);
      expect(result.media.default).toEqual({ type: "image", url: "/a.jpg" });
    });

    it("omits images, videos, imageColors when forList is true", () => {
      const product = {
        _id: "p1",
        name: { en: "Test", ar: "" },
        images: ["/a.jpg"],
        videos: ["/v.mp4"],
        imageColors: ["Red"],
        defaultMediaType: "image" as const,
      };
      const result = withProductMedia(product, { forList: true });
      expect(result.media.default).toBeDefined();
      expect("images" in result).toBe(false);
      expect("videos" in result).toBe(false);
      expect("imageColors" in result).toBe(false);
    });

    it("infers video type from .mp4 URL", () => {
      const product = {
        _id: "p1",
        name: { en: "Test", ar: "" },
        videos: ["/uploads/video.mp4"],
        defaultMediaType: "video" as const,
      };
      const result = withProductMedia(product);
      expect(result.media.default.type).toBe("video");
      expect(result.media.default.url).toBe("/uploads/video.mp4");
    });
  });
});
