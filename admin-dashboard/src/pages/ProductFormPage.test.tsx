import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductFormPage from "./ProductFormPage";
import "../i18n";

const mockListCategories = vi.fn();
const mockGetProduct = vi.fn();
const mockCreateProduct = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listCategories: (...args: unknown[]) => mockListCategories(...args),
      getProduct: (...args: unknown[]) => mockGetProduct(...args),
      createProduct: (...args: unknown[]) => mockCreateProduct(...args),
      updateProduct: vi.fn(),
      uploadProductImages: vi.fn(),
      uploadProductVideos: vi.fn(),
      listProducts: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

function renderProductForm(route = "/products/new") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProductFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCategories.mockResolvedValue({ data: { categories: [] } });
  });

  it("renders new product form and loads categories", async () => {
    renderProductForm("/products/new");
    await waitFor(() => {
      expect(mockListCategories).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/new|product/i);
    expect(screen.getByRole("button", { name: /create|save/i })).toBeInTheDocument();
  });

  it("renders edit product form and loads product when id provided", async () => {
    mockGetProduct.mockResolvedValue({
      data: {
        product: {
          name: { en: "Test Product", ar: "منتج" },
          description: { en: "", ar: "" },
          price: 99,
          stock: 10,
          category: { _id: "cat1" },
          status: "ACTIVE",
          images: [],
          videos: [],
          sizes: [],
          colors: [],
          variants: [],
        },
      },
    });
    renderProductForm("/products/507f1f77bcf86cd799439011/edit");
    await waitFor(() => {
      expect(mockGetProduct).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/edit|product/i);
  });
});
