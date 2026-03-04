import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ShippingMethodsPage from "./ShippingMethodsPage";
import "../i18n";

const mockListShippingMethods = vi.fn();
const mockListCities = vi.fn();
const mockCreateShippingMethod = vi.fn();
const mockUpdateShippingMethod = vi.fn();
const mockToggleShippingMethod = vi.fn();
const mockDeleteShippingMethod = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listShippingMethods: (...args: unknown[]) => mockListShippingMethods(...args),
      listCities: (...args: unknown[]) => mockListCities(...args),
      createShippingMethod: (...args: unknown[]) => mockCreateShippingMethod(...args),
      updateShippingMethod: (...args: unknown[]) => mockUpdateShippingMethod(...args),
      deleteShippingMethod: (...args: unknown[]) => mockDeleteShippingMethod(...args),
      toggleShippingMethod: (...args: unknown[]) => mockToggleShippingMethod(...args),
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

describe("ShippingMethodsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListShippingMethods.mockResolvedValue({ shippingMethods: [] });
    mockListCities.mockResolvedValue({ data: { cities: [] } });
  });

  it("renders and loads shipping methods", async () => {
    render(
      <MemoryRouter>
        <ShippingMethodsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListShippingMethods).toHaveBeenCalledWith(true);
    });
    expect(mockListCities).toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: /shipping/i })).toBeInTheDocument();
  });

  it("displays shipping methods when data is returned", async () => {
    mockListShippingMethods.mockResolvedValue({
      shippingMethods: [
        {
          _id: "sm1",
          name: { en: "Standard Delivery", ar: "توصيل عادي" },
          description: { en: "3-5 days", ar: "" },
          estimatedDays: { min: 3, max: 5 },
          price: 50,
          enabled: true,
          order: 0,
        },
      ],
    });
    render(
      <MemoryRouter>
        <ShippingMethodsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Standard Delivery")).toBeInTheDocument();
    });
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("displays error when load fails", async () => {
    mockListShippingMethods.mockRejectedValue(new Error("Failed to load"));
    render(
      <MemoryRouter>
        <ShippingMethodsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it("shows Add shipping method button when user has permission", async () => {
    render(
      <MemoryRouter>
        <ShippingMethodsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListShippingMethods).toHaveBeenCalled();
    });
    const addBtn = screen.getByRole("button", { name: /add|method/i });
    expect(addBtn).toBeInTheDocument();
  });

  it("opens add modal and creates shipping method on submit", async () => {
    const user = userEvent.setup();
    mockCreateShippingMethod.mockResolvedValue({});
    render(
      <MemoryRouter>
        <ShippingMethodsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListShippingMethods).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /add.*method/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /new.*method/i })).toBeInTheDocument());
    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "Express");
    await user.type(textboxes[1], "إكسبرس");
    await user.type(textboxes[2], "2-3 days");
    await user.type(textboxes[3], "2-3 أيام");
    const spinbuttons = screen.getAllByRole("spinbutton");
    await user.clear(spinbuttons[0]);
    await user.type(spinbuttons[0], "2");
    await user.clear(spinbuttons[1]);
    await user.type(spinbuttons[1], "3");
    await user.clear(spinbuttons[2]);
    await user.type(spinbuttons[2], "75");
    await user.click(screen.getByRole("button", { name: /create|save/i }));
    await waitFor(
      () => {
        expect(mockCreateShippingMethod).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );
  }, 10000);

  it("opens edit modal and updates shipping method on submit", async () => {
    const user = userEvent.setup();
    mockListShippingMethods.mockResolvedValue({
      shippingMethods: [{
        _id: "sm1",
        name: { en: "Standard", ar: "عادي" },
        description: { en: "3-5 days", ar: "٣-٥ أيام" },
        estimatedDays: { min: 3, max: 5 },
        price: 50,
        enabled: true,
        order: 0,
      }],
    });
    mockUpdateShippingMethod.mockResolvedValue({});
    render(
      <MemoryRouter>
        <ShippingMethodsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Standard")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /edit.*method/i })).toBeInTheDocument());
    const priceInput = screen.getAllByRole("spinbutton")[2];
    await user.clear(priceInput);
    await user.type(priceInput, "60");
    await user.click(screen.getByRole("button", { name: /update|save/i }));
    await waitFor(() => expect(mockUpdateShippingMethod).toHaveBeenCalledWith("sm1", expect.any(Object)));
  });

  it("calls toggleShippingMethod when enable/disable clicked", async () => {
    const user = userEvent.setup();
    mockListShippingMethods.mockResolvedValue({
      shippingMethods: [{
        _id: "sm1",
        name: { en: "Standard", ar: "" },
        description: { en: "", ar: "" },
        estimatedDays: { min: 3, max: 5 },
        price: 50,
        enabled: true,
        order: 0,
      }],
    });
    mockToggleShippingMethod.mockResolvedValue({});
    render(
      <MemoryRouter>
        <ShippingMethodsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Standard")).toBeInTheDocument());
    const actionsButtons = screen.getAllByRole("button", { name: /actions/i });
    await user.click(actionsButtons[0]);
    await user.click(screen.getByRole("menuitem", { name: /disable/i }));
    await waitFor(() => expect(mockToggleShippingMethod).toHaveBeenCalledWith("sm1"));
  });
});
