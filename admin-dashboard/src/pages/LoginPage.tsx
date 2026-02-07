import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../services/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("admin@localhost");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.signIn(email, password) as { token: string };
      localStorage.setItem("al_noon_token", response.token);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || (err.status === 401 ? t("auth.invalid_credentials") : t("auth.something_wrong")));
      } else {
        setError(err instanceof Error ? err.message : t("auth.login_failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
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
        <button className="button" type="submit" disabled={loading} style={{ width: "100%", marginTop: 12 }}>
          {loading ? t("auth.signing_in") : t("auth.sign_in")}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
