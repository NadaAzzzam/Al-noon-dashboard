import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductFormPage from "./ProductFormPage";
import "../i18n";

const mockListCategories = vi.fn();
const mockGetProduct = vi.fn();
const mockCreateProduct = vi.fn();
const mockUpdateProduct = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listCategories: (...args: unknown[]) => mockListCategories(...args),
      getProduct: (...args: unknown[]) => mockGetProduct(...args),
      createProduct: (...args: unknown[]) => mockCreateProduct(...args),
      updateProduct: (...args: unknown[]) => mockUpdateProduct(...args),
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

  it("shows validation errors when submitting product form with empty required fields", async () => {
    const user = userEvent.setup();
    mockListCategories.mockResolvedValue({
      data: [{ _id: "cat1", name: { en: "Cat1", ar: "تصنيف1" }, status: "visible" }],
    });
    renderProductForm("/products/new");
    await waitFor(() => expect(mockListCategories).toHaveBeenCalled());
    const submitBtn = screen.getByRole("button", { name: /create|save/i });
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText("Name (EN) is required")).toBeInTheDocument();
    });
    expect(mockCreateProduct).not.toHaveBeenCalled();
  });

  it("calls createProduct when submitting valid new product form", async () => {
    const user = userEvent.setup();
    mockListCategories.mockResolvedValue({
      data: { categories: [{ _id: "cat1", name: { en: "Cat1", ar: "تصنيف" }, status: "visible" }] },
    });
    mockCreateProduct.mockResolvedValue({});
    renderProductForm("/products/new");
    await waitFor(() => expect(mockListCategories).toHaveBeenCalled());
    const nameEnInput = screen.getByLabelText(/name.*en/i);
    const nameArInput = screen.getByLabelText(/name.*ar/i);
    const priceInput = screen.getByLabelText(/price/i);
    await user.type(nameEnInput, "Widget");
    await user.type(nameArInput, "ودجت");
    await user.clear(priceInput);
    await user.type(priceInput, "50");
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, "cat1");
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({ nameEn: "Widget", nameAr: "ودجت", price: 50, category: "cat1" }),
      );
    });
  });

  it("shows error when product load fails in edit mode", async () => {
    mockGetProduct.mockRejectedValue(new Error("Not found"));
    renderProductForm("/products/p1/edit");
    await waitFor(() => {
      expect(screen.getByText(/failed to load|error/i)).toBeInTheDocument();
    });
  });

  it("calls updateProduct when submitting edit form", async () => {
    const user = userEvent.setup();
    mockListCategories.mockResolvedValue({
      data: [{ _id: "cat1", name: { en: "Cat1", ar: "تصنيف1" }, status: "visible" }],
    });
    mockGetProduct.mockResolvedValue({
      data: {
        product: {
          _id: "p1",
          name: { en: "Test Product", ar: "منتج" },
          description: { en: "", ar: "" },
          price: 99,
          stock: 10,
          category: "cat1",
          status: "ACTIVE",
          images: [],
          videos: [],
          sizes: [],
          colors: [],
          variants: [],
        },
      },
    });
    mockUpdateProduct.mockResolvedValue({});
    renderProductForm("/products/p1/edit");
    await waitFor(() => expect(mockGetProduct).toHaveBeenCalled());
    const priceInput = screen.getByLabelText(/price/i);
    await user.clear(priceInput);
    await user.type(priceInput, "149");
    await user.click(screen.getByRole("button", { name: /save|update/i }));
    await waitFor(() => {
      expect(mockUpdateProduct).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ price: 149 }),
      );
    });
  });
});
