import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductsPage from "./ProductsPage";
import "../i18n";

const mockListProducts = vi.fn();
const mockListCategories = vi.fn();
const mockSetProductStatus = vi.fn();
const mockDeleteProduct = vi.fn();

vi.mock("../utils/confirmToast", () => ({
  confirmRemove: vi.fn().mockResolvedValue(true),
}));

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listProducts: (...args: unknown[]) => mockListProducts(...args),
      listCategories: (...args: unknown[]) => mockListCategories(...args),
      setProductStatus: (...args: unknown[]) => mockSetProductStatus(...args),
      deleteProduct: (...args: unknown[]) => mockDeleteProduct(...args),
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

  it("calls setProductStatus when disable clicked", async () => {
    mockListProducts
      .mockResolvedValueOnce({
        data: [{ _id: "p1", name: { en: "Prod" }, price: 10, stock: 5, status: "ACTIVE" }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      })
      .mockResolvedValue({ data: [], pagination: { total: 0 } });
    mockSetProductStatus.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Prod")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /disable/i }));
    await waitFor(() => expect(mockSetProductStatus).toHaveBeenCalledWith("p1", "INACTIVE"));
  });

  it("calls deleteProduct when delete confirmed", async () => {
    mockListProducts
      .mockResolvedValueOnce({
        data: [{ _id: "p1", name: { en: "Prod" }, price: 10, stock: 5, status: "ACTIVE" }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      })
      .mockResolvedValue({ data: [], pagination: { total: 0 } });
    mockDeleteProduct.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Prod")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await waitFor(() => expect(mockDeleteProduct).toHaveBeenCalledWith("p1"));
  });

  it("calls setProductStatus with ACTIVE when enable clicked", async () => {
    mockListProducts
      .mockResolvedValueOnce({
        data: [{ _id: "p1", name: { en: "Prod" }, price: 10, stock: 5, status: "INACTIVE" }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      })
      .mockResolvedValue({ data: [], pagination: { total: 0 } });
    mockSetProductStatus.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Prod")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /enable|activate/i }));
    await waitFor(() => expect(mockSetProductStatus).toHaveBeenCalledWith("p1", "ACTIVE"));
  });

  it("shows error when setProductStatus fails", async () => {
    mockListProducts.mockResolvedValue({
      data: [{ _id: "p1", name: { en: "Prod" }, price: 10, stock: 5, status: "ACTIVE" }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    mockSetProductStatus.mockRejectedValue(new Error("Server error"));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Prod")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /disable/i }));
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it("shows error when load fails with ApiError", async () => {
    const { ApiError } = await import("../services/api");
    mockListProducts.mockRejectedValue(new ApiError(500, "Server unavailable"));
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Server unavailable|failed|error/i)).toBeInTheDocument();
    });
  });

  it("filters by category and search", async () => {
    mockListProducts.mockResolvedValue({
      data: [],
      pagination: { total: 0 },
      appliedFilters: {},
    });
    mockListCategories.mockResolvedValue({
      data: { categories: [{ _id: "c1", name: { en: "Electronics", ar: "" } }] },
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListProducts).toHaveBeenCalled());
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "phone");
    await waitFor(() => {
      expect(mockListProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "phone" }),
      );
    });
  });
});
