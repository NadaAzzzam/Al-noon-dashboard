import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ReportsPage from "./ReportsPage";
import "../i18n";

const mockGetReports = vi.fn();
const mockListCategories = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getReports: (...args: unknown[]) => mockGetReports(...args),
      listCategories: (...args: unknown[]) => mockListCategories(...args),
      listProducts: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetReports.mockResolvedValue({
      data: {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalDeliveryFees: 0,
        revenueOverTime: [],
        ordersOverTime: [],
        revenueByPaymentMethod: [],
        revenueByCategory: [],
      },
    });
    mockListCategories.mockResolvedValue({ data: { categories: [] } });
  });

  it("renders and loads reports", async () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });
    expect(mockListCategories).toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: /reports/i })).toBeInTheDocument();
  });

  it("shows Sales tab content by default", async () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetReports).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
    });
  });

  it("switches to Orders tab and fetches orders report", async () => {
    const user = userEvent.setup();
    mockGetReports
      .mockResolvedValueOnce({
        data: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalDeliveryFees: 0 },
      })
      .mockResolvedValueOnce({
        data: {
          totalOrders: 10,
          cancellationRate: 0,
          avgProcessingDays: 2,
          statusBreakdown: [],
          ordersByPaymentMethod: [],
          topOrders: [],
        },
      });
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetReports).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /orders/i }));
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalledWith(
        expect.objectContaining({ tab: "orders" }),
      );
    });
  });

  it("switches to Products tab and fetches products report", async () => {
    const user = userEvent.setup();
    mockGetReports
      .mockResolvedValueOnce({
        data: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalDeliveryFees: 0 },
      })
      .mockResolvedValueOnce({
        data: {
          bestSelling: [],
          worstSelling: [],
          productsByCategory: [],
          lowStockItems: [],
          topRated: [],
        },
      });
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetReports).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /products/i }));
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalledWith(
        expect.objectContaining({ tab: "products" }),
      );
    });
  });

  it("switches to Customers tab and fetches customers report", async () => {
    const user = userEvent.setup();
    mockGetReports
      .mockResolvedValueOnce({
        data: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalDeliveryFees: 0 },
      })
      .mockResolvedValueOnce({
        data: {
          topCustomers: [],
          newCustomers: 0,
          returningRate: 0,
        },
      });
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetReports).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /customers/i }));
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalledWith(
        expect.objectContaining({ tab: "customers" }),
      );
    });
  });

  it("displays error when load fails", async () => {
    mockGetReports.mockRejectedValue(new Error("Failed to load reports"));
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load|error/i)).toBeInTheDocument();
    });
  });
});
