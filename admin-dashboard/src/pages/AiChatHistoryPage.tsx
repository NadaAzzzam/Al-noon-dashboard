import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError, getProductImageUrl, getUploadsBaseUrl } from "../services/api";

type SessionSummary = {
  id: string;
  sessionId: string;
  messageCount: number;
  customerName?: string;
  customerEmail?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ProductCard = {
  id: string;
  name: { en: string; ar: string };
  image: string;
  productUrl: string;
};

type ChatMessage = {
  role: string;
  content: string;
  timestamp?: string;
  productCards?: ProductCard[];
};

const LIMIT = 20;

const AiChatHistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: selectedId } = useParams<{ id: string }>();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    id: string;
    sessionId: string;
    messages: ChatMessage[];
    customerName?: string;
    customerEmail?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = (await api.listAiSessions({ page, limit: LIMIT })) as {
          data?: { sessions: SessionSummary[]; total: number; page: number; limit: number };
          sessions?: SessionSummary[];
          total?: number;
        };
        const data = res.data ?? res;
        setSessions(data.sessions ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : t("ai_chats.failed_load"));
      }
    };
    load();
  }, [page, t]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const load = async () => {
      try {
        const res = (await api.getAiSession(selectedId)) as {
          data?: {
            id: string;
            sessionId: string;
            messages: ChatMessage[];
            customerName?: string;
            customerEmail?: string;
            status: string;
            createdAt: string;
            updatedAt: string;
          };
        };
        setDetail(res.data ?? null);
      } catch {
        setDetail(null);
      }
    };
    load();
  }, [selectedId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("ai_chats.delete_confirm"))) return;
    setDeletingId(id);
    try {
      await api.deleteAiSession(id);
      if (detail?.id === id) {
        navigate("/ai-chats");
        setDetail(null);
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ai_chats.failed_delete"));
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className="header">
        <div>
          <h1>{t("ai_chats.title")}</h1>
          <p>{t("ai_chats.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("ai_chats.date")}</th>
              <th>{t("ai_chats.session_id")}</th>
              <th>{t("ai_chats.message_count")}</th>
              <th>{t("ai_chats.customer")}</th>
              <th>{t("ai_chats.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6}>{t("ai_chats.no_sessions")}</td>
              </tr>
            )}
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}</td>
                <td>
                  <code style={{ fontSize: 12 }}>{s.sessionId.slice(0, 20)}…</code>
                </td>
                <td>{s.messageCount}</td>
                <td>{s.customerName || s.customerEmail || "—"}</td>
                <td>{s.status === "active" ? t("ai_chats.active") : t("ai_chats.closed")}</td>
                <td>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => navigate(`/ai-chats/${s.id}`)}
                  >
                    {t("ai_chats.view")}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    style={{ marginLeft: 8 }}
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
                  >
                    {deletingId === s.id ? t("common.loading") : t("ai_chats.delete")}
                  </button>
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

      {selectedId && detail && (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{t("ai_chats.view")} — {detail.sessionId.slice(0, 24)}…</h2>
            <button type="button" className="button secondary" onClick={() => navigate("/ai-chats")}>
              {t("common.close")}
            </button>
          </div>
          {(detail.customerName || detail.customerEmail) && (
            <p style={{ marginBottom: 12, color: "var(--text-secondary)" }}>
              {detail.customerName} {detail.customerEmail && `(${detail.customerEmail})`}
            </p>
          )}
          <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
            {detail.messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  padding: 10,
                  borderRadius: 8,
                  background: m.role === "user" ? "var(--bg-secondary)" : "var(--bg-tertiary)",
                  marginLeft: m.role === "assistant" ? 0 : 24,
                  marginRight: m.role === "user" ? 0 : 24
                }}
              >
                <strong style={{ fontSize: 12, textTransform: "capitalize" }}>{m.role}</strong>
                <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{m.content}</p>
                {m.role === "assistant" && m.productCards && m.productCards.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                    {m.productCards.map((card) => (
                      <div
                        key={card.id}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          overflow: "hidden",
                          width: 160,
                          background: "var(--bg-primary)"
                        }}
                      >
                        {card.image ? (
                          <img
                            src={getProductImageUrl(card.image)}
                            alt={card.name?.en || card.name?.ar || "Product"}
                            style={{ width: "100%", height: 140, objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: 140, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                            {t("ai_chats.no_image")}
                          </div>
                        )}
                        <div style={{ padding: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                            {card.name?.en || card.name?.ar || "Product"}
                          </div>
                          <a
                            href={getUploadsBaseUrl() + card.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, wordBreak: "break-all" }}
                          >
                            {getUploadsBaseUrl()}{card.productUrl}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.timestamp && (
                  <small style={{ opacity: 0.7 }}>{new Date(m.timestamp).toLocaleString()}</small>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedId && !detail && (
        <div className="card" style={{ marginTop: 24 }}>
          <p>{t("common.loading")}</p>
        </div>
      )}
    </div>
  );
};

export default AiChatHistoryPage;
