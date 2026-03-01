import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OrdersPage from "./OrdersPage";
import "../i18n";
import { setCurrentUser } from "../services/api";

const mockListOrders = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listOrders: (...args: unknown[]) => mockListOrders(...args),
      updateOrderStatus: vi.fn(),
      getOrder: vi.fn(),
      confirmPayment: vi.fn(),
      attachPaymentProof: vi.fn(),
      cancelOrder: vi.fn(),
      listProducts: vi.fn(),
      getProduct: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: (perm: string) => perm === "orders.manage",
  };
});

describe("OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentUser({ id: "1", name: "Admin", email: "admin@test.com", role: "ADMIN", permissions: ["orders.manage"] });
    mockListOrders.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
  });

  it("renders title and filters", async () => {
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListOrders).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/orders/i);
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
  });

  it("calls listOrders with filters when filters change", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListOrders).toHaveBeenCalled();
    });
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "PENDING");
    await waitFor(() => {
      expect(mockListOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: "PENDING", page: 1 })
      );
    });
  });

  it("shows clear filters button when filters are applied", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListOrders).toHaveBeenCalled();
    });
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "PENDING");
    await waitFor(() => {
      expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
    });
  });
});
