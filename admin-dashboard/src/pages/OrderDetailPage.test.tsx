import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OrderDetailPage from "./OrderDetailPage";
import "../i18n";
import { setCurrentUser } from "../services/api";

const mockGetOrder = vi.fn();
const mockConfirmPayment = vi.fn();
const mockUpdateOrderStatus = vi.fn();
const mockCancelOrder = vi.fn();
const mockAttachPaymentProof = vi.fn();
const mockConfirmRemove = vi.fn();

vi.mock("../utils/confirmToast", () => ({
  confirmRemove: (...args: unknown[]) => mockConfirmRemove(...args),
}));

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getOrder: (...args: unknown[]) => mockGetOrder(...args),
      confirmPayment: (...args: unknown[]) => mockConfirmPayment(...args),
      updateOrderStatus: (...args: unknown[]) => mockUpdateOrderStatus(...args),
      cancelOrder: (...args: unknown[]) => mockCancelOrder(...args),
      attachPaymentProof: (...args: unknown[]) => mockAttachPaymentProof(...args),
      listOrders: vi.fn(),
      listProducts: vi.fn(),
      getProduct: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: (perm: string) => perm === "orders.manage",
  };
});

const instaPayUnpaidOrder = {
  _id: "69a267320d47d126e790b2ac",
  user: { name: "Test User", email: "test@example.com" },
  items: [{ product: { _id: "p1", name: { en: "Product 1" } }, quantity: 2, price: 100 }],
  total: 250,
  deliveryFee: 50,
  status: "PENDING",
  paymentMethod: "INSTAPAY",
  payment: { method: "INSTAPAY", status: "UNPAID", instaPayProofUrl: "/proof.jpg" },
  shippingAddress: "123 St, Cairo",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const renderOrderDetail = (orderId = "69a267320d47d126e790b2ac") => {
  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("OrderDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmRemove.mockResolvedValue(true);
    setCurrentUser({ id: "1", name: "Admin", email: "admin@test.com", role: "ADMIN", permissions: ["orders.manage"] });
    mockGetOrder.mockResolvedValue({ data: { order: instaPayUnpaidOrder } });
  });

  it("renders order details when loaded", async () => {
    renderOrderDetail();
    await waitFor(() => {
      expect(screen.getByText(/790b2ac/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  it("shows approve and reject buttons for InstaPay UNPAID orders", async () => {
    renderOrderDetail();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /approve payment/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("calls confirmPayment with true when approve is clicked", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValue(undefined);
    mockGetOrder
      .mockResolvedValueOnce({ data: { order: instaPayUnpaidOrder } })
      .mockResolvedValueOnce({ data: { order: { ...instaPayUnpaidOrder, payment: { ...instaPayUnpaidOrder.payment, status: "PAID" } } } });

    renderOrderDetail();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /approve payment/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /approve payment/i }));

    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalledWith("69a267320d47d126e790b2ac", true);
    });
  });

  it("calls confirmPayment with false when reject is clicked", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValue(undefined);
    mockGetOrder
      .mockResolvedValueOnce({ data: { order: instaPayUnpaidOrder } })
      .mockResolvedValueOnce({ data: { order: instaPayUnpaidOrder } });

    renderOrderDetail();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /reject/i }));

    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalledWith("69a267320d47d126e790b2ac", false);
    });
  });

  it("shows loading state initially", () => {
    mockGetOrder.mockImplementation(() => new Promise(() => {}));
    renderOrderDetail();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("calls updateOrderStatus when status changed", async () => {
    const user = userEvent.setup();
    mockUpdateOrderStatus.mockResolvedValue(undefined);
    mockGetOrder
      .mockResolvedValueOnce({ data: { order: instaPayUnpaidOrder } })
      .mockResolvedValue({ data: { order: { ...instaPayUnpaidOrder, status: "CONFIRMED" } } });
    renderOrderDetail();
    await waitFor(() => expect(screen.getByText(/Test User/)).toBeInTheDocument());
    const statusSelect = screen.getByDisplayValue("PENDING");
    await user.selectOptions(statusSelect, "CONFIRMED");
    await waitFor(() => expect(mockUpdateOrderStatus).toHaveBeenCalledWith("69a267320d47d126e790b2ac", "CONFIRMED"));
  });

  it("loads order from res.order when res.data is missing", async () => {
    mockGetOrder.mockResolvedValue({ order: { ...instaPayUnpaidOrder } });
    renderOrderDetail();
    await waitFor(() => expect(screen.getByText(/Test User/)).toBeInTheDocument());
  });

  it("shows error when load fails", async () => {
    mockGetOrder.mockRejectedValue(new Error("Not found"));
    renderOrderDetail();
    await waitFor(() => {
      expect(screen.getByText(/failed|error|not found/i)).toBeInTheDocument();
    });
  });

  it("calls cancelOrder when cancel clicked and confirmed", async () => {
    const user = userEvent.setup();
    mockCancelOrder.mockResolvedValue(undefined);
    mockGetOrder
      .mockResolvedValueOnce({ data: { order: instaPayUnpaidOrder } })
      .mockResolvedValue({ data: { order: { ...instaPayUnpaidOrder, status: "CANCELLED" } } });
    renderOrderDetail();
    await waitFor(() => expect(screen.getByText(/Test User/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /cancel order/i }));
    await waitFor(() => expect(mockCancelOrder).toHaveBeenCalledWith("69a267320d47d126e790b2ac"));
  });

  it("attaches proof when file selected and form submitted", async () => {
    const user = userEvent.setup();
    const { fireEvent } = await import("@testing-library/react");
    mockAttachPaymentProof.mockResolvedValue(undefined);
    mockGetOrder
      .mockResolvedValueOnce({ data: { order: instaPayUnpaidOrder } })
      .mockResolvedValue({
        data: {
          order: {
            ...instaPayUnpaidOrder,
            payment: { ...instaPayUnpaidOrder.payment, instaPayProofUrl: "/new-proof.jpg" },
          },
        },
      });
    renderOrderDetail();
    await waitFor(() => expect(screen.getByRole("button", { name: /attach.*proof/i })).toBeInTheDocument());
    const fileInput = document.getElementById("order-payment-proof") as HTMLInputElement;
    const file = new File(["proof"], "proof.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /attach.*proof|attach/i })).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: /attach.*proof/i }));
    await waitFor(() => expect(mockAttachPaymentProof).toHaveBeenCalledWith("69a267320d47d126e790b2ac", file));
  });
});
