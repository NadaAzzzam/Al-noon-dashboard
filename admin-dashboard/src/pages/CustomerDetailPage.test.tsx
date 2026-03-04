import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CustomerDetailPage from "./CustomerDetailPage";
import "../i18n";

const mockGetCustomer = vi.fn();
const mockGetCustomerOrders = vi.fn();
const mockUpdateCustomerPassword = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getCustomer: (...args: unknown[]) => mockGetCustomer(...args),
      getCustomerOrders: (...args: unknown[]) => mockGetCustomerOrders(...args),
      updateCustomerPassword: (...args: unknown[]) => mockUpdateCustomerPassword(...args),
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

function renderCustomerDetail(customerId = "c1") {
  return render(
    <MemoryRouter initialEntries={[`/customers/${customerId}`]}>
      <Routes>
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCustomer.mockResolvedValue({
      data: {
        customer: {
          id: "c1",
          name: "John Doe",
          email: "john@example.com",
          role: "USER",
          createdAt: "2024-01-15T00:00:00Z",
        },
      },
    });
    mockGetCustomerOrders.mockResolvedValue({
      data: { orders: [] },
    });
  });

  it("renders and loads customer details", async () => {
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(mockGetCustomer).toHaveBeenCalledWith("c1");
    });
    expect(mockGetCustomerOrders).toHaveBeenCalledWith("c1");
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("displays customer orders when returned", async () => {
    mockGetCustomerOrders.mockResolvedValue({
      data: {
        orders: [
          {
            _id: "ord123",
            total: 250,
            status: "CONFIRMED",
            createdAt: "2024-02-01T12:00:00Z",
          },
        ],
      },
    });
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText(/250\.00 EGP/)).toBeInTheDocument();
  });

  it("displays no orders message when customer has no orders", async () => {
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("No orders")).toBeInTheDocument();
  });

  it("displays error when load fails", async () => {
    mockGetCustomer.mockRejectedValue(new Error("Customer not found"));
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText(/customer not found|failed to load/i)).toBeInTheDocument();
    });
  });

  it("has back to customers link", async () => {
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    const backLink = screen.getByRole("link", { name: /back|customers/i });
    expect(backLink).toHaveAttribute("href", "/customers");
  });

  it("opens change password modal when Change password is clicked", async () => {
    const user = userEvent.setup();
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    const changePasswordBtn = screen.getByTestId("customer-change-password-btn");
    expect(changePasswordBtn).toBeInTheDocument();
    await user.click(changePasswordBtn);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });
  });

  it("calls updateCustomerPassword and closes modal on success", async () => {
    const user = userEvent.setup();
    mockUpdateCustomerPassword.mockResolvedValue({ success: true, data: { updated: true } });
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("customer-change-password-btn"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    await user.type(screen.getByTestId("customer-new-password"), "newpass123");
    await user.type(screen.getByTestId("customer-confirm-password"), "newpass123");
    await user.click(screen.getByTestId("customer-password-submit"));
    await waitFor(() => {
      expect(mockUpdateCustomerPassword).toHaveBeenCalledWith("c1", {
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("customer-change-password-btn"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    await user.type(screen.getByTestId("customer-new-password"), "newpass123");
    await user.type(screen.getByTestId("customer-confirm-password"), "different");
    await user.click(screen.getByTestId("customer-password-submit"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(mockUpdateCustomerPassword).not.toHaveBeenCalled();
  });

  it("shows error when new password is shorter than 6 characters", async () => {
    const user = userEvent.setup();
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("customer-change-password-btn"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    await user.type(screen.getByTestId("customer-new-password"), "12345");
    await user.type(screen.getByTestId("customer-confirm-password"), "12345");
    await user.click(screen.getByTestId("customer-password-submit"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(mockUpdateCustomerPassword).not.toHaveBeenCalled();
  });

  it("shows API error in modal when updateCustomerPassword fails", async () => {
    const user = userEvent.setup();
    mockUpdateCustomerPassword.mockRejectedValue(new Error("Customer not found"));
    renderCustomerDetail("c1");
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("customer-change-password-btn"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    await user.type(screen.getByTestId("customer-new-password"), "newpass123");
    await user.type(screen.getByTestId("customer-confirm-password"), "newpass123");
    await user.click(screen.getByTestId("customer-password-submit"));
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/customer not found|change password failed|failed to update password/i);
    });
    expect(mockUpdateCustomerPassword).toHaveBeenCalledWith("c1", {
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
  });
});
