import { useEffect } from "react";
import { useTranslation } from "react-i18next";

type ImageLightboxProps = {
  open: boolean;
  src: string | null;
  onClose: () => void;
};

export const ImageLightbox = ({ open, src, onClose }: ImageLightboxProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="image-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("common.view_image", "View image")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="image-lightbox-content">
        <button
          type="button"
          className="image-lightbox-close"
          onClick={onClose}
          aria-label={t("common.close", "Close")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        {src && (
          <img
            src={src}
            alt=""
            className="image-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
};
