import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CategoriesPage from "./CategoriesPage";
import "../i18n";

const mockListCategories = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockSetCategoryStatus = vi.fn();
const mockDeleteCategory = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listCategories: (...args: unknown[]) => mockListCategories(...args),
      createCategory: (...args: unknown[]) => mockCreateCategory(...args),
      updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
      setCategoryStatus: (...args: unknown[]) => mockSetCategoryStatus(...args),
      deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
      listProducts: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCategories.mockResolvedValue({ data: { categories: [] } });
    mockCreateCategory.mockResolvedValue({});
  });

  it("renders and loads categories", async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListCategories).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /categories/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty category form", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListCategories).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /add category/i }));
    await waitFor(() => expect(screen.getByText("New category")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(screen.getByText("Name (EN) is required")).toBeInTheDocument();
    });
    expect(mockCreateCategory).not.toHaveBeenCalled();
  });

  it("displays categories when data returned", async () => {
    mockListCategories.mockResolvedValue({
      data: {
        categories: [
          { _id: "c1", name: { en: "Abayas", ar: "عباءات" }, status: "visible" },
        ],
      },
    });
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListCategories).toHaveBeenCalled());
    expect(screen.getByText("Abayas")).toBeInTheDocument();
  });

  it("creates category when form valid", async () => {
    const user = userEvent.setup();
    mockListCategories.mockResolvedValue({ data: { categories: [] } });
    mockCreateCategory.mockResolvedValue({});
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListCategories).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /add category/i }));
    await waitFor(() => expect(screen.getByText("New category")).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/name.*english/i), "Dresses");
    await user.type(screen.getByPlaceholderText(/name.*arabic/i), "فساتين");
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => expect(mockCreateCategory).toHaveBeenCalled());
  });

  it("calls setCategoryStatus when hide clicked", async () => {
    mockListCategories.mockResolvedValue({
      data: {
        categories: [
          { _id: "c1", name: { en: "Abayas", ar: "عباءات" }, status: "visible" },
        ],
      },
    });
    mockSetCategoryStatus.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Abayas")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /hide/i }));
    await waitFor(() => expect(mockSetCategoryStatus).toHaveBeenCalledWith("c1", "hidden"));
  });

  it("calls updateCategory when edit and save", async () => {
    mockListCategories
      .mockResolvedValueOnce({
        data: {
          categories: [
            { _id: "c1", name: { en: "Abayas", ar: "عباءات" }, status: "visible" },
          ],
        },
      })
      .mockResolvedValue({ data: { categories: [] } });
    mockUpdateCategory.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Abayas")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));
    await waitFor(() => expect(screen.getByDisplayValue("Abayas")).toBeInTheDocument());
    const titleInput = screen.getByDisplayValue("Abayas");
    await user.clear(titleInput);
    await user.type(titleInput, "Abaya Collection");
    await user.click(screen.getByRole("button", { name: /update/i }));
    await waitFor(() => expect(mockUpdateCategory).toHaveBeenCalledWith("c1", expect.objectContaining({ nameEn: "Abaya Collection" })));
  });
});
