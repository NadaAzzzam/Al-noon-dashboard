import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, ContactSubmission } from "../services/api";

const LIMIT = 20;

const ContactSubmissionsPage = () => {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = (await api.listContactSubmissions({
          page,
          limit: LIMIT,
        })) as {
          data?: { submissions: ContactSubmission[] };
          pagination?: { total: number };
          submissions?: ContactSubmission[];
          total?: number;
        };
        setSubmissions(res.data?.submissions ?? res.submissions ?? []);
        setTotal(res.pagination?.total ?? res.total ?? 0);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : t("contact.failed_load"),
        );
      }
    };
    load();
  }, [page, t]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className="header">
        <div>
          <h1>{t("contact.title")}</h1>
          <p>{t("contact.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("contact.name")}</th>
              <th>{t("auth.email")}</th>
              <th>{t("contact.phone")}</th>
              <th>{t("contact.comment")}</th>
              <th>{t("contact.sent_at")}</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5}>{t("contact.no_submissions")}</td>
              </tr>
            )}
            {submissions.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.phone || "—"}</td>
                <td className="contact-comment-cell">{s.comment}</td>
                <td>
                  {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
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
    </div>
  );
};

export default ContactSubmissionsPage;
