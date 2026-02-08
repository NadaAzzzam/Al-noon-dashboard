import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Product, ProductFeedback, getUploadsBaseUrl } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";

const LIMIT = 20;

type FeedbackForm = {
  product: string;
  customerName: string;
  message: string;
  rating: number;
  image: string;
  approved: boolean;
  order: number;
};

const emptyForm: FeedbackForm = {
  product: "",
  customerName: "",
  message: "",
  rating: 5,
  image: "",
  approved: false,
  order: 0
};

const getProductName = (p: ProductFeedback): string => {
  const prod = p.product;
  if (!prod) return "—";
  if (typeof prod === "string") return prod;
  const name = prod.name;
  const lang = document.documentElement.lang === "ar" ? "ar" : "en";
  const n = name as { en?: string; ar?: string } | undefined;
  return (name && name[lang]) || n?.en || n?.ar || "—";
};

const FeedbackPage = () => {
  const { t } = useTranslation();
  const [list, setList] = useState<ProductFeedback[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [approvedFilter, setApprovedFilter] = useState<"all" | "true" | "false">("all");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FeedbackForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const res = (await api.listFeedback({
        page,
        limit: LIMIT,
        approved: approvedFilter === "all" ? undefined : approvedFilter
      })) as { feedback: ProductFeedback[]; total: number };
      setList(res.feedback ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : t("feedback.failed_load"));
    }
  }, [page, approvedFilter, t]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    api
      .listProducts({ limit: 500, status: "ACTIVE" })
      .then((data: unknown) => {
        const d = data as { products?: Product[] };
        setProducts(d.products ?? []);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: ProductFeedback) => {
    setEditingId(item._id);
    const productId = typeof item.product === "string" ? item.product : item.product?._id ?? "";
    setForm({
      product: productId,
      customerName: item.customerName ?? "",
      message: item.message ?? "",
      rating: item.rating ?? 5,
      image: item.image ?? "",
      approved: item.approved ?? false,
      order: item.order ?? 0
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product || !form.customerName.trim() || !form.message.trim()) {
      setError(t("feedback.required_fields"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.updateFeedback(editingId, {
          product: form.product,
          customerName: form.customerName.trim(),
          message: form.message.trim(),
          rating: form.rating,
          image: form.image || undefined,
          approved: form.approved,
          order: form.order
        });
      } else {
        await api.createFeedback({
          product: form.product,
          customerName: form.customerName.trim(),
          message: form.message.trim(),
          rating: form.rating,
          image: form.image || undefined,
          approved: form.approved,
          order: form.order
        });
      }
      closeModal();
      loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("feedback.failed_save"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("feedback.confirm_delete"))) return;
    try {
      await api.deleteFeedback(id);
      loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("feedback.failed_delete"));
    }
  };

  const toggleApproved = async (item: ProductFeedback) => {
    try {
      await api.setFeedbackApproved(item._id, !item.approved);
      loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("feedback.failed_save"));
    }
  };

  const onImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const path = await api.uploadFeedbackImage(file);
      setForm((f) => ({ ...f, image: path }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("feedback.failed_upload"));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const imageUrl = (path: string) => (path ? (path.startsWith("http") ? path : getUploadsBaseUrl() + path) : "");

  return (
    <div>
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className="header" style={{ flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>{t("feedback.title")}</h1>
          <p>{t("feedback.subtitle")}</p>
        </div>
        <button type="button" className="button" onClick={openCreate}>
          {t("feedback.add")}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            {t("feedback.filter_approved")}
            <select
              value={approvedFilter}
              onChange={(e) => setApprovedFilter(e.target.value as "all" | "true" | "false")}
              style={{ marginLeft: 8 }}
            >
              <option value="all">{t("feedback.filter_all")}</option>
              <option value="true">{t("feedback.approved_yes")}</option>
              <option value="false">{t("feedback.approved_no")}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("feedback.product")}</th>
              <th>{t("feedback.customer")}</th>
              <th>{t("feedback.message")}</th>
              <th>{t("feedback.rating")}</th>
              <th>{t("feedback.screenshot")}</th>
              <th>{t("feedback.approved")}</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7}>{t("feedback.no_items")}</td>
              </tr>
            )}
            {list.map((item) => (
              <tr key={item._id}>
                <td>{getProductName(item)}</td>
                <td>{item.customerName || "—"}</td>
                <td className="contact-comment-cell" style={{ maxWidth: 240 }}>
                  {item.message?.slice(0, 80)}
                  {(item.message?.length ?? 0) > 80 ? "…" : ""}
                </td>
                <td>
                  <span title={`${item.rating} / 5`}>
                    {"★".repeat(item.rating ?? 0)}
                    {"☆".repeat(5 - (item.rating ?? 0))}
                  </span>
                </td>
                <td>
                  {item.image ? (
                    <a href={imageUrl(item.image)} target="_blank" rel="noopener noreferrer" title={t("feedback.view_image")}>
                      <img
                        src={imageUrl(item.image)}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                      />
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={`button small ${item.approved ? "secondary" : ""}`}
                    onClick={() => toggleApproved(item)}
                    title={item.approved ? t("feedback.unapprove") : t("feedback.approve")}
                  >
                    {item.approved ? t("feedback.approved_yes") : t("feedback.approved_no")}
                  </button>
                </td>
                <td>
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      { label: t("common.edit"), onClick: () => openEdit(item) },
                      { label: t("common.delete"), onClick: () => handleDelete(item._id), danger: true }
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="button secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("common.prev")}
            </button>
            <span>
              {t("common.page")} {page} {t("common.of")} {totalPages}
            </span>
            <button
              className="button secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2>{editingId ? t("feedback.edit") : t("feedback.add")}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t("feedback.product")} *</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                  required
                >
                  <option value="">{t("feedback.select_product")}</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {typeof p.name === "object" ? (p.name.en || p.name.ar) : p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t("feedback.customer")} *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  placeholder={t("feedback.customer_placeholder")}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("feedback.message")} *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={t("feedback.message_placeholder")}
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("feedback.rating")} *</label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {"★".repeat(n)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t("feedback.screenshot")}</label>
                <p className="settings-hint" style={{ marginBottom: 8 }}>
                  {t("feedback.screenshot_hint")}
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={onImageSelect}
                  disabled={uploadingImage}
                />
                {uploadingImage && <span style={{ marginLeft: 8 }}>{t("common.loading")}…</span>}
                {form.image && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={imageUrl(form.image)}
                      alt=""
                      style={{ maxWidth: 120, maxHeight: 120, objectFit: "contain", borderRadius: 4 }}
                    />
                    <button
                      type="button"
                      className="button secondary small"
                      style={{ marginLeft: 8 }}
                      onClick={() => setForm((f) => ({ ...f, image: "" }))}
                    >
                      {t("common.remove")}
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.approved}
                    onChange={(e) => setForm((f) => ({ ...f, approved: e.target.checked }))}
                  />
                  {t("feedback.show_on_home")}
                </label>
              </div>
              <div className="form-group">
                <label>{t("feedback.order")}</label>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button type="submit" className="button" disabled={saving}>
                  {saving ? t("common.saving") : editingId ? t("common.save") : t("feedback.add")}
                </button>
                <button type="button" className="button secondary" onClick={closeModal}>
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
