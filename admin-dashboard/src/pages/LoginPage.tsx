import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getStoredLanguage, setStoredLanguage, type Lang } from "../i18n";
import { api, ApiError } from "../services/api";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@localhost");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getDisplayMessage());
      } else {
        setError(err instanceof Error ? err.message : t("auth.login_failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const currentLang = getStoredLanguage();
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div
          className="lang-switcher"
          style={{ justifyContent: "flex-end", marginBottom: 12 }}
        >
          <button
            type="button"
            className={
              currentLang === "en"
                ? "button lang-btn active"
                : "button secondary lang-btn"
            }
            onClick={() => setStoredLanguage("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={
              currentLang === "ar"
                ? "button lang-btn active"
                : "button secondary lang-btn"
            }
            onClick={() => setStoredLanguage("ar")}
          >
            عربي
          </button>
        </div>
        <h1>{t("auth.login_title")}</h1>
        <p>{t("auth.login_subtitle")}</p>
        <input
          type="email"
          placeholder={t("auth.email")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("auth.password")}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button
          className="button"
          type="submit"
          disabled={loading}
          style={{ width: "100%", marginTop: 12 }}
        >
          {loading ? t("auth.signing_in") : t("auth.sign_in")}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
