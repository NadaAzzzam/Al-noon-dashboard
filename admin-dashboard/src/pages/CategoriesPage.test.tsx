import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CategoriesPage from "./CategoriesPage";
import "../i18n";

const mockListCategories = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listCategories: (...args: unknown[]) => mockListCategories(...args),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      setCategoryStatus: vi.fn(),
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
});
