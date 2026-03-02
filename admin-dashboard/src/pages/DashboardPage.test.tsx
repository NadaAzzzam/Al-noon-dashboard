import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import "../i18n";

const mockGetDashboardStats = vi.fn();
const mockGetSettings = vi.fn();
const mockListOrders = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      listOrders: (...args: unknown[]) => mockListOrders(...args),
      listProducts: vi.fn(),
      getProduct: vi.fn(),
      getOrder: vi.fn(),
      getTopSellingProducts: vi.fn(),
    },
  };
});

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListOrders.mockResolvedValue({ data: [] });
    mockGetDashboardStats.mockResolvedValue({
      totalOrders: 10,
      revenue: 5000,
      ordersToday: 2,
      topProducts: [],
      ordersPerDay: [],
    });
    mockGetSettings.mockResolvedValue({ logo: null });
  });

  it("renders dashboard stats when loaded", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetDashboardStats).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("shows loading skeleton initially before data loads", () => {
    mockGetDashboardStats.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(document.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("displays revenue and order stats when loaded", async () => {
    mockGetDashboardStats.mockResolvedValue({
      totalOrders: 25,
      revenue: 15000,
      ordersToday: 3,
      topProducts: [],
      ordersPerDay: [],
      revenueThisMonth: 12000,
      revenueLastMonth: 10000,
      averageOrderValue: 500,
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(/15,?000|15000/)).toBeInTheDocument();
    });
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("shows error when dashboard load fails", async () => {
    mockGetDashboardStats.mockRejectedValue(new Error("Network error"));
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it("displays order status breakdown and revenue comparison when data present", async () => {
    const stats = {
      totalOrders: 50,
      revenue: 25000,
      ordersToday: 5,
      topProducts: [],
      ordersPerDay: [{ _id: "2024-01-15", count: 3, revenue: 500 }],
      revenueThisMonth: 20000,
      revenueLastMonth: 15000,
      averageOrderValue: 500,
      orderStatusBreakdown: [
        { status: "DELIVERED", count: 30 },
        { status: "PENDING", count: 10 },
        { status: "CONFIRMED", count: 5 },
      ],
      pendingOrdersCount: 10,
      totalCustomers: 100,
      totalProducts: 50,
      lowStockCount: 3,
      outOfStockCount: 1,
      bestSelling: [
        { productId: "p1", name: { en: "Product A", ar: "منتج أ" }, totalQty: 25, image: "" },
      ],
    };
    mockGetDashboardStats.mockResolvedValue(stats);
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText("Order status breakdown")).toBeInTheDocument();
    });
    expect(screen.getByText("Revenue comparison")).toBeInTheDocument();
  });

  it("displays recent orders when listOrders returns data", async () => {
    mockListOrders.mockResolvedValue({
      data: [
        {
          _id: "ord12345678",
          status: "PENDING",
          total: 150,
          user: { name: "John Doe" },
        },
      ],
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListOrders).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText(/recent.*order|recent_orders/i)).toBeInTheDocument();
  });

  it("displays attention needed when pending orders and low stock", async () => {
    mockGetDashboardStats.mockResolvedValue({
      totalOrders: 20,
      revenue: 10000,
      ordersToday: 2,
      topProducts: [],
      ordersPerDay: [],
      pendingOrdersCount: 5,
      totalCustomers: 50,
      totalProducts: 20,
      lowStockCount: 2,
      outOfStockCount: 1,
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(/attention needed|attention_needed/i)).toBeInTheDocument();
    });
  });

  it("displays all good when no pending orders or stock issues", async () => {
    mockGetDashboardStats.mockResolvedValue({
      totalOrders: 20,
      revenue: 10000,
      ordersToday: 2,
      topProducts: [],
      ordersPerDay: [],
      pendingOrdersCount: 0,
      totalCustomers: 50,
      totalProducts: 20,
      lowStockCount: 0,
      outOfStockCount: 0,
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(/all good|all_good/i)).toBeInTheDocument();
    });
  });
});
