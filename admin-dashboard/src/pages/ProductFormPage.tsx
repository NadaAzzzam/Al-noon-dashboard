import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  api,
  ApiError,
  Category,
  Product,
  getProductImageUrl,
  getProductVideoUrl,
} from "../services/api";
import { useLocalized } from "../utils/localized";

type ProductForm = {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  discountPrice: number | undefined;
  stock: number;
  category: string;
  status: "ACTIVE" | "INACTIVE";
  isNewArrival: boolean;
  images: string[];
  imageColors: string[];
  /** Video paths (uploaded files or external URLs). */
  videos: string[];
  /** Optional "Details" section (e.g. Fabric, Color, Style, Season). */
  detailsEn: string;
  detailsAr: string;
  /** Optional styling tip for storefront. */
  stylingTipEn: string;
  stylingTipAr: string;
  sizes: string[];
  sizeDescriptions: string[];
  colors: string[];
};

const emptyForm: ProductForm = {
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  price: 0,
  discountPrice: undefined,
  stock: 0,
  category: "",
  status: "ACTIVE",
  isNewArrival: false,
  images: [],
  imageColors: [],
  videos: [],
  detailsEn: "",
  detailsAr: "",
  stylingTipEn: "",
  stylingTipAr: "",
  sizes: [],
  sizeDescriptions: [],
  colors: [],
};

const ProductFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const localized = useLocalized();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [videosUploading, setVideosUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [uploadForColor, setUploadForColor] = useState("");
  const [imageFilterColor, setImageFilterColor] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = (await api.listCategories()) as { data?: { categories: Category[] }; categories?: Category[] };
      setCategories(res.data?.categories ?? res.categories ?? []);
    } catch (_) {}
  }, []);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getProduct(id)) as { data?: { product: Product }; product?: Product };
      const p = res.data?.product ?? res.product;
      if (!p) {
        setError("Product not found");
        return;
      }
      const name =
        typeof p.name === "object"
          ? p.name
          : { en: String(p.name), ar: String(p.name) };
      const desc =
        p.description && typeof p.description === "object"
          ? p.description
          : { en: "", ar: "" };
      setForm({
        nameEn: name.en ?? "",
        nameAr: name.ar ?? "",
        descriptionEn: desc.en ?? "",
        descriptionAr: desc.ar ?? "",
        price: p.price,
        discountPrice: p.discountPrice,
        stock: p.stock,
        category:
          typeof p.category === "object" && p.category && "_id" in p.category
            ? (p.category as { _id: string })._id
            : String(p.category ?? ""),
        status: p.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        isNewArrival: Boolean(p.isNewArrival),
        images: p.images ?? [],
        imageColors:
          p.imageColors && Array.isArray(p.imageColors)
            ? p.imageColors
            : (p.images ?? []).map(() => ""),
        videos: p.videos && Array.isArray(p.videos) ? p.videos : [],
        detailsEn:
          (p.details && typeof p.details === "object" ? p.details.en : "") ??
          "",
        detailsAr:
          (p.details && typeof p.details === "object" ? p.details.ar : "") ??
          "",
        stylingTipEn:
          (p.stylingTip && typeof p.stylingTip === "object"
            ? p.stylingTip.en
            : "") ?? "",
        stylingTipAr:
          (p.stylingTip && typeof p.stylingTip === "object"
            ? p.stylingTip.ar
            : "") ?? "",
        sizes: p.sizes ?? [],
        sizeDescriptions: (() => {
          const sz = p.sizes ?? [];
          const desc =
            p.sizeDescriptions && Array.isArray(p.sizeDescriptions)
              ? p.sizeDescriptions
              : [];
          return sz.map((_, i) => desc[i] ?? "");
        })(),
        colors: p.colors ?? [],
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("products.failed_load"),
      );
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  useEffect(() => {
    if (id) loadProduct();
  }, [id, loadProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        nameEn: form.nameEn.trim(),
        nameAr: form.nameAr.trim(),
        descriptionEn: form.descriptionEn.trim() || undefined,
        descriptionAr: form.descriptionAr.trim() || undefined,
        price: form.price,
        discountPrice: form.discountPrice || undefined,
        stock: form.stock,
        category: form.category || undefined,
        status: form.status,
        isNewArrival: form.isNewArrival,
        images: form.images.length ? form.images : undefined,
        imageColors: form.images.length ? form.imageColors : undefined,
        videos: form.videos.length ? form.videos : undefined,
        detailsEn: form.detailsEn.trim() || undefined,
        detailsAr: form.detailsAr.trim() || undefined,
        stylingTipEn: form.stylingTipEn.trim() || undefined,
        stylingTipAr: form.stylingTipAr.trim() || undefined,
        sizes: form.sizes.length ? form.sizes : undefined,
        sizeDescriptions: form.sizes.length ? form.sizeDescriptions : undefined,
        colors: form.colors.length ? form.colors : undefined,
      };
      if (isEdit && id) {
        await api.updateProduct(id, payload);
      } else {
        await api.createProduct(
          payload as import("../services/api").ProductPayload,
        );
      }
      navigate("/products");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("products.failed_save"),
      );
    } finally {
      setSaving(false);
    }
  };

  const addSize = () => {
    const v = sizeInput.trim();
    if (v && !form.sizes.includes(v)) {
      setForm((f) => ({
        ...f,
        sizes: [...f.sizes, v],
        sizeDescriptions: [...f.sizeDescriptions, ""],
      }));
      setSizeInput("");
    }
  };
  const removeSize = (index: number) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((_, i) => i !== index),
      sizeDescriptions: f.sizeDescriptions.filter((_, i) => i !== index),
    }));
  };
  const setSizeDescription = (index: number, value: string) => {
    setForm((f) => {
      const next = [...f.sizeDescriptions];
      next[index] = value;
      return { ...f, sizeDescriptions: next };
    });
  };
  const addColor = () => {
    const v = colorInput.trim();
    if (v && !form.colors.includes(v)) {
      setForm((f) => ({ ...f, colors: [...f.colors, v] }));
      setColorInput("");
    }
  };
  const removeColor = (c: string) => {
    setForm((f) => ({ ...f, colors: f.colors.filter((x) => x !== c) }));
  };

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setError(null);
    setImagesUploading(true);
    try {
      const paths = await api.uploadProductImages(files);
      const newColor = uploadForColor.trim();
      const newColors = paths.map(() => newColor);
      setForm((f) => {
        const images = [...f.images, ...paths].slice(0, 10);
        const imageColors = [...f.imageColors, ...newColors].slice(0, 10);
        return { ...f, images, imageColors };
      });
      // Switch "Show images for" to the color we just assigned so new uploads are visible
      setImageFilterColor(newColor);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("products.images_upload_failed"),
      );
    } finally {
      setImagesUploading(false);
      e.target.value = "";
    }
  };
  const removeImage = (path: string) => {
    const idx = form.images.indexOf(path);
    if (idx === -1) return;
    setForm((f) => ({
      ...f,
      images: f.images.filter((p) => p !== path),
      imageColors: f.imageColors.filter((_, i) => i !== idx),
    }));
  };

  const handleVideosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setError(null);
    setVideosUploading(true);
    try {
      const paths = await api.uploadProductVideos(files);
      setForm((f) => ({
        ...f,
        videos: [...f.videos, ...paths].slice(0, 10),
      }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t("products.videos_upload_failed"),
      );
    } finally {
      setVideosUploading(false);
      e.target.value = "";
    }
  };
  const removeVideo = (path: string) => {
    setForm((f) => ({
      ...f,
      videos: f.videos.filter((p) => p !== path),
    }));
  };
  const setImageColor = (path: string, color: string) => {
    const idx = form.images.indexOf(path);
    if (idx === -1) return;
    setForm((f) => {
      const next = [...f.imageColors];
      next[idx] = color;
      return { ...f, imageColors: next };
    });
  };
  const filteredImages =
    imageFilterColor === ""
      ? form.images.map((path, i) => ({
          path,
          color: form.imageColors[i] ?? "",
        }))
      : form.images
          .map((path, i) => ({ path, color: form.imageColors[i] ?? "" }))
          .filter((item) => item.color === imageFilterColor);

  if (loading) {
    return (
      <div className="product-form-section product-form-loading">
        {t("common.loading")}
      </div>
    );
  }
  if (isEdit && !form.nameEn && !form.nameAr && !error) return null;

  return (
    <div className="product-form-page">
      <Link to="/products" className="product-form-back">
        {t("products.back_products")}
      </Link>
      <h1 className="product-form-title">
        {isEdit ? t("products.edit_product") : t("products.new_product")}
      </h1>
      <p className="product-form-subtitle">
        {isEdit ? t("products.subtitle") : t("products.subtitle")}
      </p>
      {error && (
        <div className="product-form-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("products.section_basic")}
          </h2>
          <div className="product-form-grid">
            <div className="product-form-field">
              <label htmlFor="product-name-en">{t("products.name_en")}</label>
              <input
                id="product-name-en"
                value={form.nameEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nameEn: e.target.value }))
                }
                required
                placeholder={t("products.name_en")}
              />
            </div>
            <div className="product-form-field">
              <label htmlFor="product-name-ar">{t("products.name_ar")}</label>
              <input
                id="product-name-ar"
                value={form.nameAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nameAr: e.target.value }))
                }
                required
                placeholder={t("products.name_ar")}
              />
            </div>
            <div className="product-form-field">
              <label htmlFor="product-desc-en">
                {t("products.description_en")}
              </label>
              <textarea
                id="product-desc-en"
                value={form.descriptionEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descriptionEn: e.target.value }))
                }
                placeholder={t("products.description_en")}
                rows={3}
              />
            </div>
            <div className="product-form-field">
              <label htmlFor="product-desc-ar">
                {t("products.description_ar")}
              </label>
              <textarea
                id="product-desc-ar"
                value={form.descriptionAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descriptionAr: e.target.value }))
                }
                placeholder={t("products.description_ar")}
                rows={3}
              />
            </div>
            <div className="product-form-field product-form-grid-full">
              <label htmlFor="product-details-en">
                {t("products.details_en")}
              </label>
              <textarea
                id="product-details-en"
                value={form.detailsEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, detailsEn: e.target.value }))
                }
                placeholder={t("products.details_placeholder")}
                rows={2}
              />
            </div>
            <div className="product-form-field product-form-grid-full">
              <label htmlFor="product-details-ar">
                {t("products.details_ar")}
              </label>
              <textarea
                id="product-details-ar"
                value={form.detailsAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, detailsAr: e.target.value }))
                }
                placeholder={t("products.details_placeholder")}
                rows={2}
              />
            </div>
            <div className="product-form-field product-form-grid-full">
              <label htmlFor="product-styling-en">
                {t("products.styling_tip_en")}
              </label>
              <input
                id="product-styling-en"
                type="text"
                value={form.stylingTipEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stylingTipEn: e.target.value }))
                }
                placeholder={t("products.styling_tip_placeholder")}
              />
            </div>
            <div className="product-form-field product-form-grid-full">
              <label htmlFor="product-styling-ar">
                {t("products.styling_tip_ar")}
              </label>
              <input
                id="product-styling-ar"
                type="text"
                value={form.stylingTipAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stylingTipAr: e.target.value }))
                }
                placeholder={t("products.styling_tip_placeholder")}
              />
            </div>
            <div className="product-form-field product-form-grid-full">
              <label htmlFor="product-category">{t("products.category")}</label>
              <select
                id="product-category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                required
              >
                <option value="">{t("products.select_category")}</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {localized(c.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="product-form-field product-form-grid-full">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isNewArrival: e.target.checked }))
                  }
                />
                <span>{t("products.new_arrival")}</span>
              </label>
              <p className="product-form-hint">
                {t("products.new_arrival_hint")}
              </p>
            </div>
          </div>
        </section>

        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("products.section_pricing")}
          </h2>
          <div className="product-form-grid">
            <div className="product-form-field">
              <label htmlFor="product-price">{t("products.price")} (EGP)</label>
              <input
                id="product-price"
                type="number"
                step={0.01}
                min={0}
                value={form.price || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))
                }
                required
              />
            </div>
            <div className="product-form-field">
              <label htmlFor="product-discount">
                {t("products.discount_price")} (EGP)
              </label>
              <input
                id="product-discount"
                type="number"
                step={0.01}
                min={0}
                value={form.discountPrice ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountPrice: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              />
            </div>
          </div>
        </section>

        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("products.section_inventory")}
          </h2>
          <div className="product-form-row">
            <div className="product-form-field">
              <label htmlFor="product-stock">{t("products.stock")}</label>
              <input
                id="product-stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))
                }
                required
              />
            </div>
            <div className="product-form-field">
              <label htmlFor="product-status">{t("dashboard.status")}</label>
              <select
                id="product-status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as "ACTIVE" | "INACTIVE",
                  }))
                }
              >
                <option value="ACTIVE">{t("common.active")}</option>
                <option value="INACTIVE">{t("common.inactive")}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("products.section_variants")}
          </h2>
          <div className="product-form-variants-row">
            <div className="product-form-variants-block">
              <label>{t("products.sizes")}</label>
              <div className="product-form-tag-input-row">
                <input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSize())
                  }
                  placeholder="e.g. S, M, L"
                />
                <button
                  type="button"
                  className="button secondary"
                  onClick={addSize}
                >
                  {t("products.add_size")}
                </button>
              </div>
              <div className="product-form-sizes-list">
                {form.sizes.map((s, index) => (
                  <div key={`${s}-${index}`} className="product-form-size-row">
                    <span className="product-form-size-label">{s}</span>
                    <input
                      type="text"
                      className="product-form-size-desc"
                      value={form.sizeDescriptions[index] ?? ""}
                      onChange={(e) =>
                        setSizeDescription(index, e.target.value)
                      }
                      placeholder={t("products.size_desc_placeholder")}
                      aria-label={t("products.size_desc_label")}
                    />
                    <button
                      type="button"
                      className="product-form-tag-remove"
                      onClick={() => removeSize(index)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="product-form-variants-block">
              <label>{t("products.colors")}</label>
              <div className="product-form-tag-input-row">
                <input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addColor())
                  }
                  placeholder="e.g. Red, Blue"
                />
                <button
                  type="button"
                  className="button secondary"
                  onClick={addColor}
                >
                  {t("products.add_color")}
                </button>
              </div>
              <div className="product-form-tags">
                {form.colors.map((c) => (
                  <span key={c} className="product-form-tag">
                    {c}
                    <button
                      type="button"
                      className="product-form-tag-remove"
                      onClick={() => removeColor(c)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("products.section_images")}
          </h2>
          <div
            className="product-form-image-options"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div className="product-form-field" style={{ minWidth: 180 }}>
              <label>{t("products.assign_uploads_to")}</label>
              <select
                value={uploadForColor}
                onChange={(e) => setUploadForColor(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              >
                <option value="">{t("products.default_color")}</option>
                {form.colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="product-form-field" style={{ minWidth: 180 }}>
              <label>{t("products.show_images_for")}</label>
              <select
                value={imageFilterColor}
                onChange={(e) => setImageFilterColor(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              >
                <option value="">{t("products.all_colors")}</option>
                {form.colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            className="product-form-upload-zone"
            onClick={() =>
              !imagesUploading &&
              form.images.length < 10 &&
              fileInputRef.current?.click()
            }
            onKeyDown={(e) =>
              e.key === "Enter" && fileInputRef.current?.click()
            }
            role="button"
            tabIndex={0}
            aria-label={t("products.upload_images")}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              multiple
              onChange={handleImagesChange}
              disabled={imagesUploading || form.images.length >= 10}
            />
            <p className="product-form-upload-text">
              {imagesUploading
                ? t("common.loading")
                : t("products.upload_images")}
            </p>
            <p className="product-form-upload-hint">
              {t("products.upload_images_hint")}
            </p>
            {form.images.length > 0 && (
              <p className="product-form-upload-hint">
                {form.images.length}/10
              </p>
            )}
          </div>
          <div className="product-form-images">
            {filteredImages.map(({ path, color }) => (
              <div key={path} className="product-form-image-wrap">
                <img src={getProductImageUrl(path)} alt="" />
                <button
                  type="button"
                  className="product-form-image-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(path);
                  }}
                  aria-label="Remove"
                >
                  ×
                </button>
                <select
                  className="product-form-image-color-select"
                  value={color}
                  onChange={(e) => setImageColor(path, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  title={t("products.colors")}
                >
                  <option value="">{t("products.default_color")}</option>
                  {form.colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {form.colors.length > 0 && filteredImages.length === 0 && (
            <p className="product-form-upload-hint" style={{ marginTop: 12 }}>
              {t("products.show_images_for")} &quot;{imageFilterColor}&quot; —{" "}
              {t("common.none")}
            </p>
          )}
        </section>

        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("products.section_videos")}
          </h2>
          <p className="product-form-hint" style={{ marginBottom: 12 }}>
            {t("products.videos_hint")}
          </p>
          <div
            className="product-form-upload-zone"
            onClick={() =>
              !videosUploading &&
              form.videos.length < 10 &&
              videoInputRef.current?.click()
            }
            onKeyDown={(e) =>
              e.key === "Enter" && videoInputRef.current?.click()
            }
            role="button"
            tabIndex={0}
            aria-label={t("products.upload_videos")}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg"
              multiple
              onChange={handleVideosChange}
              disabled={videosUploading || form.videos.length >= 10}
            />
            <p className="product-form-upload-text">
              {videosUploading
                ? t("common.loading")
                : t("products.upload_videos")}
            </p>
            <p className="product-form-upload-hint">
              {t("products.upload_videos_hint")}
            </p>
            {form.videos.length > 0 && (
              <p className="product-form-upload-hint">
                {form.videos.length}/10
              </p>
            )}
          </div>
          <div className="product-form-videos-list">
            {form.videos.map((path, i) => (
              <div key={`${path}-${i}`} className="product-form-video-row">
                <span className="product-form-video-label" title={path}>
                  {path.split("/").pop() || path}
                </span>
                <video
                  src={getProductVideoUrl(path)}
                  controls
                  muted
                  playsInline
                  className="product-form-video-preview"
                />
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => removeVideo(path)}
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="product-form-actions">
          <button className="button" type="submit" disabled={saving}>
            {saving
              ? t("common.loading")
              : isEdit
                ? t("common.update")
                : t("common.create")}
          </button>
          <Link to="/products" className="button secondary">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
