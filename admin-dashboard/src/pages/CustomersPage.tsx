import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError, Customer, getProductImageUrl } from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { ImageLightbox } from "../components/ImageLightbox";

const CustomersPage = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imagePopupSrc, setImagePopupSrc] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const response = (await api.listCustomers()) as { data?: { customers: Customer[] }; customers?: Customer[] };
        setCustomers(response.data?.customers ?? response.customers ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : t("customers.failed_load"));
      }
    };
    load();
  }, []);

  return (
    <div>
      <ImageLightbox
        open={!!imagePopupSrc}
        src={imagePopupSrc}
        onClose={() => setImagePopupSrc(null)}
      />
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <div>
          <h1>{t("customers.title")}</h1>
          <p>{t("customers.subtitle")}</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>{t("customers.image")}</th>
              <th>{t("categories.name")}</th>
              <th>{t("auth.email")}</th>
              <th>{t("common.role")}</th>
              <th>{t("customers.member_since")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const avatarUrl = customer.avatar ? getProductImageUrl(customer.avatar) : null;
              const initials = (customer.name || "?")
                .trim()
                .split(/\s+/)
                .map((s) => s[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <tr key={customer.id}>
                  <td>
                    <button
                      type="button"
                      className="customer-avatar-cell"
                      onClick={() => avatarUrl && setImagePopupSrc(avatarUrl)}
                      onKeyDown={(e) => e.key === "Enter" && avatarUrl && setImagePopupSrc(avatarUrl)}
                      title={avatarUrl ? t("common.view_image") : undefined}
                      disabled={!avatarUrl}
                      aria-label={avatarUrl ? t("common.view_image") : undefined}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="customer-avatar-img" />
                      ) : (
                        <span className="customer-avatar-initials">{initials}</span>
                      )}
                    </button>
                  </td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td><span className="badge">{customer.role}</span></td>
                  <td>
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })
                      : "—"}
                  </td>
                  <td>
                    <TableActionsDropdown
                      ariaLabel={t("common.actions")}
                      actions={[{ label: t("common.view"), to: `/customers/${customer.id}` }]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersPage;
