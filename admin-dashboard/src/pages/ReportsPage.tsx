import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  api,
  ApiError,
  type ReportsTab,
  type SalesReportData,
  type OrdersReportData,
  type ProductsReportData,
  type CustomersReportData,
  type LocalizedString,
  type Category,
  getProductImageUrl,
} from "../services/api";
import { formatPriceEGP } from "../utils/format";
import { useLocalized } from "../utils/localized";
import "../styles/reports.css";

/* ───── Constants ───── */

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  SHIPPED: "#6366f1",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

const TABS: ReportsTab[] = ["sales", "orders", "products", "customers"];

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

/* ───── Sales Tab ───── */

const SalesReport = ({ data, localized }: { data: SalesReportData; localized: (s: LocalizedString) => string }) => {
  const { t } = useTranslation();

  const revenueChartData = (data.revenueOverTime ?? []).map((d) => ({
    date: d._id.length >= 10 ? d._id.slice(5, 10) : d._id,
    revenue: d.revenue,
  }));
  const ordersChartData = (data.ordersOverTime ?? []).map((d) => ({
    date: d._id.length >= 10 ? d._id.slice(5, 10) : d._id,
    count: d.count,
  }));
  const paymentData = (data.revenueByPaymentMethod ?? []).map((d) => ({
    name: d._id,
    value: d.revenue,
    count: d.count,
  }));
  const categoryData = (data.revenueByCategory ?? []).map((d) => ({
    name: d.categoryName ? localized(d.categoryName) : t("reports.unknown"),
    revenue: d.revenue,
  }));

  return (
    <div>
      <div className="reports-kpi-grid">
        <div className="reports-kpi-card reports-kpi--green">
          <h4>{t("reports.total_revenue")}</h4>
          <p className="reports-kpi-value">{formatPriceEGP(data.totalRevenue ?? 0)}</p>
        </div>
        <div className="reports-kpi-card reports-kpi--blue">
          <h4>{t("reports.total_orders")}</h4>
          <p className="reports-kpi-value">{data.totalOrders ?? 0}</p>
        </div>
        <div className="reports-kpi-card reports-kpi--purple">
          <h4>{t("reports.avg_order_value")}</h4>
          <p className="reports-kpi-value">{formatPriceEGP(data.averageOrderValue ?? 0)}</p>
        </div>
        <div className="reports-kpi-card reports-kpi--amber">
          <h4>{t("reports.delivery_fees_collected")}</h4>
          <p className="reports-kpi-value">{formatPriceEGP(data.totalDeliveryFees ?? 0)}</p>
        </div>
      </div>

      <div className="reports-charts-row">
        <div className="card reports-chart-card">
          <h3>{t("reports.revenue_over_time")}</h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(value: number | undefined) => formatPriceEGP(value ?? 0)} />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
        <div className="card reports-chart-card">
          <h3>{t("reports.orders_over_time")}</h3>
          {ordersChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
      </div>

      <div className="reports-charts-row">
        <div className="card reports-chart-card">
          <h3>{t("reports.revenue_by_payment")}</h3>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => formatPriceEGP(value ?? 0)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
        <div className="card reports-chart-card">
          <h3>{t("reports.revenue_by_category")}</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={100} />
                <Tooltip formatter={(value: number | undefined) => formatPriceEGP(value ?? 0)} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ───── Orders Tab ───── */

const OrdersReport = ({
  data,
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
}: {
  data: OrdersReportData;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  paymentFilter: string;
  setPaymentFilter: (v: string) => void;
}) => {
  const { t } = useTranslation();

  const statusData = (data.statusBreakdown ?? []).map((s) => ({
    name: t(`orders.${s.status.toLowerCase()}`, s.status),
    value: s.count,
    status: s.status,
  }));
  const paymentData = (data.ordersByPaymentMethod ?? []).map((p) => ({
    name: p._id,
    count: p.count,
    revenue: p.revenue,
  }));

  return (
    <div>
      <div className="reports-tab-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t("orders.all_statuses")}</option>
          {["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{t(`orders.${s.toLowerCase()}`)}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="">{t("orders.all_payments")}</option>
          <option value="COD">{t("settings.cod")}</option>
          <option value="INSTAPAY">{t("settings.instapay")}</option>
        </select>
      </div>

      <div className="reports-kpi-grid">
        <div className="reports-kpi-card reports-kpi--blue">
          <h4>{t("reports.total_orders")}</h4>
          <p className="reports-kpi-value">{data.totalOrders ?? 0}</p>
        </div>
        <div className="reports-kpi-card reports-kpi--red">
          <h4>{t("reports.cancellation_rate")}</h4>
          <p className="reports-kpi-value">{(data.cancellationRate ?? 0).toFixed(1)}%</p>
        </div>
        <div className="reports-kpi-card reports-kpi--purple">
          <h4>{t("reports.avg_processing_days")}</h4>
          <p className="reports-kpi-value">{(data.avgProcessingDays ?? 0).toFixed(1)} {t("reports.days")}</p>
        </div>
      </div>

      <div className="reports-charts-row">
        <div className="card reports-chart-card">
          <h3>{t("reports.order_status_breakdown")}</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
        <div className="card reports-chart-card">
          <h3>{t("reports.orders_by_payment")}</h3>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t("reports.top_orders")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("dashboard.order")}</th>
              <th>{t("dashboard.customer")}</th>
              <th>{t("dashboard.status")}</th>
              <th>{t("orders.payment")}</th>
              <th>{t("dashboard.total")}</th>
              <th>{t("orders.date")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.topOrders ?? []).map((o) => (
              <tr key={o._id}>
                <td><Link to={`/orders/${o._id}`}>{o._id.slice(-8)}</Link></td>
                <td>{o.user?.name ?? "—"}</td>
                <td><span className={`badge badge-${o.status.toLowerCase()}`}>{t(`orders.${o.status.toLowerCase()}`, o.status)}</span></td>
                <td>{o.paymentMethod ?? "—"}</td>
                <td>{formatPriceEGP(o.total)}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!data.topOrders || data.topOrders.length === 0) && (
              <tr><td colSpan={6} className="reports-no-data">{t("reports.no_data")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ───── Products Tab ───── */

const ProductsReport = ({
  data,
  localized,
  categoryFilter,
  setCategoryFilter,
  categories,
}: {
  data: ProductsReportData;
  localized: (s: LocalizedString) => string;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: Category[];
}) => {
  const { t } = useTranslation();

  const categoryChartData = (data.productsByCategory ?? []).map((c) => ({
    name: c.categoryName ? localized(c.categoryName) : t("reports.unknown"),
    count: c.count,
  }));

  return (
    <div>
      <div className="reports-tab-filters">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">{t("products.all_categories")}</option>
          {(Array.isArray(categories) ? categories : []).map((c) => (
            <option key={c._id} value={c._id}>{localized(c.name)}</option>
          ))}
        </select>
      </div>

      <div className="reports-charts-row">
        <div className="card reports-chart-card">
          <h3>{t("reports.products_by_category")}</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
      </div>

      {/* Best Selling */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t("reports.best_selling")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("products.name")}</th>
              <th>{t("reports.qty_sold")}</th>
              <th>{t("reports.revenue")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.bestSelling ?? []).map((p) => (
              <tr key={p._id}>
                <td className="reports-product-cell">
                  {p.image && <img src={getProductImageUrl(p.image)} alt="" className="reports-product-thumb" />}
                  {localized(p.name)}
                </td>
                <td>{p.totalQty}</td>
                <td>{formatPriceEGP(p.totalRevenue)}</td>
              </tr>
            ))}
            {(!data.bestSelling || data.bestSelling.length === 0) && (
              <tr><td colSpan={3} className="reports-no-data">{t("reports.no_data")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Worst Selling */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t("reports.worst_selling")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("products.name")}</th>
              <th>{t("reports.qty_sold")}</th>
              <th>{t("reports.revenue")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.worstSelling ?? []).map((p) => (
              <tr key={p._id}>
                <td className="reports-product-cell">
                  {p.image && <img src={getProductImageUrl(p.image)} alt="" className="reports-product-thumb" />}
                  {localized(p.name)}
                </td>
                <td>{p.totalQty}</td>
                <td>{formatPriceEGP(p.totalRevenue)}</td>
              </tr>
            ))}
            {(!data.worstSelling || data.worstSelling.length === 0) && (
              <tr><td colSpan={3} className="reports-no-data">{t("reports.no_data")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Low Stock */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t("reports.low_stock_alerts")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("products.name")}</th>
              <th>{t("products.stock")}</th>
              <th>{t("products.price")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.lowStockItems ?? []).map((p) => (
              <tr key={p._id}>
                <td className="reports-product-cell">
                  {p.image && <img src={getProductImageUrl(p.image)} alt="" className="reports-product-thumb" />}
                  {localized(p.name)}
                </td>
                <td><span className="badge badge-warning">{p.stock}</span></td>
                <td>{formatPriceEGP(p.price)}</td>
              </tr>
            ))}
            {(!data.lowStockItems || data.lowStockItems.length === 0) && (
              <tr><td colSpan={3} className="reports-no-data">{t("reports.no_low_stock")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top Rated */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t("reports.top_rated")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("products.name")}</th>
              <th>{t("products.rating")}</th>
              <th>{t("reports.reviews")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.topRated ?? []).map((p) => (
              <tr key={p._id}>
                <td className="reports-product-cell">
                  {p.image && <img src={getProductImageUrl(p.image)} alt="" className="reports-product-thumb" />}
                  {localized(p.name)}
                </td>
                <td><span className="badge badge-success">{p.avgRating} / 5</span></td>
                <td>{p.ratingCount}</td>
              </tr>
            ))}
            {(!data.topRated || data.topRated.length === 0) && (
              <tr><td colSpan={3} className="reports-no-data">{t("reports.no_data")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ───── Customers Tab ───── */

const CustomersReport = ({ data }: { data: CustomersReportData }) => {
  const { t } = useTranslation();

  const newCustChartData = (data.newCustomersOverTime ?? []).map((d) => ({
    date: d._id.length >= 10 ? d._id.slice(5, 10) : d._id,
    count: d.count,
  }));
  const freqData = (data.orderFrequency ?? []).map((f) => ({
    orders: `${f.orders}x`,
    customers: f.customers,
  }));

  return (
    <div>
      <div className="reports-kpi-grid">
        <div className="reports-kpi-card reports-kpi--green">
          <h4>{t("reports.new_customers")}</h4>
          <p className="reports-kpi-value">{data.newCustomersCount ?? 0}</p>
        </div>
        <div className="reports-kpi-card reports-kpi--blue">
          <h4>{t("reports.repeat_customers")}</h4>
          <p className="reports-kpi-value">{data.repeatCustomers ?? 0}</p>
        </div>
        <div className="reports-kpi-card reports-kpi--purple">
          <h4>{t("reports.avg_lifetime_value")}</h4>
          <p className="reports-kpi-value">{formatPriceEGP(data.avgLifetimeValue ?? 0)}</p>
        </div>
      </div>

      <div className="reports-charts-row">
        <div className="card reports-chart-card">
          <h3>{t("reports.new_customers_over_time")}</h3>
          {newCustChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={newCustChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
        <div className="card reports-chart-card">
          <h3>{t("reports.order_frequency")}</h3>
          {freqData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={freqData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="orders" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip />
                <Bar dataKey="customers" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="reports-no-data">{t("reports.no_data")}</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>{t("reports.top_customers")}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t("dashboard.customer")}</th>
              <th>{t("reports.email")}</th>
              <th>{t("reports.total_spent")}</th>
              <th>{t("reports.order_count")}</th>
            </tr>
          </thead>
          <tbody>
            {(data.topCustomers ?? []).map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{formatPriceEGP(c.totalSpent)}</td>
                <td>{c.orderCount}</td>
              </tr>
            ))}
            {(!data.topCustomers || data.topCustomers.length === 0) && (
              <tr><td colSpan={4} className="reports-no-data">{t("reports.no_data")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ───── Main Page ───── */

const ReportsPage = () => {
  const { t } = useTranslation();
  const localized = useLocalized();

  const [activeTab, setActiveTab] = useState<ReportsTab>("sales");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab-specific filters
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Report data per tab
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersReportData | null>(null);
  const [productsData, setProductsData] = useState<ProductsReportData | null>(null);
  const [customersData, setCustomersData] = useState<CustomersReportData | null>(null);

  // Load categories once for product tab filter (API returns { data: { categories } })
  useEffect(() => {
    api.listCategories()
      .then((res: unknown) => {
        const d = res as { data?: { categories?: Category[] } };
        const list = Array.isArray(d.data?.categories) ? d.data.categories : [];
        setCategories(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getReports({
          tab: activeTab,
          startDate,
          endDate,
          status: activeTab === "orders" ? statusFilter : undefined,
          paymentMethod: activeTab === "orders" ? paymentFilter : undefined,
          category: activeTab === "products" ? categoryFilter : undefined,
        });
        const body = res as { data?: unknown };
        const data = body.data ?? res;
        switch (activeTab) {
          case "sales":
            setSalesData(data as SalesReportData);
            break;
          case "orders":
            setOrdersData(data as OrdersReportData);
            break;
          case "products":
            setProductsData(data as ProductsReportData);
            break;
          case "customers":
            setCustomersData(data as CustomersReportData);
            break;
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : t("reports.failed_load"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab, startDate, endDate, statusFilter, paymentFilter, categoryFilter, t]);

  return (
    <div>
      <div className="header">
        <div>
          <h1>{t("reports.title")}</h1>
          <p>{t("reports.subtitle")}</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="card reports-date-card">
        <div className="reports-date-row">
          <label>
            {t("reports.start_date")}
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate} />
          </label>
          <label>
            {t("reports.end_date")}
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`reports-tab ${activeTab === tab ? "reports-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`reports.tab_${tab}`)}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="reports-loading">
          <p>{t("common.loading")}</p>
        </div>
      ) : (
        <>
          {activeTab === "sales" && salesData && <SalesReport data={salesData} localized={localized} />}
          {activeTab === "orders" && ordersData && (
            <OrdersReport
              data={ordersData}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              paymentFilter={paymentFilter}
              setPaymentFilter={setPaymentFilter}
            />
          )}
          {activeTab === "products" && productsData && (
            <ProductsReport
              data={productsData}
              localized={localized}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              categories={categories}
            />
          )}
          {activeTab === "customers" && customersData && <CustomersReport data={customersData} />}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
