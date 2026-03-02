import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CustomersPage from "./CustomersPage";
import "../i18n";

const mockListCustomers = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listCustomers: (...args: unknown[]) => mockListCustomers(...args),
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

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCustomers.mockResolvedValue({ data: { customers: [] } });
  });

  it("renders and loads customers", async () => {
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListCustomers).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /customers/i })).toBeInTheDocument();
  });

  it("displays customer list when data is returned", async () => {
    mockListCustomers.mockResolvedValue({
      data: {
        customers: [
          {
            id: "c1",
            name: "John Doe",
            email: "john@example.com",
            role: "USER",
            createdAt: "2024-01-15T00:00:00Z",
          },
        ],
      },
    });
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("USER")).toBeInTheDocument();
  });

  it("displays error when load fails", async () => {
    mockListCustomers.mockRejectedValue(new Error("Network error"));
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it("has actions dropdown for each customer", async () => {
    mockListCustomers.mockResolvedValue({
      data: {
        customers: [
          {
            id: "c1",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "USER",
            createdAt: "2024-02-01",
          },
        ],
      },
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
    const actionButtons = screen.getAllByRole("button", { name: /actions/i });
    expect(actionButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(actionButtons[0]);
    const viewLink = screen.getByRole("menuitem", { name: /view/i });
    expect(viewLink).toHaveAttribute("href", "/customers/c1");
  });
});
