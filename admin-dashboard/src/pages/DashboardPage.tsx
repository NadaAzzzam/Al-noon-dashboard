import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

/* ===== SVG Icons for stat cards ===== */
const IconShoppingBag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconTrendingUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconPeople = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconPackage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconAlertTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconChartBar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);
const GA4_REPORT_URL = "https://analytics.google.com/analytics/web/";

/* Loading skeleton */
const DashboardSkeleton = () => (
  <div>
    <div className="header"><div><div className="skeleton skeleton-line" style={{ width: 200, height: 28 }} /><div className="skeleton skeleton-line" style={{ width: 300, height: 14, marginTop: 8 }} /></div></div>
    <div className="skeleton-card-grid">
      {[1, 2, 3, 4].map(i => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--value" />
        </div>
      ))}
    </div>
    <div className="skeleton-card-grid">
      {[5, 6, 7, 8].map(i => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--value" />
        </div>
      ))}
    </div>
    <div className="dashboard-charts-row" style={{ marginBottom: 24 }}>
      <div className="skeleton-card" style={{ height: 200 }}><div className="skeleton skeleton-line" style={{ width: "60%", height: 16 }} /></div>
      <div className="skeleton-card" style={{ height: 200 }}><div className="skeleton skeleton-line" style={{ width: "60%", height: 16 }} /></div>
    </div>
  </div>
);

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
  if (!stats) return <DashboardSkeleton />;

  const ordersPerDay = stats.ordersPerDay ?? [];
  const chartSlice = ordersPerDay.slice(-14);
  const maxRevenue = chartSlice.length
    ? Math.max(...chartSlice.map((x) => x.revenue ?? 0))
    : 1;
  const ordersChartData = ordersPerDay.map((d) => ({
    date: d._id,
    count: d.count,
    shortDate: d._id.length >= 10 ? d._id.slice(5, 10) : d._id,
  }));

  const revenueChange =
    stats.revenueLastMonth > 0
      ? ((stats.revenueThisMonth - stats.revenueLastMonth) /
          stats.revenueLastMonth) *
        100
      : stats.revenueThisMonth > 0
        ? 100
        : 0;

  const totalStatusOrders = (stats.orderStatusBreakdown ?? []).reduce(
    (sum, s) => sum + s.count,
    0,
  );

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
        <div className="card stat-card stat-card--blue">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.total_orders")}</h3>
              <p className="card-value">{stats.totalOrders}</p>
            </div>
            <div className="stat-card-icon stat-card-icon--blue"><IconShoppingBag /></div>
          </div>
        </div>
        <div className="card stat-card stat-card--indigo">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.orders_today")}</h3>
              <p className="card-value">{stats.ordersToday}</p>
            </div>
            <div className="stat-card-icon stat-card-icon--indigo"><IconCalendar /></div>
          </div>
        </div>
        <div className="card stat-card stat-card--green">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.revenue_delivered")}</h3>
              <p className="card-value">{formatPriceEGP(stats.revenue ?? 0)}</p>
            </div>
            <div className="stat-card-icon stat-card-icon--green"><IconDollar /></div>
          </div>
        </div>
        <div className="card stat-card stat-card--purple">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.avg_order_value")}</h3>
              <p className="card-value">{formatPriceEGP(stats.averageOrderValue ?? 0)}</p>
            </div>
            <div className="stat-card-icon stat-card-icon--purple"><IconTrendingUp /></div>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary metrics */}
      <div className="card-grid">
        <div className="card stat-card stat-card--amber">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.pending_orders")}</h3>
              <p className="card-value">
                {stats.pendingOrdersCount > 0 ? (
                  <Link to="/orders" className="notif-badge low">
                    {stats.pendingOrdersCount}
                  </Link>
                ) : (
                  stats.pendingOrdersCount
                )}
              </p>
            </div>
            <div className="stat-card-icon stat-card-icon--amber"><IconClock /></div>
          </div>
        </div>
        <div className="card stat-card stat-card--blue">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.total_customers")}</h3>
              <p className="card-value">
                <Link to="/customers" style={{ color: "inherit" }}>
                  {stats.totalCustomers}
                </Link>
              </p>
            </div>
            <div className="stat-card-icon stat-card-icon--blue"><IconPeople /></div>
          </div>
        </div>
        <div className="card stat-card stat-card--indigo">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.total_products")}</h3>
              <p className="card-value">
                <Link to="/products" style={{ color: "inherit" }}>
                  {stats.totalProducts}
                </Link>
              </p>
            </div>
            <div className="stat-card-icon stat-card-icon--indigo"><IconPackage /></div>
          </div>
        </div>
        <div className="card stat-card stat-card--red">
          <div className="stat-card-header">
            <div>
              <h3>{t("dashboard.low_stock")}</h3>
              <p className="card-value">
                {stats.lowStockCount + stats.outOfStockCount > 0 ? (
                  <Link to="/inventory" className="notif-badge low">
                    {stats.lowStockCount + stats.outOfStockCount}
                  </Link>
                ) : (
                  0
                )}
              </p>
            </div>
            <div className="stat-card-icon stat-card-icon--red"><IconAlertTriangle /></div>
          </div>
        </div>
      </div>

      {/* Row 3: Revenue Comparison + Order Status Breakdown */}
      <div className="dashboard-charts-row" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>{t("dashboard.revenue_comparison")}</h3>
          </div>
          <div className="dashboard-revenue-comparison">
            <div className="dashboard-revenue-stat">
              <p className="settings-hint" style={{ margin: "0 0 4px" }}>
                {t("dashboard.revenue_this_month")}
              </p>
              <p className="card-value" style={{ margin: 0, fontSize: 22 }}>
                {formatPriceEGP(stats.revenueThisMonth ?? 0)}
              </p>
            </div>
            <div className="dashboard-revenue-stat">
              <p className="settings-hint" style={{ margin: "0 0 4px" }}>
                {t("dashboard.revenue_last_month")}
              </p>
              <p className="card-value" style={{ margin: 0, fontSize: 22 }}>
                {formatPriceEGP(stats.revenueLastMonth ?? 0)}
              </p>
            </div>
          </div>
          {(stats.revenueThisMonth > 0 || stats.revenueLastMonth > 0) && (
            <p
              className={`dashboard-revenue-change ${revenueChange >= 0 ? "positive" : "negative"}`}
            >
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange.toFixed(1)}% {t("dashboard.revenue_change")}
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>{t("dashboard.order_status_breakdown")}</h3>
            <span className="badge">{totalStatusOrders} {t("dashboard.total").toLowerCase()}</span>
          </div>
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
                    <span
                      className="dashboard-status-dot"
                      style={{
                        backgroundColor: STATUS_COLORS[s.status] ?? "#94a3b8",
                      }}
                    />
                    <span>
                      {t(`orders.${s.status.toLowerCase()}`, s.status)}
                    </span>
                    <span className="badge" style={{ marginInlineStart: 4 }}>
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </div>
      </div>

      {/* Orders per day (last 30) – Recharts */}
      <div className="dashboard-charts-row">
        <div className="card card-chart dashboard-orders-chart">
          <div className="card-header">
            <h3>{t("dashboard.orders_per_day")}</h3>
          </div>
          {ordersChartData.length > 0 ? (
            <div className="dashboard-recharts-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={ordersChartData}
                  margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="ordersBarGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#4f46e5"
                        stopOpacity={0.85}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    dataKey="count"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                    formatter={(value: number | undefined) => [
                      value ?? 0,
                      t("dashboard.orders_tooltip"),
                    ]}
                    labelFormatter={(_, payload) =>
                      payload[0]?.payload?.date ?? ""
                    }
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    fill="url(#ordersBarGradient)"
                    maxBarSize={32}
                  >
                    {ordersChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.count > 0
                            ? "url(#ordersBarGradient)"
                            : "#f1f5f9"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p>{t("dashboard.no_data")}</p>
          )}
        </div>
        <div className="card card-chart">
          <div className="card-header">
            <h3>{t("dashboard.revenue_per_day")}</h3>
          </div>
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
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}
      >
        <div className="card">
          <div className="card-header">
            <h3>{t("dashboard.best_selling")}</h3>
            <Link to="/products" className="button small outline">{t("analytics.view_all_products")}</Link>
          </div>
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
                <span className="badge badge-success">
                  {b.totalQty} {t("dashboard.sold")}
                </span>
              </li>
            ))}
            {(!stats.bestSelling || stats.bestSelling.length === 0) && (
              <li>{t("dashboard.no_data")}</li>
            )}
          </ul>
        </div>

        {/* Attention Needed */}
        <div className="card">
          <div className="card-header">
            <h3>{t("dashboard.attention_needed")}</h3>
          </div>
          <ul className="dashboard-attention-list">
            {stats.pendingOrdersCount > 0 && (
              <li className="dashboard-attention-item">
                <span className="attention-icon attention-icon--warning">
                  <IconClock />
                </span>
                <span style={{ flex: 1 }}>
                  {t("dashboard.pending_need_confirmation", {
                    count: stats.pendingOrdersCount,
                  })}
                </span>
                <Link to="/orders">{t("common.view")}</Link>
              </li>
            )}
            {stats.lowStockCount > 0 && (
              <li className="dashboard-attention-item">
                <span className="attention-icon attention-icon--warning">
                  <IconAlertTriangle />
                </span>
                <span style={{ flex: 1 }}>
                  {t("dashboard.products_low_stock", {
                    count: stats.lowStockCount,
                  })}
                </span>
                <Link to="/inventory">{t("common.view")}</Link>
              </li>
            )}
            {stats.outOfStockCount > 0 && (
              <li className="dashboard-attention-item">
                <span className="attention-icon attention-icon--danger">
                  <IconAlertTriangle />
                </span>
                <span style={{ flex: 1 }}>
                  {t("dashboard.products_out_of_stock", {
                    count: stats.outOfStockCount,
                  })}
                </span>
                <Link to="/inventory">{t("common.view")}</Link>
              </li>
            )}
            {stats.pendingOrdersCount === 0 &&
              stats.lowStockCount === 0 &&
              stats.outOfStockCount === 0 && (
                <li className="dashboard-attention-item">
                  <span className="attention-icon attention-icon--success">
                    <IconCheckCircle />
                  </span>
                  <span style={{ color: "#64748b" }}>
                    {t("dashboard.all_good")}
                  </span>
                </li>
              )}
          </ul>
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <p className="analytics-tracking-desc">
              {t("analytics.tracking_desc")}
            </p>
            <Link to="/settings" className="button small secondary">
              {t("analytics.configure_ga")}
            </Link>
          </div>
        </div>
      </div>

      {/* GA4 ecommerce reports overview */}
      <div className="card ga4-reports-card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3>{t("analytics.ga4_reports_title")}</h3>
          <a
            href={GA4_REPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="button small primary"
          >
            {t("analytics.open_ga4")}
          </a>
        </div>
        <p className="ga4-reports-intro">{t("analytics.ga4_reports_intro")}</p>
        <ul className="ga4-reports-list">
          <li>
            <span className="ga4-reports-icon"><IconChartBar /></span>
            {t("analytics.ga4_report_monetization")}
          </li>
          <li>
            <span className="ga4-reports-icon"><IconChartBar /></span>
            {t("analytics.ga4_report_events")}
          </li>
          <li>
            <span className="ga4-reports-icon"><IconChartBar /></span>
            {t("analytics.ga4_report_explore")}
          </li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3>{t("dashboard.recent_orders")}</h3>
          <span className="badge">{recentOrders.length}</span>
        </div>
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
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <p>{t("dashboard.no_data")}</p>
                  </div>
                </td>
              </tr>
            )}
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
