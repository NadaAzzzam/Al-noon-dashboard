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

type HomePageForm = {
  hero: HeroForm;
  heroEnabled: boolean;
  newArrivalsLimit: number;
  newArrivalsSectionImages: string[];
  newArrivalsSectionVideos: string[];
  homeCollectionsDisplayLimit: number;
  ourCollectionSectionImages: string[];
  ourCollectionSectionVideos: string[];
  homeCollections: CollectionCardForm[];
};

const getMediaUrl = (path: string) => (path ? getUploadsBaseUrl() + path : "");

const HomePageSettingsPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<HomePageForm>({
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
    newArrivalsLimit: 8,
    newArrivalsSectionImages: [],
    newArrivalsSectionVideos: [],
    homeCollectionsDisplayLimit: 0,
    ourCollectionSectionImages: [],
    ourCollectionSectionVideos: [],
    homeCollections: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false);
  const [uploadingNewArrivalsImage, setUploadingNewArrivalsImage] =
    useState(false);
  const [uploadingNewArrivalsVideo, setUploadingNewArrivalsVideo] =
    useState(false);
  const [uploadingOurCollectionImage, setUploadingOurCollectionImage] =
    useState(false);
  const [uploadingOurCollectionVideo, setUploadingOurCollectionVideo] =
    useState(false);
  const [uploadingCollectionIndex, setUploadingCollectionIndex] = useState<
    number | null
  >(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const heroVideoInputRef = useRef<HTMLInputElement>(null);
  const newArrivalsImageInputRef = useRef<HTMLInputElement>(null);
  const newArrivalsVideoInputRef = useRef<HTMLInputElement>(null);
  const ourCollectionImageInputRef = useRef<HTMLInputElement>(null);
  const ourCollectionVideoInputRef = useRef<HTMLInputElement>(null);
  const collectionImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((res: unknown) => {
        const d = (res as { settings: Settings }).settings;
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

  const addHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      if (file) setError(t("settings.logo_invalid_type"));
      return;
    }
    setError(null);
    setUploadingHeroImage(true);
    try {
      const path = await api.uploadHeroImage(file);
      setForm((f) => ({
        ...f,
        hero: { ...f.hero, images: [...f.hero.images, path] },
      }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("settings.logo_upload_failed"),
      );
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const addHeroVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("video/")) {
      if (file) setError("Only video files are allowed (MP4, WebM, MOV, OGG).");
      return;
    }
    setError(null);
    setUploadingHeroVideo(true);
    try {
      const path = await api.uploadHeroVideo(file);
      setForm((f) => ({
        ...f,
        hero: { ...f.hero, videos: [...f.hero.videos, path] },
      }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("settings.logo_upload_failed"),
      );
    } finally {
      setUploadingHeroVideo(false);
    }
  };

  const addSectionImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "newArrivalsSectionImages" | "ourCollectionSectionImages",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      if (file) setError(t("settings.logo_invalid_type"));
      return;
    }
    setError(null);
    if (field === "newArrivalsSectionImages")
      setUploadingNewArrivalsImage(true);
    else setUploadingOurCollectionImage(true);
    try {
      const path = await api.uploadSectionImage(file);
      setForm((f) => ({ ...f, [field]: [...f[field], path] }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("settings.logo_upload_failed"),
      );
    } finally {
      if (field === "newArrivalsSectionImages")
        setUploadingNewArrivalsImage(false);
      else setUploadingOurCollectionImage(false);
    }
  };

  const addSectionVideo = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "newArrivalsSectionVideos" | "ourCollectionSectionVideos",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("video/")) {
      if (file) setError("Only video files are allowed.");
      return;
    }
    setError(null);
    if (field === "newArrivalsSectionVideos")
      setUploadingNewArrivalsVideo(true);
    else setUploadingOurCollectionVideo(true);
    try {
      const path = await api.uploadSectionVideo(file);
      setForm((f) => ({ ...f, [field]: [...f[field], path] }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("settings.logo_upload_failed"),
      );
    } finally {
      if (field === "newArrivalsSectionVideos")
        setUploadingNewArrivalsVideo(false);
      else setUploadingOurCollectionVideo(false);
    }
  };

  const removeMedia = (
    section: "hero" | "newArrivals" | "ourCollection",
    type: "images" | "videos",
    index: number,
  ) => {
    if (section === "hero") {
      setForm((f) => ({
        ...f,
        hero: {
          ...f.hero,
          [type]: f.hero[type].filter((_, i) => i !== index),
        },
      }));
    } else if (section === "newArrivals") {
      const key =
        type === "images"
          ? "newArrivalsSectionImages"
          : "newArrivalsSectionVideos";
      setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
    } else {
      const key =
        type === "images"
          ? "ourCollectionSectionImages"
          : "ourCollectionSectionVideos";
      setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
    }
  };

  const triggerCollectionImageUpload = (index: number) => {
    setUploadingCollectionIndex(index);
    collectionImageInputRef.current?.click();
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
        newArrivalsLimit: form.newArrivalsLimit,
        newArrivalsSectionImages: form.newArrivalsSectionImages,
        newArrivalsSectionVideos: form.newArrivalsSectionVideos,
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

  const mediaGrid = (
    images: string[],
    videos: string[],
    section: "hero" | "newArrivals" | "ourCollection",
    imageUploading: boolean,
    videoUploading: boolean,
    imageInputRef: React.RefObject<HTMLInputElement | null>,
    videoInputRef: React.RefObject<HTMLInputElement | null>,
    onAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onAddVideo: (e: React.ChangeEvent<HTMLInputElement>) => void,
  ) => {
    const items: { path: string; type: "image" | "video" }[] = [
      ...images.map((path) => ({ path, type: "image" as const })),
      ...videos.map((path) => ({ path, type: "video" as const })),
    ];
    return (
      <div className="form-group home-section-media-block">
        <div className="home-media-actions">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={onAddImage}
            disabled={imageUploading}
            className="home-image-input"
          />
          <button
            type="button"
            className="button secondary"
            onClick={() => imageInputRef.current?.click()}
          >
            {imageUploading ? t("common.loading") : t("settings.upload_image")}
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg"
            onChange={onAddVideo}
            disabled={videoUploading}
            className="home-image-input"
          />
          <button
            type="button"
            className="button secondary"
            onClick={() => videoInputRef.current?.click()}
          >
            {videoUploading
              ? t("common.loading")
              : t("settings.upload_video", "Upload video")}
          </button>
        </div>
        {items.length > 0 && (
          <ul className="home-media-list">
            {items.map((item) => {
              const type = item.type;
              const mediaIndex =
                type === "image"
                  ? images.indexOf(item.path)
                  : videos.indexOf(item.path);
              return (
                <li key={`${type}-${item.path}`} className="home-media-item">
                  {type === "image" ? (
                    <img
                      src={getMediaUrl(item.path)}
                      alt=""
                      className="home-image-preview"
                    />
                  ) : (
                    <video
                      src={getMediaUrl(item.path)}
                      className="home-image-preview"
                      muted
                      playsInline
                    />
                  )}
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() =>
                      removeMedia(
                        section,
                        type === "image" ? "images" : "videos",
                        type === "image" ? mediaIndex : mediaIndex,
                      )
                    }
                  >
                    {t("settings.remove_logo")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
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
              {t("settings.hero_images_videos", "Hero images & videos")}
            </label>
            {mediaGrid(
              form.hero.images,
              form.hero.videos,
              "hero",
              uploadingHeroImage,
              uploadingHeroVideo,
              heroImageInputRef,
              heroVideoInputRef,
              addHeroImage,
              addHeroVideo,
            )}
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
              {t("settings.section_media", "Section images & videos")}
            </label>
            {mediaGrid(
              form.newArrivalsSectionImages,
              form.newArrivalsSectionVideos,
              "newArrivals",
              uploadingNewArrivalsImage,
              uploadingNewArrivalsVideo,
              newArrivalsImageInputRef,
              newArrivalsVideoInputRef,
              (e) => addSectionImage(e, "newArrivalsSectionImages"),
              (e) => addSectionVideo(e, "newArrivalsSectionVideos"),
            )}
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
              {t("settings.section_media", "Section images & videos")}
            </label>
            {mediaGrid(
              form.ourCollectionSectionImages,
              form.ourCollectionSectionVideos,
              "ourCollection",
              uploadingOurCollectionImage,
              uploadingOurCollectionVideo,
              ourCollectionImageInputRef,
              ourCollectionVideoInputRef,
              (e) => addSectionImage(e, "ourCollectionSectionImages"),
              (e) => addSectionVideo(e, "ourCollectionSectionVideos"),
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
                ref={collectionImageInputRef}
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
