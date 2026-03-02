import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductsPage from "./ProductsPage";
import "../i18n";

const mockListProducts = vi.fn();
const mockListCategories = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listProducts: (...args: unknown[]) => mockListProducts(...args),
      listCategories: (...args: unknown[]) => mockListCategories(...args),
      getProduct: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListProducts.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    mockListCategories.mockResolvedValue({ data: { categories: [] } });
  });

  it("calls clearFilters when clear filters clicked", async () => {
    const user = userEvent.setup();
    mockListProducts.mockResolvedValue({
      data: [{ _id: "p1", name: { en: "Product 1" }, price: 10, stock: 5, status: "ACTIVE" }],
      pagination: { total: 1 },
    });
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListProducts).toHaveBeenCalled());
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "ACTIVE");
    await waitFor(() => expect(mockListProducts).toHaveBeenCalledTimes(2));
    const clearBtn = screen.getByRole("button", { name: /clear/i });
    await user.click(clearBtn);
    await waitFor(() => {
      expect(mockListProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: undefined }),
      );
    });
  });

  it("renders and loads products", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListProducts).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/products/i);
  });

  it("displays product list when data returned", async () => {
    mockListProducts.mockResolvedValue({
      data: [
        {
          _id: "p1",
          name: { en: "Test Product", ar: "منتج" },
          price: 99,
          stock: 10,
          status: "ACTIVE",
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListProducts).toHaveBeenCalled());
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/99.*EGP|99\.00/)).toBeInTheDocument();
  });

  it("displays empty state when no products", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListProducts).toHaveBeenCalled());
    expect(screen.getByText(/no products found|no_products/i)).toBeInTheDocument();
  });
});
