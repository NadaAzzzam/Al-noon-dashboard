import { useRef } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Settings, getUploadsBaseUrl } from "../services/api";

type HeroForm = {
  images: string[];
  videos: string[];
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaLabelEn: string;
  ctaLabelAr: string;
  ctaUrl: string;
};

type CollectionCardForm = {
  titleEn: string;
  titleAr: string;
  image: string;
  url: string;
  order: number;
};

type AnnouncementBarForm = {
  textEn: string;
  textAr: string;
  enabled: boolean;
  backgroundColor: string;
};

type PromoBannerForm = {
  enabled: boolean;
  image: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaLabelEn: string;
  ctaLabelAr: string;
  ctaUrl: string;
};

type HomePageForm = {
  announcementBar: AnnouncementBarForm;
  hero: HeroForm;
  heroEnabled: boolean;
  promoBanner: PromoBannerForm;
  newArrivalsLimit: number;
  newArrivalsSectionImages: string[];
  newArrivalsSectionVideos: string[];
  featuredProductsEnabled: boolean;
  featuredProductsLimit: number;
  feedbackSectionEnabled: boolean;
  feedbackDisplayLimit: number;
  homeCollectionsDisplayLimit: number;
  ourCollectionSectionImages: string[];
  ourCollectionSectionVideos: string[];
  homeCollections: CollectionCardForm[];
};

/** Full URL for hero/section media. Supports relative paths (uploads) and absolute URLs (e.g. seeder). */
const getMediaUrl = (path: string) =>
  path ? (path.startsWith("http") ? path : getUploadsBaseUrl() + path) : "";

const HomePageSettingsPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<HomePageForm>({
    announcementBar: {
      textEn: "",
      textAr: "",
      enabled: false,
      backgroundColor: "#0f172a",
    },
    hero: {
      images: [],
      videos: [],
      titleEn: "",
      titleAr: "",
      subtitleEn: "",
      subtitleAr: "",
      ctaLabelEn: "",
      ctaLabelAr: "",
      ctaUrl: "",
    },
    heroEnabled: true,
    promoBanner: {
      enabled: false,
      image: "",
      titleEn: "",
      titleAr: "",
      subtitleEn: "",
      subtitleAr: "",
      ctaLabelEn: "",
      ctaLabelAr: "",
      ctaUrl: "",
    },
    newArrivalsLimit: 8,
    newArrivalsSectionImages: [],
    newArrivalsSectionVideos: [],
    featuredProductsEnabled: false,
    featuredProductsLimit: 8,
    feedbackSectionEnabled: false,
    feedbackDisplayLimit: 6,
    homeCollectionsDisplayLimit: 0,
    ourCollectionSectionImages: [],
    ourCollectionSectionVideos: [],
    homeCollections: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [uploadingCollectionIndex, setUploadingCollectionIndex] = useState<
    number | null
  >(null);

  // Refs for file inputs
  const heroImageRef = useRef<HTMLInputElement>(null);
  const heroVideoRef = useRef<HTMLInputElement>(null);
  const newArrivalsImageRef = useRef<HTMLInputElement>(null);
  const newArrivalsVideoRef = useRef<HTMLInputElement>(null);
  const ourCollectionImageRef = useRef<HTMLInputElement>(null);
  const ourCollectionVideoRef = useRef<HTMLInputElement>(null);
  const promoImageRef = useRef<HTMLInputElement>(null);
  const collectionImageRef = useRef<HTMLInputElement>(null);

  const isUploading = (key: string) => uploading[key] ?? false;
  const setUploadingKey = (key: string, value: boolean) =>
    setUploading((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    api
      .getSettings()
      .then((res: unknown) => {
        const body = res as { data?: { settings: Settings }; settings?: Settings };
        const d = body.data?.settings ?? body.settings;
        if (!d) return;
        const h = (
          d as {
            hero?: {
              images?: string[];
              videos?: string[];
              title?: { en?: string; ar?: string };
              subtitle?: { en?: string; ar?: string };
              ctaLabel?: { en?: string; ar?: string };
              ctaUrl?: string;
            };
          }
        ).hero;
        const ab = (
          d as {
            announcementBar?: {
              text?: { en?: string; ar?: string };
              enabled?: boolean;
              backgroundColor?: string;
            };
          }
        ).announcementBar;
        const pb = (
          d as {
            promoBanner?: {
              enabled?: boolean;
              image?: string;
              title?: { en?: string; ar?: string };
              subtitle?: { en?: string; ar?: string };
              ctaLabel?: { en?: string; ar?: string };
              ctaUrl?: string;
            };
          }
        ).promoBanner;
        const collections = (d.homeCollections ?? []).map(
          (
            c: {
              title?: { en?: string; ar?: string };
              image?: string;
              url?: string;
              order?: number;
            },
            i: number,
          ) => ({
            titleEn: c.title?.en ?? "",
            titleAr: c.title?.ar ?? "",
            image: c.image ?? "",
            url: c.url ?? "",
            order: (c.order ?? i) as number,
          }),
        );
        setForm({
          announcementBar: {
            textEn: ab?.text?.en ?? "",
            textAr: ab?.text?.ar ?? "",
            enabled: ab?.enabled ?? false,
            backgroundColor: ab?.backgroundColor ?? "#0f172a",
          },
          hero: {
            images: h?.images ?? [],
            videos: h?.videos ?? [],
            titleEn: h?.title?.en ?? "",
            titleAr: h?.title?.ar ?? "",
            subtitleEn: h?.subtitle?.en ?? "",
            subtitleAr: h?.subtitle?.ar ?? "",
            ctaLabelEn: h?.ctaLabel?.en ?? "",
            ctaLabelAr: h?.ctaLabel?.ar ?? "",
            ctaUrl: h?.ctaUrl ?? "",
          },
          heroEnabled: (d as { heroEnabled?: boolean }).heroEnabled ?? true,
          promoBanner: {
            enabled: pb?.enabled ?? false,
            image: pb?.image ?? "",
            titleEn: pb?.title?.en ?? "",
            titleAr: pb?.title?.ar ?? "",
            subtitleEn: pb?.subtitle?.en ?? "",
            subtitleAr: pb?.subtitle?.ar ?? "",
            ctaLabelEn: pb?.ctaLabel?.en ?? "",
            ctaLabelAr: pb?.ctaLabel?.ar ?? "",
            ctaUrl: pb?.ctaUrl ?? "",
          },
          newArrivalsLimit: Math.max(
            1,
            Math.min(
              24,
              (d as { newArrivalsLimit?: number }).newArrivalsLimit ?? 8,
            ),
          ),
          newArrivalsSectionImages:
            (d as { newArrivalsSectionImages?: string[] })
              .newArrivalsSectionImages ?? [],
          newArrivalsSectionVideos:
            (d as { newArrivalsSectionVideos?: string[] })
              .newArrivalsSectionVideos ?? [],
          featuredProductsEnabled:
            (d as { featuredProductsEnabled?: boolean })
              .featuredProductsEnabled ?? false,
          featuredProductsLimit: Math.max(
            1,
            Math.min(
              24,
              (d as { featuredProductsLimit?: number }).featuredProductsLimit ??
                8,
            ),
          ),
          feedbackSectionEnabled:
            (d as { feedbackSectionEnabled?: boolean }).feedbackSectionEnabled ?? false,
          feedbackDisplayLimit: Math.max(
            0,
            Math.min(50, (d as { feedbackDisplayLimit?: number }).feedbackDisplayLimit ?? 6),
          ),
          homeCollectionsDisplayLimit: Math.max(
            0,
            (d as { homeCollectionsDisplayLimit?: number })
              .homeCollectionsDisplayLimit ?? 0,
          ),
          ourCollectionSectionImages:
            (d as { ourCollectionSectionImages?: string[] })
              .ourCollectionSectionImages ?? [],
          ourCollectionSectionVideos:
            (d as { ourCollectionSectionVideos?: string[] })
              .ourCollectionSectionVideos ?? [],
          homeCollections: collections,
        });
      })
      .catch(() => setError(t("settings.failed_load")));
  }, [t]);

  // Upload handlers
  const uploadImage = async (
    file: File,
    uploadFn: (f: File) => Promise<string>,
    key: string,
    onSuccess: (path: string) => void,
  ) => {
    if (!file.type.startsWith("image/")) {
      setError(t("settings.logo_invalid_type"));
      return;
    }
    setError(null);
    setUploadingKey(key, true);
    try {
      const path = await uploadFn(file);
      onSuccess(path);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("settings.logo_upload_failed"),
      );
    } finally {
      setUploadingKey(key, false);
    }
  };

  const uploadVideo = async (
    file: File,
    uploadFn: (f: File) => Promise<string>,
    key: string,
    onSuccess: (path: string) => void,
  ) => {
    if (!file.type.startsWith("video/")) {
      setError("Only video files are allowed (MP4, WebM, MOV, OGG).");
      return;
    }
    setError(null);
    setUploadingKey(key, true);
    try {
      const path = await uploadFn(file);
      onSuccess(path);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("settings.logo_upload_failed"),
      );
    } finally {
      setUploadingKey(key, false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
    uploadFn: (f: File) => Promise<string>,
    key: string,
    onSuccess: (path: string) => void,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (type === "image") uploadImage(file, uploadFn, key, onSuccess);
    else uploadVideo(file, uploadFn, key, onSuccess);
  };

  const handleDrop = (
    e: React.DragEvent,
    type: "image" | "video",
    uploadFn: (f: File) => Promise<string>,
    key: string,
    onSuccess: (path: string) => void,
  ) => {
    e.preventDefault();
    setDragOverZone(null);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (type === "image") uploadImage(file, uploadFn, key, onSuccess);
    else uploadVideo(file, uploadFn, key, onSuccess);
  };

  // Hero media
  const addHeroImage = (path: string) =>
    setForm((f) => ({
      ...f,
      hero: { ...f.hero, images: [...f.hero.images, path] },
    }));
  const addHeroVideo = (path: string) =>
    setForm((f) => ({
      ...f,
      hero: { ...f.hero, videos: [...f.hero.videos, path] },
    }));

  // Section media
  const addToArray = (field: keyof HomePageForm, path: string) =>
    setForm((f) => ({ ...f, [field]: [...(f[field] as string[]), path] }));

  const removeMedia = (
    section: "hero" | "newArrivals" | "ourCollection",
    type: "images" | "videos",
    index: number,
  ) => {
    if (section === "hero") {
      setForm((f) => ({
        ...f,
        hero: { ...f.hero, [type]: f.hero[type].filter((_, i) => i !== index) },
      }));
    } else if (section === "newArrivals") {
      const key =
        type === "images"
          ? "newArrivalsSectionImages"
          : "newArrivalsSectionVideos";
      setForm((f) => ({
        ...f,
        [key]: (f[key] as string[]).filter((_, i) => i !== index),
      }));
    } else {
      const key =
        type === "images"
          ? "ourCollectionSectionImages"
          : "ourCollectionSectionVideos";
      setForm((f) => ({
        ...f,
        [key]: (f[key] as string[]).filter((_, i) => i !== index),
      }));
    }
  };

  // Collection helpers
  const triggerCollectionImageUpload = (index: number) => {
    setUploadingCollectionIndex(index);
    collectionImageRef.current?.click();
  };
  const handleCollectionImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    const idx = uploadingCollectionIndex;
    e.target.value = "";
    setUploadingCollectionIndex(null);
    if (file == null || idx == null) return;
    if (!file.type.startsWith("image/")) {
      setError(t("settings.logo_invalid_type"));
      return;
    }
    setError(null);
    try {
      const imagePath = await api.uploadCollectionImage(file);
      setForm((f) => ({
        ...f,
        homeCollections: f.homeCollections.map((c, i) =>
          i === idx ? { ...c, image: imagePath } : c,
        ),
      }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("settings.logo_upload_failed"),
      );
    }
  };
  const addCollection = () => {
    setForm((f) => ({
      ...f,
      homeCollections: [
        ...f.homeCollections,
        {
          titleEn: "",
          titleAr: "",
          image: "",
          url: "",
          order: f.homeCollections.length,
        },
      ],
    }));
  };
  const removeCollection = (index: number) => {
    setForm((f) => ({
      ...f,
      homeCollections: f.homeCollections.filter((_, i) => i !== index),
    }));
  };
  const updateCollection = (
    index: number,
    patch: Partial<CollectionCardForm>,
  ) => {
    setForm((f) => ({
      ...f,
      homeCollections: f.homeCollections.map((c, i) =>
        i === index ? { ...c, ...patch } : c,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings({
        announcementBar: {
          textEn: form.announcementBar.textEn.trim(),
          textAr: form.announcementBar.textAr.trim(),
          enabled: form.announcementBar.enabled,
          backgroundColor: form.announcementBar.backgroundColor.trim(),
        },
        hero: {
          images: form.hero.images,
          videos: form.hero.videos,
          titleEn: form.hero.titleEn.trim(),
          titleAr: form.hero.titleAr.trim(),
          subtitleEn: form.hero.subtitleEn.trim(),
          subtitleAr: form.hero.subtitleAr.trim(),
          ctaLabelEn: form.hero.ctaLabelEn.trim(),
          ctaLabelAr: form.hero.ctaLabelAr.trim(),
          ctaUrl: form.hero.ctaUrl.trim(),
        },
        heroEnabled: form.heroEnabled,
        promoBanner: {
          enabled: form.promoBanner.enabled,
          image: form.promoBanner.image,
          titleEn: form.promoBanner.titleEn.trim(),
          titleAr: form.promoBanner.titleAr.trim(),
          subtitleEn: form.promoBanner.subtitleEn.trim(),
          subtitleAr: form.promoBanner.subtitleAr.trim(),
          ctaLabelEn: form.promoBanner.ctaLabelEn.trim(),
          ctaLabelAr: form.promoBanner.ctaLabelAr.trim(),
          ctaUrl: form.promoBanner.ctaUrl.trim(),
        },
        newArrivalsLimit: form.newArrivalsLimit,
        newArrivalsSectionImages: form.newArrivalsSectionImages,
        newArrivalsSectionVideos: form.newArrivalsSectionVideos,
        featuredProductsEnabled: form.featuredProductsEnabled,
        featuredProductsLimit: form.featuredProductsLimit,
        feedbackSectionEnabled: form.feedbackSectionEnabled,
        feedbackDisplayLimit: form.feedbackDisplayLimit,
        homeCollectionsDisplayLimit: form.homeCollectionsDisplayLimit,
        ourCollectionSectionImages: form.ourCollectionSectionImages,
        ourCollectionSectionVideos: form.ourCollectionSectionVideos,
        homeCollections: form.homeCollections.map((c, idx) => ({
          titleEn: c.titleEn.trim(),
          titleAr: c.titleAr.trim(),
          image: c.image.trim(),
          url: c.url.trim(),
          order: idx,
        })),
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("settings.failed_save"),
      );
    }
  };

  // Reusable upload zone component
  const renderUploadZone = (
    zoneKey: string,
    type: "image" | "video",
    inputRef: React.RefObject<HTMLInputElement | null>,
    accept: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onDrop: (e: React.DragEvent) => void,
  ) => (
    <div
      className={`product-form-upload-zone ${dragOverZone === zoneKey ? "drag-over" : ""} ${isUploading(zoneKey) ? "uploading" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverZone(zoneKey);
      }}
      onDragLeave={() => setDragOverZone(null)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={isUploading(zoneKey)}
      />
      <p className="product-form-upload-text">
        {isUploading(zoneKey)
          ? t("common.loading")
          : type === "image"
            ? t("settings.upload_image")
            : t("settings.upload_video")}
      </p>
      <p className="product-form-upload-hint">
        {type === "image"
          ? t("settings.upload_image_hint")
          : t("settings.upload_video_hint")}
      </p>
    </div>
  );

  // Reusable media grid
  const renderMediaGrid = (
    images: string[],
    videos: string[],
    section: "hero" | "newArrivals" | "ourCollection",
  ) => {
    const items: { path: string; type: "image" | "video"; idx: number }[] = [
      ...images.map((path, idx) => ({ path, type: "image" as const, idx })),
      ...videos.map((path, idx) => ({ path, type: "video" as const, idx })),
    ];
    if (items.length === 0) return null;
    return (
      <div className="home-media-grid">
        {items.map((item) => (
          <div
            key={`${item.type}-${item.path}`}
            className="home-media-grid-item"
          >
            {item.type === "image" ? (
              <img src={getMediaUrl(item.path)} alt="" />
            ) : (
              <video src={getMediaUrl(item.path)} muted playsInline />
            )}
            <button
              type="button"
              className="product-form-image-remove"
              onClick={() =>
                removeMedia(
                  section,
                  item.type === "image" ? "images" : "videos",
                  item.idx,
                )
              }
              title={t("common.remove")}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="settings-page settings-page-full-width home-page-settings">
      {error && (
        <div className="error settings-message" role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className="badge badge-success settings-message" role="status">
          {t("common.saved")}
        </div>
      )}
      <div className="header">
        <div>
          <h1>{t("settings.home_page_title")}</h1>
          <p className="header-subtitle">{t("settings.home_page_subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="home-page-settings-form">
        {/* ——— Announcement Bar ——— */}
        <section className="home-section-card card">
          <h2 className="home-section-card-title">
            {t("settings.section_announcement_bar")}
          </h2>
          <p className="settings-hint home-section-hint">
            {t("settings.announcement_bar_hint")}
          </p>
          <div className="home-section-body">
            <label className="checkbox-label home-section-toggle">
              <input
                type="checkbox"
                checked={form.announcementBar.enabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    announcementBar: {
                      ...f.announcementBar,
                      enabled: e.target.checked,
                    },
                  }))
                }
              />
              <span>{t("settings.announcement_enabled")}</span>
            </label>
            <div className="home-two-cols">
              <div className="home-col">
                <h4 className="home-col-label">English</h4>
                <div className="form-group">
                  <label>{t("settings.announcement_text_en")}</label>
                  <input
                    type="text"
                    value={form.announcementBar.textEn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        announcementBar: {
                          ...f.announcementBar,
                          textEn: e.target.value,
                        },
                      }))
                    }
                    placeholder="Free shipping on orders over 500 EGP!"
                  />
                </div>
              </div>
              <div className="home-col">
                <h4 className="home-col-label">العربية</h4>
                <div className="form-group">
                  <label>{t("settings.announcement_text_ar")}</label>
                  <input
                    type="text"
                    value={form.announcementBar.textAr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        announcementBar: {
                          ...f.announcementBar,
                          textAr: e.target.value,
                        },
                      }))
                    }
                    placeholder="شحن مجاني للطلبات فوق ٥٠٠ جنيه!"
                  />
                </div>
              </div>
            </div>
            <div className="form-group form-group-narrow">
              <label>{t("settings.announcement_bg_color")}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={form.announcementBar.backgroundColor}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      announcementBar: {
                        ...f.announcementBar,
                        backgroundColor: e.target.value,
                      },
                    }))
                  }
                  style={{
                    width: 40,
                    height: 36,
                    padding: 2,
                    cursor: "pointer",
                  }}
                />
                <input
                  type="text"
                  value={form.announcementBar.backgroundColor}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      announcementBar: {
                        ...f.announcementBar,
                        backgroundColor: e.target.value,
                      },
                    }))
                  }
                  placeholder="#0f172a"
                  style={{ width: 100 }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ——— Hero ——— */}
        <section className="home-section-card card">
          <h2 className="home-section-card-title">
            {t("settings.section_hero")}
          </h2>
          <p className="settings-hint home-section-hint">
            {t("settings.hero_hint")}
          </p>
          <div className="home-section-body">
            <label className="checkbox-label home-section-toggle">
              <input
                type="checkbox"
                checked={form.heroEnabled}
                onChange={(e) =>
                  setForm({ ...form, heroEnabled: e.target.checked })
                }
              />
              <span>{t("settings.hero_enabled")}</span>
            </label>

            <label className="home-section-media-label">
              {t("settings.hero_images_videos")}
            </label>

            {/* Image upload zone */}
            {renderUploadZone(
              "heroImage",
              "image",
              heroImageRef,
              "image/png,image/jpeg,image/jpg,image/gif,image/webp",
              (e) =>
                handleFileChange(
                  e,
                  "image",
                  api.uploadHeroImage,
                  "heroImage",
                  addHeroImage,
                ),
              (e) =>
                handleDrop(
                  e,
                  "image",
                  api.uploadHeroImage,
                  "heroImage",
                  addHeroImage,
                ),
            )}
            {renderMediaGrid(form.hero.images, [], "hero")}

            {/* Video upload zone */}
            {renderUploadZone(
              "heroVideo",
              "video",
              heroVideoRef,
              "video/mp4,video/webm,video/quicktime,video/ogg",
              (e) =>
                handleFileChange(
                  e,
                  "video",
                  api.uploadHeroVideo,
                  "heroVideo",
                  addHeroVideo,
                ),
              (e) =>
                handleDrop(
                  e,
                  "video",
                  api.uploadHeroVideo,
                  "heroVideo",
                  addHeroVideo,
                ),
            )}
            {renderMediaGrid([], form.hero.videos, "hero")}

            <div className="home-two-cols">
              <div className="home-col">
                <h4 className="home-col-label">English</h4>
                <div className="form-group">
                  <label>{t("settings.hero_title_en")}</label>
                  <input
                    type="text"
                    value={form.hero.titleEn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hero: { ...f.hero, titleEn: e.target.value },
                      }))
                    }
                    placeholder={t("settings.hero_title_en")}
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.hero_subtitle_en")}</label>
                  <input
                    type="text"
                    value={form.hero.subtitleEn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hero: { ...f.hero, subtitleEn: e.target.value },
                      }))
                    }
                    placeholder={t("settings.hero_subtitle_en")}
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.hero_cta_label_en")}</label>
                  <input
                    type="text"
                    value={form.hero.ctaLabelEn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hero: { ...f.hero, ctaLabelEn: e.target.value },
                      }))
                    }
                    placeholder={t("settings.hero_cta_label_en")}
                  />
                </div>
              </div>
              <div className="home-col">
                <h4 className="home-col-label">العربية</h4>
                <div className="form-group">
                  <label>{t("settings.hero_title_ar")}</label>
                  <input
                    type="text"
                    value={form.hero.titleAr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hero: { ...f.hero, titleAr: e.target.value },
                      }))
                    }
                    placeholder={t("settings.hero_title_ar")}
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.hero_subtitle_ar")}</label>
                  <input
                    type="text"
                    value={form.hero.subtitleAr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hero: { ...f.hero, subtitleAr: e.target.value },
                      }))
                    }
                    placeholder={t("settings.hero_subtitle_ar")}
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.hero_cta_label_ar")}</label>
                  <input
                    type="text"
                    value={form.hero.ctaLabelAr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hero: { ...f.hero, ctaLabelAr: e.target.value },
                      }))
                    }
                    placeholder={t("settings.hero_cta_label_ar")}
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>{t("settings.hero_cta_url")}</label>
              <input
                type="text"
                value={form.hero.ctaUrl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hero: { ...f.hero, ctaUrl: e.target.value },
                  }))
                }
                placeholder="/shop or https://..."
              />
            </div>
          </div>
        </section>

        {/* ——— Promotional Banner ——— */}
        <section className="home-section-card card">
          <h2 className="home-section-card-title">
            {t("settings.section_promo_banner")}
          </h2>
          <p className="settings-hint home-section-hint">
            {t("settings.promo_banner_hint")}
          </p>
          <div className="home-section-body">
            <label className="checkbox-label home-section-toggle">
              <input
                type="checkbox"
                checked={form.promoBanner.enabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    promoBanner: {
                      ...f.promoBanner,
                      enabled: e.target.checked,
                    },
                  }))
                }
              />
              <span>{t("settings.promo_enabled")}</span>
            </label>

            {/* Promo image upload */}
            {renderUploadZone(
              "promoImage",
              "image",
              promoImageRef,
              "image/png,image/jpeg,image/jpg,image/gif,image/webp",
              (e) =>
                handleFileChange(
                  e,
                  "image",
                  api.uploadPromoImage,
                  "promoImage",
                  (path) =>
                    setForm((f) => ({
                      ...f,
                      promoBanner: { ...f.promoBanner, image: path },
                    })),
                ),
              (e) =>
                handleDrop(
                  e,
                  "image",
                  api.uploadPromoImage,
                  "promoImage",
                  (path) =>
                    setForm((f) => ({
                      ...f,
                      promoBanner: { ...f.promoBanner, image: path },
                    })),
                ),
            )}
            {form.promoBanner.image && (
              <div className="home-media-grid">
                <div className="home-media-grid-item">
                  <img src={getMediaUrl(form.promoBanner.image)} alt="" />
                  <button
                    type="button"
                    className="product-form-image-remove"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        promoBanner: { ...f.promoBanner, image: "" },
                      }))
                    }
                    title={t("common.remove")}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}

            <div className="home-two-cols">
              <div className="home-col">
                <h4 className="home-col-label">English</h4>
                <div className="form-group">
                  <label>{t("settings.promo_title_en")}</label>
                  <input
                    type="text"
                    value={form.promoBanner.titleEn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promoBanner: {
                          ...f.promoBanner,
                          titleEn: e.target.value,
                        },
                      }))
                    }
                    placeholder="Summer Sale - Up to 50% Off"
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.promo_subtitle_en")}</label>
                  <input
                    type="text"
                    value={form.promoBanner.subtitleEn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promoBanner: {
                          ...f.promoBanner,
                          subtitleEn: e.target.value,
                        },
                      }))
                    }
                    placeholder="Limited time offer"
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.promo_cta_label_en")}</label>
                  <input
                    type="text"
                    value={form.promoBanner.ctaLabelEn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promoBanner: {
                          ...f.promoBanner,
                          ctaLabelEn: e.target.value,
                        },
                      }))
                    }
                    placeholder="Shop Now"
                  />
                </div>
              </div>
              <div className="home-col">
                <h4 className="home-col-label">العربية</h4>
                <div className="form-group">
                  <label>{t("settings.promo_title_ar")}</label>
                  <input
                    type="text"
                    value={form.promoBanner.titleAr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promoBanner: {
                          ...f.promoBanner,
                          titleAr: e.target.value,
                        },
                      }))
                    }
                    placeholder="تخفيضات الصيف - خصم حتى ٥٠٪"
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.promo_subtitle_ar")}</label>
                  <input
                    type="text"
                    value={form.promoBanner.subtitleAr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promoBanner: {
                          ...f.promoBanner,
                          subtitleAr: e.target.value,
                        },
                      }))
                    }
                    placeholder="عرض محدود"
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.promo_cta_label_ar")}</label>
                  <input
                    type="text"
                    value={form.promoBanner.ctaLabelAr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        promoBanner: {
                          ...f.promoBanner,
                          ctaLabelAr: e.target.value,
                        },
                      }))
                    }
                    placeholder="تسوق الآن"
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>{t("settings.promo_cta_url")}</label>
              <input
                type="text"
                value={form.promoBanner.ctaUrl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    promoBanner: { ...f.promoBanner, ctaUrl: e.target.value },
                  }))
                }
                placeholder="/sale or https://..."
              />
            </div>
          </div>
        </section>

        {/* ——— New Arrivals ——— */}
        <section className="home-section-card card">
          <h2 className="home-section-card-title">
            {t("settings.section_new_arrivals")}
          </h2>
          <p className="settings-hint home-section-hint">
            {t("settings.new_arrivals_hint")}
          </p>
          <div className="home-section-body">
            <label className="home-section-media-label">
              {t("settings.section_media")}
            </label>

            {renderUploadZone(
              "newArrivalsImage",
              "image",
              newArrivalsImageRef,
              "image/png,image/jpeg,image/jpg,image/gif,image/webp",
              (e) =>
                handleFileChange(
                  e,
                  "image",
                  api.uploadSectionImage,
                  "newArrivalsImage",
                  (p) => addToArray("newArrivalsSectionImages", p),
                ),
              (e) =>
                handleDrop(
                  e,
                  "image",
                  api.uploadSectionImage,
                  "newArrivalsImage",
                  (p) => addToArray("newArrivalsSectionImages", p),
                ),
            )}
            {renderMediaGrid(form.newArrivalsSectionImages, [], "newArrivals")}

            {renderUploadZone(
              "newArrivalsVideo",
              "video",
              newArrivalsVideoRef,
              "video/mp4,video/webm,video/quicktime,video/ogg",
              (e) =>
                handleFileChange(
                  e,
                  "video",
                  api.uploadSectionVideo,
                  "newArrivalsVideo",
                  (p) => addToArray("newArrivalsSectionVideos", p),
                ),
              (e) =>
                handleDrop(
                  e,
                  "video",
                  api.uploadSectionVideo,
                  "newArrivalsVideo",
                  (p) => addToArray("newArrivalsSectionVideos", p),
                ),
            )}
            {renderMediaGrid([], form.newArrivalsSectionVideos, "newArrivals")}

            <div className="form-group form-group-narrow">
              <label htmlFor="home-new-arrivals-limit">
                {t("settings.new_arrivals_limit")}
              </label>
              <input
                id="home-new-arrivals-limit"
                type="number"
                min={1}
                max={24}
                value={form.newArrivalsLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    newArrivalsLimit: Math.max(
                      1,
                      Math.min(24, Number(e.target.value) || 1),
                    ),
                  })
                }
              />
              <p className="settings-hint">
                {t("settings.new_arrivals_limit_hint")}
              </p>
            </div>
          </div>
        </section>

        {/* ——— Featured / Trending Products ——— */}
        <section className="home-section-card card">
          <h2 className="home-section-card-title">
            {t("settings.section_featured_products")}
          </h2>
          <p className="settings-hint home-section-hint">
            {t("settings.featured_products_hint")}
          </p>
          <div className="home-section-body">
            <label className="checkbox-label home-section-toggle">
              <input
                type="checkbox"
                checked={form.featuredProductsEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    featuredProductsEnabled: e.target.checked,
                  })
                }
              />
              <span>{t("settings.featured_products_enabled")}</span>
            </label>
            <div className="form-group form-group-narrow">
              <label htmlFor="home-featured-limit">
                {t("settings.featured_products_limit")}
              </label>
              <input
                id="home-featured-limit"
                type="number"
                min={1}
                max={24}
                value={form.featuredProductsLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    featuredProductsLimit: Math.max(
                      1,
                      Math.min(24, Number(e.target.value) || 1),
                    ),
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* ——— Customer feedback / Testimonials ——— */}
        <section className="home-section-card card">
          <h2 className="home-section-card-title">
            {t("settings.section_feedback")}
          </h2>
          <p className="settings-hint home-section-hint">
            {t("settings.feedback_section_hint")}
          </p>
          <div className="home-section-body">
            <label className="checkbox-label home-section-toggle">
              <input
                type="checkbox"
                checked={form.feedbackSectionEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    feedbackSectionEnabled: e.target.checked,
                  })
                }
              />
              <span>{t("settings.feedback_section_enabled")}</span>
            </label>
            <div className="form-group form-group-narrow">
              <label htmlFor="home-feedback-limit">
                {t("settings.feedback_display_limit")}
              </label>
              <input
                id="home-feedback-limit"
                type="number"
                min={0}
                max={50}
                value={form.feedbackDisplayLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    feedbackDisplayLimit: Math.max(
                      0,
                      Math.min(50, Number(e.target.value) || 0),
                    ),
                  })
                }
              />
              <p className="settings-hint">
                {t("settings.feedback_display_limit_hint")}
              </p>
            </div>
          </div>
        </section>

        {/* ——— Our Collection ——— */}
        <section className="home-section-card card">
          <h2 className="home-section-card-title">
            {t("settings.section_our_collection")}
          </h2>
          <p className="settings-hint home-section-hint">
            {t("settings.our_collection_hint")}
          </p>
          <div className="home-section-body">
            <label className="home-section-media-label">
              {t("settings.section_media")}
            </label>

            {renderUploadZone(
              "ourCollectionImage",
              "image",
              ourCollectionImageRef,
              "image/png,image/jpeg,image/jpg,image/gif,image/webp",
              (e) =>
                handleFileChange(
                  e,
                  "image",
                  api.uploadSectionImage,
                  "ourCollectionImage",
                  (p) => addToArray("ourCollectionSectionImages", p),
                ),
              (e) =>
                handleDrop(
                  e,
                  "image",
                  api.uploadSectionImage,
                  "ourCollectionImage",
                  (p) => addToArray("ourCollectionSectionImages", p),
                ),
            )}
            {renderMediaGrid(
              form.ourCollectionSectionImages,
              [],
              "ourCollection",
            )}

            {renderUploadZone(
              "ourCollectionVideo",
              "video",
              ourCollectionVideoRef,
              "video/mp4,video/webm,video/quicktime,video/ogg",
              (e) =>
                handleFileChange(
                  e,
                  "video",
                  api.uploadSectionVideo,
                  "ourCollectionVideo",
                  (p) => addToArray("ourCollectionSectionVideos", p),
                ),
              (e) =>
                handleDrop(
                  e,
                  "video",
                  api.uploadSectionVideo,
                  "ourCollectionVideo",
                  (p) => addToArray("ourCollectionSectionVideos", p),
                ),
            )}
            {renderMediaGrid(
              [],
              form.ourCollectionSectionVideos,
              "ourCollection",
            )}

            <div className="form-group form-group-narrow">
              <label htmlFor="home-collections-limit">
                {t("settings.our_collection_display_limit")}
              </label>
              <input
                id="home-collections-limit"
                type="number"
                min={0}
                value={form.homeCollectionsDisplayLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    homeCollectionsDisplayLimit: Math.max(
                      0,
                      Number(e.target.value) || 0,
                    ),
                  })
                }
              />
              <p className="settings-hint">
                {t("settings.our_collection_limit_hint")}
              </p>
            </div>

            <div className="home-collections-block">
              <div className="home-collections-header">
                <h4>{t("settings.home_collections")}</h4>
                <button
                  type="button"
                  className="button secondary"
                  onClick={addCollection}
                >
                  {t("settings.add_collection")}
                </button>
              </div>
              <input
                ref={collectionImageRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleCollectionImageChange}
                style={{ display: "none" }}
              />
              {form.homeCollections.length === 0 ? (
                <p className="settings-hint">
                  {t("settings.home_collections_hint")}
                </p>
              ) : (
                <ul className="home-collections-list">
                  {form.homeCollections.map((col, idx) => (
                    <li key={idx} className="home-collection-item card">
                      <div className="home-collection-item-image">
                        {col.image ? (
                          <>
                            <img
                              src={getMediaUrl(col.image)}
                              alt=""
                              className="home-image-preview"
                            />
                            <button
                              type="button"
                              className="button secondary small"
                              onClick={() => triggerCollectionImageUpload(idx)}
                            >
                              {t("settings.upload_image")}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => triggerCollectionImageUpload(idx)}
                          >
                            {t("settings.upload_image")}
                          </button>
                        )}
                      </div>
                      <div className="home-collection-item-fields">
                        <div className="form-group">
                          <label>{t("settings.collection_title_en")}</label>
                          <input
                            type="text"
                            value={col.titleEn}
                            onChange={(e) =>
                              updateCollection(idx, { titleEn: e.target.value })
                            }
                            placeholder={t("settings.collection_title_en")}
                          />
                        </div>
                        <div className="form-group">
                          <label>{t("settings.collection_title_ar")}</label>
                          <input
                            type="text"
                            value={col.titleAr}
                            onChange={(e) =>
                              updateCollection(idx, { titleAr: e.target.value })
                            }
                            placeholder={t("settings.collection_title_ar")}
                          />
                        </div>
                        <div className="form-group">
                          <label>{t("settings.collection_link")}</label>
                          <input
                            type="text"
                            value={col.url}
                            onChange={(e) =>
                              updateCollection(idx, { url: e.target.value })
                            }
                            placeholder="/category/summer"
                          />
                        </div>
                        <button
                          type="button"
                          className="button danger secondary"
                          onClick={() => removeCollection(idx)}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <div className="settings-actions home-page-actions">
          <button className="button" type="submit">
            {t("settings.save_settings")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HomePageSettingsPage;
