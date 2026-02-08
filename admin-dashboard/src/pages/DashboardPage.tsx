import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  api,
  ApiError,
  DashboardStats,
  Order,
  getProductImageUrl,
} from "../services/api";
import { TableActionsDropdown } from "../components/TableActionsDropdown";
import { formatPriceEGP } from "../utils/format";
import { useLocalized } from "../utils/localized";

const DashboardPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.getDashboardStats(30),
          api.listOrders({ limit: 20 }),
        ]);
        setStats(statsRes as DashboardStats);
        setRecentOrders((ordersRes as { orders: Order[] }).orders ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(
          err instanceof ApiError ? err.message : t("dashboard.failed_load"),
        );
      }
    };
    load();
  }, [t]);

  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div>{t("common.loading")}</div>;

  const ordersPerDay = stats.ordersPerDay ?? [];
  const chartSlice = ordersPerDay.slice(-14);
  const maxCount = chartSlice.length
    ? Math.max(...chartSlice.map((x) => x.count))
    : 1;
  const maxRevenue = chartSlice.length
    ? Math.max(...chartSlice.map((x) => x.revenue ?? 0))
    : 1;

  return (
    <div>
      <div className="header">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3>{t("dashboard.total_orders")}</h3>
          <p className="card-value">{stats.totalOrders}</p>
        </div>
        <div className="card">
          <h3>{t("dashboard.orders_today")}</h3>
          <p className="card-value">{stats.ordersToday}</p>
        </div>
        <div className="card">
          <h3>{t("dashboard.revenue_delivered")}</h3>
          <p className="card-value">{formatPriceEGP(stats.revenue ?? 0)}</p>
        </div>
        <div className="card">
          <h3>{t("dashboard.low_stock")}</h3>
          <p className="card-value">
            {stats.lowStockCount > 0 ? (
              <Link to="/inventory" className="notif-badge low">
                {stats.lowStockCount}
              </Link>
            ) : (
              stats.lowStockCount
            )}
          </p>
        </div>
      </div>

      {/* Mini trend: vertical bar strip (last 14 days) */}
      {chartSlice.length > 0 && (
        <div className="card dashboard-trend-card">
          <h3>{t("dashboard.orders_per_day")}</h3>
          <div className="dashboard-vertical-chart" aria-hidden>
            {chartSlice.map((d) => (
              <div
                key={d._id}
                className="dashboard-vertical-bar-wrap"
                title={`${d._id}: ${d.count}`}
              >
                <div
                  className="dashboard-vertical-bar"
                  style={{
                    height: `${Math.min(100, (d.count / maxCount) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <p className="dashboard-trend-legend">
            {chartSlice[0]?._id} → {chartSlice[chartSlice.length - 1]?._id}
          </p>
        </div>
      )}

      <div className="dashboard-charts-row">
        <div className="card card-chart">
          <h3>{t("dashboard.orders_per_day")}</h3>
          <div className="chart-bars">
            {chartSlice.map((d) => (
              <div key={d._id} className="chart-bar-row">
                <span className="chart-label">{d._id}</span>
                <div className="chart-bar-wrap">
                  <div
                    className="chart-bar"
                    style={{
                      width: `${Math.min(100, (d.count / maxCount) * 100)}%`,
                    }}
                  />
                </div>
                <span className="chart-value">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-chart">
          <h3>{t("dashboard.revenue_per_day")}</h3>
          <div className="chart-bars">
            {chartSlice.map((d) => (
              <div key={d._id} className="chart-bar-row">
                <span className="chart-label">{d._id}</span>
                <div className="chart-bar-wrap">
                  <div
                    className="chart-bar chart-bar-revenue"
                    style={{
                      width: `${Math.min(100, maxRevenue ? ((d.revenue ?? 0) / maxRevenue) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <span className="chart-value">
                  {formatPriceEGP(d.revenue ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="dashboard-charts-row"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
      >
        <div className="card">
          <h3>{t("dashboard.best_selling")}</h3>
          <ul className="list list-with-images">
            {(stats.bestSelling ?? []).slice(0, 12).map((b, i) => (
              <li key={b.productId ?? i}>
                {b.image ? (
                  <img
                    src={getProductImageUrl(b.image)}
                    alt=""
                    className="dashboard-product-img"
                  />
                ) : (
                  <span
                    className="dashboard-product-img-placeholder"
                    aria-hidden
                  />
                )}
                <span className="list-item-label">{localized(b.name)}</span>
                <span className="badge">
                  {b.totalQty} {t("dashboard.sold")}
                </span>
              </li>
            ))}
            {(!stats.bestSelling || stats.bestSelling.length === 0) && (
              <li>{t("dashboard.no_data")}</li>
            )}
          </ul>
          <p className="analytics-hint">
            <Link to="/products">{t("analytics.view_all_products")}</Link>
          </p>
        </div>
        <div className="card">
          <h3>{t("analytics.tracking")}</h3>
          <p className="analytics-tracking-desc">
            {t("analytics.tracking_desc")}
          </p>
          <Link to="/settings" className="button secondary">
            {t("analytics.configure_ga")}
          </Link>
        </div>
      </div>
      <div className="card">
        <h3>{t("dashboard.recent_orders")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("dashboard.order")}</th>
              <th>{t("dashboard.customer")}</th>
              <th>{t("dashboard.status")}</th>
              <th>{t("dashboard.total")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order._id}>
                <td>{order._id.slice(-8)}</td>
                <td>{order.user?.name ?? "—"}</td>
                <td>
                  <span className="badge">{order.status}</span>
                </td>
                <td>{formatPriceEGP(order.total)}</td>
                <td>
                  <TableActionsDropdown
                    ariaLabel={t("common.actions")}
                    actions={[
                      { label: t("common.view"), to: `/orders/${order._id}` },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="analytics-hint">
          <Link to="/orders">{t("analytics.view_all_orders")}</Link>
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
