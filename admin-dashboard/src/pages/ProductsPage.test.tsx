import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
});
