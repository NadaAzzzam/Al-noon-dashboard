import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageLightbox } from "./ImageLightbox";
import "../i18n";

describe("ImageLightbox", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when open is false", () => {
    const { container } = render(
      <ImageLightbox open={false} src="/test.jpg" onClose={onClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders overlay with image when open and src is image url", () => {
    render(<ImageLightbox open src="/uploads/test.jpg" onClose={onClose} />);
    const overlay = document.querySelector(".image-lightbox-overlay");
    expect(overlay).toBeInTheDocument();
    const img = document.querySelector(".image-lightbox-img");
    expect(img).toBeInTheDocument();
    expect(img?.tagName).toBe("IMG");
  });

  it("renders video when src is video url", () => {
    render(<ImageLightbox open src="/uploads/test.mp4" onClose={onClose} />);
    const video = document.querySelector("video.image-lightbox-video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/uploads/test.mp4");
  });

  it("calls onClose when close button is clicked", () => {
    render(<ImageLightbox open src="/test.jpg" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay (backdrop) is clicked", () => {
    render(<ImageLightbox open src="/test.jpg" onClose={onClose} />);
    const overlay = document.querySelector(".image-lightbox-overlay");
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking on image content", () => {
    render(<ImageLightbox open src="/test.jpg" onClose={onClose} />);
    const img = document.querySelector(".image-lightbox-img");
    expect(img).toBeInTheDocument();
    fireEvent.click(img!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    render(<ImageLightbox open src="/test.jpg" onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
