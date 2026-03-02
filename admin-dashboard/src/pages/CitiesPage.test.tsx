import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CitiesPage from "./CitiesPage";
import "../i18n";

const mockListCities = vi.fn();
const mockCreateCity = vi.fn();
const mockUpdateCity = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listCities: (...args: unknown[]) => mockListCities(...args),
      createCity: (...args: unknown[]) => mockCreateCity(...args),
      updateCity: (...args: unknown[]) => mockUpdateCity(...args),
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

  it("displays cities when data returned", async () => {
    mockListCities.mockResolvedValue({
      data: {
        cities: [
          { _id: "c1", name: { en: "Cairo", ar: "القاهرة" }, deliveryFee: 50 },
        ],
      },
    });
    render(
      <MemoryRouter>
        <CitiesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Cairo")).toBeInTheDocument());
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("opens add modal and calls createCity on submit", async () => {
    const user = userEvent.setup();
    mockCreateCity.mockResolvedValue({});
    render(
      <MemoryRouter>
        <CitiesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListCities).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /add city/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /new city/i })).toBeInTheDocument());
    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "Alexandria");
    await user.type(textboxes[1], "الإسكندرية");
    const feeInput = screen.getByRole("spinbutton");
    await user.clear(feeInput);
    await user.type(feeInput, "30");
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(mockCreateCity).toHaveBeenCalledWith(
        expect.objectContaining({ nameEn: "Alexandria", deliveryFee: 30 }),
      );
    });
  });

  it("displays error when load fails", async () => {
    mockListCities.mockRejectedValue(new Error("Failed to load"));
    render(
      <MemoryRouter>
        <CitiesPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});
