import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import InventoryPage from "./InventoryPage";
import "../i18n";

const mockGetLowStock = vi.fn();
const mockGetOutOfStock = vi.fn();
const mockUpdateProductStock = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getLowStock: (...args: unknown[]) => mockGetLowStock(...args),
      getOutOfStock: (...args: unknown[]) => mockGetOutOfStock(...args),
      updateProductStock: (...args: unknown[]) => mockUpdateProductStock(...args),
      listCategories: vi.fn(),
      listProducts: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("InventoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLowStock.mockResolvedValue({
      data: { products: [], threshold: 5 },
    });
    mockGetOutOfStock.mockResolvedValue({
      data: { products: [] },
    });
  });

  it("renders and loads low stock and out of stock data", async () => {
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetLowStock).toHaveBeenCalled();
    });
    expect(mockGetOutOfStock).toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: /inventory/i })).toBeInTheDocument();
  });

  it("displays low stock products when returned", async () => {
    mockGetLowStock.mockResolvedValue({
      data: {
        products: [
          {
            _id: "p1",
            name: { en: "Low Stock Product", ar: "منتج" },
            stock: 2,
            images: [],
          },
        ],
        threshold: 5,
      },
    });
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Low Stock Product")).toBeInTheDocument();
    });
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("displays out of stock products when returned", async () => {
    mockGetOutOfStock.mockResolvedValue({
      data: {
        products: [
          {
            _id: "p2",
            name: { en: "Out Of Stock Product", ar: "منتج" },
            stock: 0,
            images: [],
          },
        ],
      },
    });
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Out Of Stock Product")).toBeInTheDocument();
    });
  });

  it("displays error when load fails", async () => {
    mockGetLowStock.mockRejectedValue(new Error("Failed to load inventory"));
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load inventory/i)).toBeInTheDocument();
    });
  });

  it("calls updateProductStock when clicking update on low stock product", async () => {
    const user = userEvent.setup();
    mockGetLowStock.mockResolvedValue({
      data: {
        products: [
          {
            _id: "p1",
            name: { en: "Low Stock Product", ar: "منتج" },
            stock: 2,
            images: [],
          },
        ],
        threshold: 5,
      },
    });
    mockUpdateProductStock.mockResolvedValue({});
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Low Stock Product")).toBeInTheDocument());
    const qtyInput = screen.getByPlaceholderText(/new qty|quantity/i);
    await user.clear(qtyInput);
    await user.type(qtyInput, "10");
    const actionsBtn = screen.getAllByRole("button", { name: /actions/i })[0];
    await user.click(actionsBtn);
    const updateBtn = screen.getByRole("menuitem", { name: /update/i });
    await user.click(updateBtn);
    await waitFor(() => {
      expect(mockUpdateProductStock).toHaveBeenCalledWith("p1", 10);
    });
  });

  it("shows empty state when no low stock products", async () => {
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetLowStock).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /low stock/i })).toBeInTheDocument();
    expect(screen.getAllByText(/none/i).length).toBeGreaterThanOrEqual(1);
  });
});
