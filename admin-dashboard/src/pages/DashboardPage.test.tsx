import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import "../i18n";

const mockGetDashboardStats = vi.fn();
const mockGetSettings = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      listOrders: vi.fn(),
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
    mockGetDashboardStats.mockResolvedValue({
      ordersCount: 10,
      revenue: 5000,
      ordersToday: 2,
      topProducts: [],
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
    expect(screen.getByText(/orders|dashboard|total/i)).toBeInTheDocument();
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
});
