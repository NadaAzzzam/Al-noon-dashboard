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
import { formatPriceEGP } from "../utils/format";
import { useLocalized } from "../utils/localized";

type VariantInventory = {
  color: string;
  size: string;
  stock: number;
  outOfStock: boolean;
};

type ProductForm = {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  discountPrice: number | undefined;
  costPerItem: number | undefined;
  stock: number;
  category: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  isNewArrival: boolean;
  images: string[];
  imageColors: string[];
  /** Video paths (uploaded files or external URLs). */
  videos: string[];
  /** Preferred media type for default display ("image" or "video"). */
  defaultMediaType: "image" | "video";
  /** Preferred media type for hover display ("image" or "video"). */
  hoverMediaType: "image" | "video";
  /** Optional "Details" section (e.g. Fabric, Color, Style, Season). */
  detailsEn: string;
  detailsAr: string;
  /** Optional styling tip for storefront. */
  stylingTipEn: string;
  stylingTipAr: string;
  /** SEO meta title (EN/AR). */
  metaTitleEn: string;
  metaTitleAr: string;
  /** SEO meta description (EN/AR). */
  metaDescriptionEn: string;
  metaDescriptionAr: string;
  sizes: string[];
  sizeDescriptions: string[];
  colors: string[];
  /** Shopify-style variants: each size×color combination with individual stock */
  variants: VariantInventory[];
  /** URL-friendly slugs per locale (auto-generated from name). */
  slugEn: string;
  slugAr: string;
  /** Free-form tags. */
  tags: string[];
  /** Brand / manufacturer. */
  vendor: string;
  /** Product weight for shipping. */
  weight: number | undefined;
  /** Weight unit. */
  weightUnit: "g" | "kg";
};

