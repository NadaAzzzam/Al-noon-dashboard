import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CitiesPage from "./CitiesPage";
import "../i18n";

const mockListCities = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listCities: (...args: unknown[]) => mockListCities(...args),
      createCity: vi.fn(),
      updateCity: vi.fn(),
      deleteCity: vi.fn(),
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

describe("CitiesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCities.mockResolvedValue({ data: { cities: [] } });
  });

  it("renders and loads cities", async () => {
    render(
      <MemoryRouter>
        <CitiesPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListCities).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /cities/i })).toBeInTheDocument();
  });
});
