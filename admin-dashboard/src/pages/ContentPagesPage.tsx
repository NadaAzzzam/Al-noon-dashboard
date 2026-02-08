import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { api, ApiError, Settings } from "../services/api";

const CONTENT_SLUGS = [
  { slug: "privacy", labelKey: "settings.content_privacy" },
  { slug: "return-policy", labelKey: "settings.content_return_policy" },
  { slug: "shipping-policy", labelKey: "settings.content_shipping_policy" },
  { slug: "about", labelKey: "settings.content_about" },
] as const;

type PageForm = {
  slug: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
];

const ContentPagesPage = () => {
  const { t } = useTranslation();
  const [activeSlug, setActiveSlug] = useState<string>(CONTENT_SLUGS[0].slug);
  const [pages, setPages] = useState<PageForm[]>(
    CONTENT_SLUGS.map(({ slug }) => ({
      slug,
      titleEn: "",
      titleAr: "",
      contentEn: "",
      contentAr: "",
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((res: unknown) => {
        const body = res as { data?: { settings: Settings }; settings?: Settings };
        const d = body.data?.settings ?? body.settings;
        if (!d) return;
        const list =
          (
            d as {
              contentPages?: {
                slug: string;
                title?: { en?: string; ar?: string };
                content?: { en?: string; ar?: string };
              }[];
            }
          ).contentPages ?? [];
        setPages(
          CONTENT_SLUGS.map(({ slug }) => {
            const p = list.find((x: { slug: string }) => x.slug === slug);
            return {
              slug,
              titleEn: p?.title?.en ?? "",
              titleAr: p?.title?.ar ?? "",
              contentEn: p?.content?.en ?? "",
              contentAr: p?.content?.ar ?? "",
            };
          }),
        );
      })
      .catch(() => setError(t("settings.failed_load")));
  }, [t]);

  const updatePage = (
    slug: string,
    field: keyof Omit<PageForm, "slug">,
    value: string,
  ) => {
    setPages((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, [field]: value } : p)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings({
        contentPages: pages.map((p) => ({
          slug: p.slug,
          titleEn: p.titleEn.trim(),
          titleAr: p.titleAr.trim(),
          contentEn: p.contentEn,
          contentAr: p.contentAr,
        })),
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("settings.failed_save"),
      );
    }
  };

  return (
    <div className="settings-page settings-page-full-width content-pages-page">
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
          <h1>{t("settings.content_pages_title")}</h1>
          <p className="header-subtitle">
            {t("settings.content_pages_subtitle")}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="content-pages-form">
        <nav
          className="content-pages-tabs"
          aria-label={t("settings.content_pages_tabs_label")}
        >
          {CONTENT_SLUGS.map(({ slug, labelKey }) => (
            <button
              key={slug}
              type="button"
              className={`content-pages-tab ${activeSlug === slug ? "active" : ""}`}
              onClick={() => setActiveSlug(slug)}
              aria-selected={activeSlug === slug}
            >
              {t(labelKey)}
            </button>
          ))}
        </nav>
        <div className="content-pages-panels">
          {CONTENT_SLUGS.map(({ slug, labelKey }) => {
            const page = pages.find((p) => p.slug === slug);
            if (!page || activeSlug !== slug) return null;
            return (
              <div
                key={slug}
                className="card content-page-card"
                role="tabpanel"
                aria-labelledby={`tab-${slug}`}
              >
                <header className="content-page-card-header">
                  <h3 className="content-page-card-title" id={`tab-${slug}`}>
                    {t(labelKey)}
                  </h3>
                  <p className="settings-hint content-page-slug">
                    {t("settings.content_page_url")}: /page/{slug}
                  </p>
                </header>
                <div className="content-page-card-body">
                  <div className="form-group">
                    <label>{t("settings.content_title_en")}</label>
                    <input
                      type="text"
                      value={page.titleEn}
                      onChange={(e) =>
                        updatePage(slug, "titleEn", e.target.value)
                      }
                      placeholder={t("settings.content_title_en")}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("settings.content_title_ar")}</label>
                    <input
                      type="text"
                      value={page.titleAr}
                      onChange={(e) =>
                        updatePage(slug, "titleAr", e.target.value)
                      }
                      placeholder={t("settings.content_title_ar")}
                    />
                  </div>
                  <div className="form-group content-editor-group">
                    <label>{t("settings.content_body_en")}</label>
                    <ReactQuill
                      theme="snow"
                      value={page.contentEn}
                      onChange={(value) => updatePage(slug, "contentEn", value)}
                      modules={quillModules}
                      formats={quillFormats}
                      className="content-quill"
                    />
                  </div>
                  <div className="form-group content-editor-group">
                    <label>{t("settings.content_body_ar")}</label>
                    <ReactQuill
                      theme="snow"
                      value={page.contentAr}
                      onChange={(value) => updatePage(slug, "contentAr", value)}
                      modules={quillModules}
                      formats={quillFormats}
                      className="content-quill content-quill-rtl"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="settings-actions content-pages-actions">
          <button className="button" type="submit">
            {t("settings.save_settings")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContentPagesPage;
