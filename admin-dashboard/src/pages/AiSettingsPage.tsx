import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Settings } from "../services/api";

type AiForm = {
  enabled: boolean;
  geminiApiKey: string;
  greetingEn: string;
  greetingAr: string;
  systemPrompt: string;
  suggestedQuestions: { en: string; ar: string }[];
};

const AiSettingsPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState<AiForm>({
    enabled: false,
    geminiApiKey: "",
    greetingEn: "Hi! How can I help you today?",
    greetingAr: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
    systemPrompt: "",
    suggestedQuestions: [
      { en: "What are your shipping options?", ar: "ما خيارات الشحن لديكم؟" },
      { en: "How can I return an item?", ar: "كيف أستطيع إرجاع منتج؟" },
      { en: "Show me new arrivals", ar: "أرني الوصول الجديد" }
    ]
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSettings()
      .then((res: unknown) => {
        const body = res as { data?: { settings: Settings }; settings?: Settings };
        const d = body.data?.settings ?? body.settings;
        const ai = d?.aiAssistant;
        if (ai) {
          setForm({
            enabled: Boolean(ai.enabled),
            geminiApiKey: ai.geminiApiKey ?? "",
            greetingEn: ai.greeting?.en ?? "",
            greetingAr: ai.greeting?.ar ?? "",
            systemPrompt: ai.systemPrompt ?? "",
            suggestedQuestions: Array.isArray(ai.suggestedQuestions) && ai.suggestedQuestions.length > 0
              ? ai.suggestedQuestions.map((q: { en?: string; ar?: string }) => ({ en: q.en ?? "", ar: q.ar ?? "" }))
              : [
                  { en: "What are your shipping options?", ar: "ما خيارات الشحن لديكم؟" },
                  { en: "How can I return an item?", ar: "كيف أستطيع إرجاع منتج؟" },
                  { en: "Show me new arrivals", ar: "أرني الوصول الجديد" }
                ]
          });
        }
      })
      .catch(() => setError(t("settings.failed_load")))
      .finally(() => setLoading(false));
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings({
        aiAssistant: {
          enabled: form.enabled,
          geminiApiKey: form.geminiApiKey.trim(),
          greetingEn: form.greetingEn.trim(),
          greetingAr: form.greetingAr.trim(),
          systemPrompt: form.systemPrompt.trim(),
          suggestedQuestions: form.suggestedQuestions.filter((q) => q.en.trim() || q.ar.trim())
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.failed_save"));
    }
  };

  const addQuestion = () => {
    setForm((f) => ({ ...f, suggestedQuestions: [...f.suggestedQuestions, { en: "", ar: "" }] }));
  };

  const removeQuestion = (index: number) => {
    setForm((f) => ({
      ...f,
      suggestedQuestions: f.suggestedQuestions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: "en" | "ar", value: string) => {
    setForm((f) => ({
      ...f,
      suggestedQuestions: f.suggestedQuestions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  if (loading) {
    return (
      <div className="page">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="settings-page settings-page-full-width">
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
          <h1>{t("settings.ai_title")}</h1>
          <p className="header-subtitle">{t("settings.ai_subtitle")}</p>
        </div>
      </div>
      <div className="card settings-card">
        <form onSubmit={handleSubmit} className="settings-form">
          <section className="settings-section">
            <h3 className="settings-section-title">{t("settings.tab_ai_assistant")}</h3>
            <div className="settings-fields">
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="ai-enabled"
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                />
                <label htmlFor="ai-enabled">{t("settings.ai_enabled")}</label>
              </div>
              <div className="form-group">
                <label htmlFor="ai-gemini-key">{t("settings.ai_gemini_api_key")}</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    id="ai-gemini-key"
                    type={showApiKey ? "text" : "password"}
                    value={form.geminiApiKey}
                    onChange={(e) => setForm((f) => ({ ...f, geminiApiKey: e.target.value }))}
                    placeholder={t("settings.ai_gemini_api_key_placeholder")}
                    autoComplete="off"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setShowApiKey((v) => !v)}
                  >
                    {showApiKey ? t("settings.ai_hide_key") : t("settings.ai_show_key")}
                  </button>
                </div>
                <p className="settings-hint" style={{ marginTop: 4 }}>
                  {t("settings.ai_gemini_api_key_hint")}
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="ai-greeting-en">{t("settings.ai_greeting_en")}</label>
                <input
                  id="ai-greeting-en"
                  value={form.greetingEn}
                  onChange={(e) => setForm((f) => ({ ...f, greetingEn: e.target.value }))}
                  placeholder={t("settings.ai_greeting_placeholder")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ai-greeting-ar">{t("settings.ai_greeting_ar")}</label>
                <input
                  id="ai-greeting-ar"
                  value={form.greetingAr}
                  onChange={(e) => setForm((f) => ({ ...f, greetingAr: e.target.value }))}
                  placeholder={t("settings.ai_greeting_placeholder")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ai-system-prompt">{t("settings.ai_system_prompt")}</label>
                <textarea
                  id="ai-system-prompt"
                  value={form.systemPrompt}
                  onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                  placeholder={t("settings.ai_system_prompt_placeholder")}
                  rows={4}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>
              <div className="form-group">
                <label>{t("settings.ai_suggested_questions")}</label>
                <p className="settings-hint" style={{ marginBottom: 8 }}>
                  {t("settings.ai_suggested_questions_hint")}
                </p>
                {form.suggestedQuestions.map((q, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      marginBottom: 8,
                      flexWrap: "wrap"
                    }}
                  >
                    <input
                      value={q.en}
                      onChange={(e) => updateQuestion(index, "en", e.target.value)}
                      placeholder={t("settings.ai_question_en")}
                      style={{ flex: 1, minWidth: 140 }}
                    />
                    <input
                      value={q.ar}
                      onChange={(e) => updateQuestion(index, "ar", e.target.value)}
                      placeholder={t("settings.ai_question_ar")}
                      style={{ flex: 1, minWidth: 140 }}
                    />
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => removeQuestion(index)}
                    >
                      {t("settings.ai_remove_question")}
                    </button>
                  </div>
                ))}
                <button type="button" className="button secondary" onClick={addQuestion}>
                  {t("settings.ai_add_question")}
                </button>
              </div>
            </div>
          </section>
          <div style={{ marginTop: 24 }}>
            <button type="submit" className="button primary">
              {t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiSettingsPage;
