import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Subscriber } from "../services/api";

const LIMIT = 20;

const SubscribersPage = () => {
  const { t } = useTranslation();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = (await api.listSubscribers({ page, limit: LIMIT })) as {
          data?: { subscribers: Subscriber[] };
          pagination?: { total: number };
          subscribers?: Subscriber[];
          total?: number;
        };
        setSubscribers(res.data?.subscribers ?? res.subscribers ?? []);
        setTotal(res.pagination?.total ?? res.total ?? 0);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : t("subscribers.failed_load"),
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
          <h1>{t("subscribers.title")}</h1>
          <p>{t("subscribers.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("auth.email")}</th>
              <th>{t("subscribers.subscribed_at")}</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={2}>{t("subscribers.no_subscribers")}</td>
              </tr>
            )}
            {subscribers.map((s) => (
              <tr key={s.email}>
                <td>{s.email}</td>
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

export default SubscribersPage;