const emptyForm: ProductForm = {
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  price: 0,
  discountPrice: undefined,
  costPerItem: undefined,
  stock: 0,
  category: "",
  status: "ACTIVE",
  isNewArrival: false,
  images: [],
  imageColors: [],
  videos: [],
  defaultMediaType: "image",
  hoverMediaType: "image",
  detailsEn: "",
  detailsAr: "",
  stylingTipEn: "",
  stylingTipAr: "",
  metaTitleEn: "",
  metaTitleAr: "",
  metaDescriptionEn: "",
  metaDescriptionAr: "",
  sizes: [],
  sizeDescriptions: [],
  colors: [],
  variants: [],
  slugEn: "",
  slugAr: "",
  tags: [],
  vendor: "",
  weight: undefined,
  weightUnit: "g",
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
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = (await api.listCategories()) as {
        data?: { categories: Category[] };
        categories?: Category[];
      };
      setCategories(res.data?.categories ?? res.categories ?? []);
    } catch {}
  }, []);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getProduct(id)) as {
        data?: { product: Product };
        product?: Product;
      };
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
        costPerItem: p.costPerItem,
        stock: p.stock,
        category:
          typeof p.category === "object" && p.category && "_id" in p.category
            ? (p.category as { _id: string })._id
            : String(p.category ?? ""),
        status:
          p.status === "INACTIVE"
            ? "INACTIVE"
            : p.status === "DRAFT"
              ? "DRAFT"
              : "ACTIVE",
        isNewArrival: Boolean(p.isNewArrival),
        images: p.images ?? [],
        imageColors:
          p.imageColors && Array.isArray(p.imageColors)
            ? p.imageColors
            : (p.images ?? []).map(() => ""),
        videos: p.videos && Array.isArray(p.videos) ? p.videos : [],
        defaultMediaType: p.defaultMediaType ?? "image",
        hoverMediaType: p.hoverMediaType ?? "image",
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
        metaTitleEn:
          (p.metaTitle && typeof p.metaTitle === "object"
            ? p.metaTitle.en
            : "") ?? "",
        metaTitleAr:
          (p.metaTitle && typeof p.metaTitle === "object"
            ? p.metaTitle.ar
            : "") ?? "",
        metaDescriptionEn:
          (p.metaDescription && typeof p.metaDescription === "object"
            ? p.metaDescription.en
            : "") ?? "",
        metaDescriptionAr:
          (p.metaDescription && typeof p.metaDescription === "object"
            ? p.metaDescription.ar
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
        variants:
          p.variants && Array.isArray(p.variants)
            ? p.variants.map(
                (v: {
                  color?: string;
                  size?: string;
                  stock: number;
                  outOfStock?: boolean;
                }) => ({
                  color: v.color ?? "",
                  size: v.size ?? "",
                  stock: v.stock ?? 0,
                  outOfStock: v.outOfStock ?? false,
                }),
              )
            : [],
        slugEn: (typeof p.slug === "object" ? p.slug?.en : p.slug) ?? "",
        slugAr: (typeof p.slug === "object" ? p.slug?.ar : "") ?? "",
        tags: p.tags ?? [],
        vendor: p.vendor ?? "",
        weight: p.weight,
        weightUnit: p.weightUnit ?? "g",
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
      // Calculate total stock from variants
      const totalStock =
        form.variants.length > 0
          ? form.variants.reduce(
              (sum, v) => sum + (v.outOfStock ? 0 : v.stock),
              0,
            )
          : form.stock;

      const payload = {
        nameEn: form.nameEn.trim(),
        nameAr: form.nameAr.trim(),
        descriptionEn: form.descriptionEn.trim() || undefined,
        descriptionAr: form.descriptionAr.trim() || undefined,
        price: form.price,
        discountPrice: form.discountPrice || undefined,
        costPerItem: form.costPerItem || undefined,
        stock: totalStock,
        category: form.category || undefined,
        status: form.status,
        isNewArrival: form.isNewArrival,
        images: form.images.length ? form.images : undefined,
        imageColors: form.images.length ? form.imageColors : undefined,
        videos: form.videos.length ? form.videos : undefined,
        defaultMediaType: form.defaultMediaType,
        hoverMediaType: form.hoverMediaType,
        detailsEn: form.detailsEn.trim() || undefined,
        detailsAr: form.detailsAr.trim() || undefined,
        stylingTipEn: form.stylingTipEn.trim() || undefined,
        stylingTipAr: form.stylingTipAr.trim() || undefined,
        metaTitleEn: form.metaTitleEn.trim() || undefined,
        metaTitleAr: form.metaTitleAr.trim() || undefined,
        metaDescriptionEn: form.metaDescriptionEn.trim() || undefined,
        metaDescriptionAr: form.metaDescriptionAr.trim() || undefined,
        sizes: form.sizes.length ? form.sizes : undefined,
        sizeDescriptions: form.sizes.length ? form.sizeDescriptions : undefined,
        colors: form.colors.length ? form.colors : undefined,
        variants: form.variants.length ? form.variants : undefined,
        slugEn: form.slugEn.trim() || undefined,
        slugAr: form.slugAr.trim() || undefined,
        tags: form.tags.length ? form.tags : undefined,
        vendor: form.vendor.trim() || undefined,
        weight: form.weight || undefined,
        weightUnit: form.weightUnit,
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
      setForm((f) => {
        const newSizes = [...f.sizes, v];
        const newSizeDescriptions = [...f.sizeDescriptions, ""];
        // Generate variants for the new size with all existing colors
        const newVariants = [...f.variants];
        f.colors.forEach((color) => {
          newVariants.push({
            size: v,
            color,
            stock: 0,
            outOfStock: true,
          });
        });
        return {
          ...f,
          sizes: newSizes,
          sizeDescriptions: newSizeDescriptions,
          variants: newVariants,
        };
      });
      setSizeInput("");
    }
  };

  const removeSize = (index: number) => {
    const sizeToRemove = form.sizes[index];
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((_, i) => i !== index),
      sizeDescriptions: f.sizeDescriptions.filter((_, i) => i !== index),
      // Remove all variants with this size
      variants: f.variants.filter((v) => v.size !== sizeToRemove),
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
      setForm((f) => {
        const newColors = [...f.colors, v];
        // Generate variants for the new color with all existing sizes
        const newVariants = [...f.variants];
        f.sizes.forEach((size) => {
          newVariants.push({
            size,
            color: v,
            stock: 0,
            outOfStock: true,
          });
        });
        return {
          ...f,
          colors: newColors,
          variants: newVariants,
        };
      });
      setColorInput("");
    }
  };

  const removeColor = (c: string) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.filter((x) => x !== c),
      // Remove all variants with this color
      variants: f.variants.filter((v) => v.color !== c),
    }));
  };

  const updateVariantStock = (size: string, color: string, stock: number) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) =>
        v.size === size && v.color === color
          ? { ...v, stock, outOfStock: stock === 0 }
          : v,
      ),
    }));
  };

  const toggleVariantOutOfStock = (size: string, color: string) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) =>
        v.size === size && v.color === color
          ? {
              ...v,
              outOfStock: !v.outOfStock,
              stock: v.outOfStock ? v.stock : 0,
            }
          : v,
      ),
    }));
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
            <div className="product-form-field">
              <label htmlFor="product-vendor">{t("products.vendor")}</label>
              <input
                id="product-vendor"
                value={form.vendor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendor: e.target.value }))
                }
                placeholder={t("products.vendor_placeholder")}
              />
            </div>
            <div className="product-form-field product-form-grid-half">
              <label htmlFor="product-slug-en">{t("products.slug_en")}</label>
              <input
                id="product-slug-en"
                value={form.slugEn}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slugEn: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\u0600-\u06FF-]/g, "-")
                      .replace(/--+/g, "-"),
                  }))
                }
                placeholder={t("products.slug_placeholder")}
              />
              {form.slugEn && (
                <p className="product-form-hint" style={{ marginTop: 4 }}>
                  {t("products.url_preview")}: /en/products/{form.slugEn}
                </p>
              )}
            </div>
            <div className="product-form-field product-form-grid-half">
              <label htmlFor="product-slug-ar">{t("products.slug_ar")}</label>
              <input
                id="product-slug-ar"
                value={form.slugAr}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slugAr: e.target.value
                      .replace(/[^\w\u0600-\u06FF-]/g, "-")
                      .replace(/--+/g, "-"),
                  }))
                }
                placeholder={t("products.slug_placeholder")}
              />
              {form.slugAr && (
                <p className="product-form-hint" style={{ marginTop: 4 }}>
                  {t("products.url_preview")}: /ar/products/{form.slugAr}
                </p>
              )}
            </div>
            <div className="product-form-field product-form-grid-full">
              <label>{t("products.tags")}</label>
              <div className="product-form-tag-input-row">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = tagInput.trim().toLowerCase();
                      if (v && !form.tags.includes(v)) {
                        setForm((f) => ({ ...f, tags: [...f.tags, v] }));
                      }
                      setTagInput("");
                    }
                  }}
                  placeholder={t("products.tags_placeholder")}
                />
              </div>
              <div className="product-form-tags" style={{ marginTop: 8 }}>
                {form.tags.map((tag) => (
                  <span key={tag} className="product-form-tag">
                    {tag}
                    <button
                      type="button"
                      className="product-form-tag-remove"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          tags: f.tags.filter((t) => t !== tag),
                        }))
                      }
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
            {t("products.section_seo")}
          </h2>
          <div className="product-form-grid">
            <div className="product-form-field">
              <label htmlFor="product-meta-title-en">
                {t("products.meta_title_en")}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    marginLeft: 8,
                    color: "#64748b",
                  }}
                >
                  {form.metaTitleEn.length}/60
                </span>
              </label>
              <input
                id="product-meta-title-en"
                value={form.metaTitleEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaTitleEn: e.target.value }))
                }
                maxLength={60}
              />
              <p className="product-form-hint">
                {t("products.meta_title_hint")}
              </p>
            </div>
            <div className="product-form-field">
              <label htmlFor="product-meta-title-ar">
                {t("products.meta_title_ar")}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    marginLeft: 8,
                    color: "#64748b",
                  }}
                >
                  {form.metaTitleAr.length}/60
                </span>
              </label>
              <input
                id="product-meta-title-ar"
                value={form.metaTitleAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaTitleAr: e.target.value }))
                }
                maxLength={60}
              />
            </div>
            <div className="product-form-field">
              <label htmlFor="product-meta-desc-en">
                {t("products.meta_description_en")}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    marginLeft: 8,
                    color: "#64748b",
                  }}
                >
                  {form.metaDescriptionEn.length}/160
                </span>
              </label>
              <textarea
                id="product-meta-desc-en"
                value={form.metaDescriptionEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaDescriptionEn: e.target.value }))
                }
                maxLength={160}
                rows={2}
              />
              <p className="product-form-hint">
                {t("products.meta_description_hint")}
              </p>
            </div>
            <div className="product-form-field">
              <label htmlFor="product-meta-desc-ar">
                {t("products.meta_description_ar")}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    marginLeft: 8,
                    color: "#64748b",
                  }}
                >
                  {form.metaDescriptionAr.length}/160
                </span>
              </label>
              <textarea
                id="product-meta-desc-ar"
                value={form.metaDescriptionAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metaDescriptionAr: e.target.value }))
                }
                maxLength={160}
                rows={2}
              />
            </div>
          </div>
          {(form.metaTitleEn || form.nameEn) && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                backgroundColor: "#f1f5f9",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            >
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                {t("products.seo_preview")}
              </p>
              <p
                style={{
                  fontSize: 16,
                  color: "#1a0dab",
                  margin: "0 0 4px 0",
                  fontWeight: 500,
                }}
              >
                {form.metaTitleEn || form.nameEn}
              </p>
              <p
                style={{ fontSize: 13, color: "#006621", margin: "0 0 4px 0" }}
              >
                yourstore.com/products/{form.slugEn || form.slugAr || "..."}
              </p>
              <p style={{ fontSize: 13, color: "#545454", margin: 0 }}>
                {form.metaDescriptionEn ||
                  form.descriptionEn ||
                  "No description set"}
              </p>
            </div>
          )}
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
                {t("products.discount_percent")}
              </label>
              <input
                id="product-discount"
                type="number"
                step={1}
                min={0}
                max={100}
                placeholder="e.g. 10"
                value={
                  form.price > 0 && form.discountPrice != null
                    ? Math.round((1 - form.discountPrice / form.price) * 100)
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setForm((f) => ({ ...f, discountPrice: undefined }));
                    return;
                  }
                  const percent = Number(raw);
                  if (form.price > 0 && percent >= 0 && percent <= 100) {
                    setForm((f) => ({
                      ...f,
                      discountPrice: Math.round(f.price * (1 - percent / 100)),
                    }));
                  }
                }}
              />
              {form.price <= 0 && (
                <p className="product-form-hint">
                  {t("products.discount_set_price_first")}
                </p>
              )}
              {form.price > 0 &&
                form.discountPrice != null &&
                form.discountPrice < form.price && (
                  <p className="product-form-hint" style={{ marginTop: 6 }}>
                    {t("products.discount_calc_message", {
                      percent: Math.round(
                        (1 - form.discountPrice / form.price) * 100,
                      ),
                      amount: formatPriceEGP(form.price - form.discountPrice),
                      sale: formatPriceEGP(form.discountPrice),
                    })}
                  </p>
                )}
            </div>
            <div className="product-form-field">
              <label htmlFor="product-cost">
                {t("products.cost_per_item")} (EGP)
              </label>
              <input
                id="product-cost"
                type="number"
                step={0.01}
                min={0}
                value={form.costPerItem ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    costPerItem: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              />
              {form.costPerItem != null && form.costPerItem > 0 && (
                <p className="product-form-hint" style={{ marginTop: 6 }}>
                  {t("products.profit_margin")}:{" "}
                  {(() => {
                    const discountPrice = form.discountPrice ?? form.price;
                    if (discountPrice <= 0) return "N/A";
                    const margin = (
                      ((discountPrice - form.costPerItem) / discountPrice) *
                      100
                    ).toFixed(1);
                    return `${margin}% (${formatPriceEGP(discountPrice - form.costPerItem)} profit)`;
                  })()}
                </p>
              )}
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
                value={
                  form.variants.length > 0
                    ? form.variants.reduce(
                        (sum, v) => sum + (v.outOfStock ? 0 : v.stock),
                        0,
                      )
                    : form.stock
                }
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))
                }
                disabled={form.variants.length > 0}
                required
              />
              {form.variants.length > 0 && (
                <p className="product-form-hint" style={{ marginTop: 6 }}>
                  Stock is automatically calculated from variants below. To
                  manually set stock, remove all sizes and colors first.
                </p>
              )}
            </div>
            <div className="product-form-field">
              <label htmlFor="product-status">{t("dashboard.status")}</label>
              <select
                id="product-status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as "ACTIVE" | "INACTIVE" | "DRAFT",
                  }))
                }
              >
                <option value="ACTIVE">{t("common.active")}</option>
                <option value="INACTIVE">{t("common.inactive")}</option>
                <option value="DRAFT">{t("products.draft")}</option>
              </select>
            </div>
          </div>
          <div className="product-form-row" style={{ marginTop: 16 }}>
            <div className="product-form-field">
              <label htmlFor="product-weight">{t("products.weight")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="product-weight"
                  type="number"
                  step={1}
                  min={0}
                  value={form.weight ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      weight: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  style={{ flex: 1 }}
                />
                <select
                  value={form.weightUnit}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      weightUnit: e.target.value as "g" | "kg",
                    }))
                  }
                  style={{ width: 80 }}
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="product-form-section">
          <h2 className="product-form-section-title">
            {t("products.section_variants")}
          </h2>
          <p className="product-form-hint" style={{ marginBottom: 16 }}>
            Add sizes and colors, then manage inventory for each combination
            below.
          </p>
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

          {/* Variant Inventory Table */}
          {form.sizes.length > 0 && form.colors.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                Inventory Management
              </h3>
              <p className="product-form-hint" style={{ marginBottom: 16 }}>
                Set stock quantity for each size and color combination. Leave at
                0 or check &quot;Out of Stock&quot; for unavailable variants.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#fff",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          borderBottom: "2px solid #e2e8f0",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        Size
                      </th>
                      {form.colors.map((color) => (
                        <th
                          key={color}
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            borderBottom: "2px solid #e2e8f0",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {color}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.sizes.map((size) => (
                      <tr key={size}>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #e2e8f0",
                            fontWeight: 500,
                            fontSize: 14,
                          }}
                        >
                          {size}
                        </td>
                        {form.colors.map((color) => {
                          const variant = form.variants.find(
                            (v) => v.size === size && v.color === color,
                          );
                          const stock = variant?.stock ?? 0;
                          const isOutOfStock = variant?.outOfStock ?? true;

                          return (
                            <td
                              key={`${size}-${color}`}
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #e2e8f0",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <input
                                  type="number"
                                  min={0}
                                  value={stock}
                                  onChange={(e) =>
                                    updateVariantStock(
                                      size,
                                      color,
                                      Number(e.target.value) || 0,
                                    )
                                  }
                                  disabled={isOutOfStock}
                                  style={{
                                    width: "70px",
                                    padding: "6px 8px",
                                    textAlign: "center",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 4,
                                    fontSize: 13,
                                    opacity: isOutOfStock ? 0.5 : 1,
                                  }}
                                  aria-label={`Stock for ${size} ${color}`}
                                />
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 11,
                                    cursor: "pointer",
                                    userSelect: "none",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isOutOfStock}
                                    onChange={() =>
                                      toggleVariantOutOfStock(size, color)
                                    }
                                    style={{ cursor: "pointer" }}
                                  />
                                  <span style={{ color: "#64748b" }}>
                                    Out of stock
                                  </span>
                                </label>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: 600,
                          fontSize: 14,
                          borderTop: "2px solid #e2e8f0",
                        }}
                      >
                        Total Stock
                      </td>
                      {form.colors.map((color) => {
                        const totalForColor = form.variants
                          .filter((v) => v.color === color)
                          .reduce(
                            (sum, v) => sum + (v.outOfStock ? 0 : v.stock),
                            0,
                          );
                        return (
                          <td
                            key={`total-${color}`}
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontWeight: 600,
                              fontSize: 14,
                              borderTop: "2px solid #e2e8f0",
                              color:
                                totalForColor === 0 ? "#ef4444" : "#10b981",
                            }}
                          >
                            {totalForColor}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                <strong>Total Product Stock:</strong>{" "}
                {form.variants.reduce(
                  (sum, v) => sum + (v.outOfStock ? 0 : v.stock),
                  0,
                )}{" "}
                units across all variants
              </div>
            </div>
          )}
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
          <h2 className="product-form-section-title">Card Display Settings</h2>
          <p className="product-form-hint" style={{ marginBottom: 16 }}>
            Control what media shows on product cards in the store. Choose
            between images and videos for default view and hover state.
          </p>
          <div className="product-form-grid">
            <div className="product-form-field">
              <label htmlFor="default-media-type">
                Default Card Media
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    marginLeft: 8,
                    color: "#64748b",
                  }}
                >
                  (What shows first)
                </span>
              </label>
              <select
                id="default-media-type"
                value={form.defaultMediaType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    defaultMediaType: e.target.value as "image" | "video",
                  }))
                }
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  backgroundColor: "#fff",
                }}
              >
                <option value="image">
                  🖼️ Show Image (First image or custom view image)
                </option>
                <option value="video">
                  🎥 Show Video (First video as default)
                </option>
              </select>
              <p
                className="product-form-hint"
                style={{ marginTop: 8, fontSize: 13 }}
              >
                {form.defaultMediaType === "image"
                  ? "Product cards will display the first image by default"
                  : "Product cards will display the first video by default (if available)"}
              </p>
            </div>
            <div className="product-form-field">
              <label htmlFor="hover-media-type">
                Hover Card Media
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    marginLeft: 8,
                    color: "#64748b",
                  }}
                >
                  (What shows on hover)
                </span>
              </label>
              <select
                id="hover-media-type"
                value={form.hoverMediaType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hoverMediaType: e.target.value as "image" | "video",
                  }))
                }
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  backgroundColor: "#fff",
                }}
              >
                <option value="image">
                  🖼️ Show Image (Second image or custom hover image)
                </option>
                <option value="video">
                  🎥 Show Video (First video on hover)
                </option>
              </select>
              <p
                className="product-form-hint"
                style={{ marginTop: 8, fontSize: 13 }}
              >
                {form.hoverMediaType === "image"
                  ? "Product cards will show the second image on hover"
                  : "Product cards will show a video on hover (if available)"}
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: "#f1f5f9",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, lineHeight: "1.5" }}>
              <strong>💡 Preview:</strong> Default ={" "}
              <strong
                style={{
                  color:
                    form.defaultMediaType === "image" ? "#0ea5e9" : "#8b5cf6",
                }}
              >
                {form.defaultMediaType === "image" ? "Image" : "Video"}
              </strong>{" "}
              | Hover ={" "}
              <strong
                style={{
                  color:
                    form.hoverMediaType === "image" ? "#0ea5e9" : "#8b5cf6",
                }}
              >
                {form.hoverMediaType === "image" ? "Image" : "Video"}
              </strong>
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#64748b" }}>
              {form.images.length === 0 && form.videos.length === 0
                ? "⚠️ Please upload at least one image or video"
                : form.defaultMediaType === "video" && form.videos.length === 0
                  ? "⚠️ No videos uploaded yet. Add videos below or switch to image mode."
                  : form.hoverMediaType === "video" && form.videos.length === 0
                    ? "⚠️ No videos for hover. Add videos below or switch hover to image mode."
                    : "✓ Media configuration looks good!"}
            </p>
          </div>
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
