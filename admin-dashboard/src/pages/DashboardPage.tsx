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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  SHIPPED: "#6366f1",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "badge badge-pending",
    CONFIRMED: "badge badge-confirmed",
    SHIPPED: "badge badge-shipped",
    DELIVERED: "badge badge-delivered",
    CANCELLED: "badge badge-cancelled",
  };
  return map[status] ?? "badge";
};

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

  // Revenue comparison
  const revenueChange = stats.revenueLastMonth > 0
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
    : stats.revenueThisMonth > 0 ? 100 : 0;

  // Order status breakdown
  const totalStatusOrders = (stats.orderStatusBreakdown ?? []).reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="header">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
      </div>

      {/* Row 1: Key metrics */}
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
          <h3>{t("dashboard.avg_order_value")}</h3>
          <p className="card-value">{formatPriceEGP(stats.averageOrderValue ?? 0)}</p>
        </div>
      </div>

      {/* Row 2: Secondary metrics */}
      <div className="card-grid">
        <div className="card">
          <h3>{t("dashboard.pending_orders")}</h3>
          <p className="card-value">
            {stats.pendingOrdersCount > 0 ? (
              <Link to="/orders" className="notif-badge low">{stats.pendingOrdersCount}</Link>
            ) : (
              stats.pendingOrdersCount
            )}
          </p>
        </div>
        <div className="card">
          <h3>{t("dashboard.total_customers")}</h3>
          <p className="card-value">
            <Link to="/customers" style={{ color: "inherit" }}>{stats.totalCustomers}</Link>
          </p>
        </div>
        <div className="card">
          <h3>{t("dashboard.total_products")}</h3>
          <p className="card-value">
            <Link to="/products" style={{ color: "inherit" }}>{stats.totalProducts}</Link>
          </p>
        </div>
        <div className="card">
          <h3>{t("dashboard.low_stock")}</h3>
          <p className="card-value">
            {(stats.lowStockCount + stats.outOfStockCount) > 0 ? (
              <Link to="/inventory" className="notif-badge low">
                {stats.lowStockCount + stats.outOfStockCount}
              </Link>
            ) : (
              0
            )}
          </p>
        </div>
      </div>

      {/* Row 3: Revenue Comparison + Order Status Breakdown */}
      <div className="dashboard-charts-row" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3>{t("dashboard.revenue_comparison")}</h3>
          <div className="dashboard-revenue-comparison">
            <div className="dashboard-revenue-stat">
              <p className="settings-hint" style={{ margin: "0 0 4px" }}>{t("dashboard.revenue_this_month")}</p>
              <p className="card-value" style={{ margin: 0 }}>{formatPriceEGP(stats.revenueThisMonth ?? 0)}</p>
            </div>
            <div className="dashboard-revenue-stat">
              <p className="settings-hint" style={{ margin: "0 0 4px" }}>{t("dashboard.revenue_last_month")}</p>
              <p className="card-value" style={{ margin: 0 }}>{formatPriceEGP(stats.revenueLastMonth ?? 0)}</p>
            </div>
          </div>
          {(stats.revenueThisMonth > 0 || stats.revenueLastMonth > 0) && (
            <p className={`dashboard-revenue-change ${revenueChange >= 0 ? "positive" : "negative"}`}>
              {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}% {t("dashboard.revenue_change")}
            </p>
          )}
        </div>

        <div className="card">
          <h3>{t("dashboard.order_status_breakdown")}</h3>
          {totalStatusOrders > 0 ? (
            <>
              <div className="dashboard-status-bar">
                {(stats.orderStatusBreakdown ?? []).map((s) => (
                  <div
                    key={s.status}
                    className="dashboard-status-segment"
                    style={{
                      width: `${(s.count / totalStatusOrders) * 100}%`,
                      backgroundColor: STATUS_COLORS[s.status] ?? "#94a3b8",
                    }}
                    title={`${s.status}: ${s.count}`}
                  />
                ))}
              </div>
              <div className="dashboard-status-legend">
                {(stats.orderStatusBreakdown ?? []).map((s) => (
                  <div key={s.status} className="dashboard-status-legend-item">
                    <span className="dashboard-status-dot" style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#94a3b8" }} />
                    <span>{t(`orders.${s.status.toLowerCase()}`, s.status)}</span>
                    <span className="badge" style={{ marginInlineStart: 4 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
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

        {/* Attention Needed */}
        <div className="card">
          <h3>{t("dashboard.attention_needed")}</h3>
          <ul className="dashboard-attention-list">
            {stats.pendingOrdersCount > 0 && (
              <li className="dashboard-attention-item">
                <span>{t("dashboard.pending_need_confirmation", { count: stats.pendingOrdersCount })}</span>
                <Link to="/orders">{t("common.view")}</Link>
              </li>
            )}
            {stats.lowStockCount > 0 && (
              <li className="dashboard-attention-item">
                <span>{t("dashboard.products_low_stock", { count: stats.lowStockCount })}</span>
                <Link to="/inventory">{t("common.view")}</Link>
              </li>
            )}
            {stats.outOfStockCount > 0 && (
              <li className="dashboard-attention-item">
                <span>{t("dashboard.products_out_of_stock", { count: stats.outOfStockCount })}</span>
                <Link to="/inventory">{t("common.view")}</Link>
              </li>
            )}
            {stats.pendingOrdersCount === 0 && stats.lowStockCount === 0 && stats.outOfStockCount === 0 && (
              <li className="dashboard-attention-item">
                <span style={{ color: "#64748b" }}>{t("dashboard.all_good")}</span>
              </li>
            )}
          </ul>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
            <p className="analytics-tracking-desc">{t("analytics.tracking_desc")}</p>
            <Link to="/settings" className="button secondary">{t("analytics.configure_ga")}</Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
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
                  <span className={statusBadgeClass(order.status)}>
                    {t(`orders.${order.status.toLowerCase()}`, order.status)}
                  </span>
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
