import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FeedbackPage from "./FeedbackPage";
import "../i18n";

const mockListFeedback = vi.fn();
const mockListProducts = vi.fn();
const mockCreateFeedback = vi.fn();
const mockUpdateFeedback = vi.fn();
const mockDeleteFeedback = vi.fn();
const mockSetFeedbackApproved = vi.fn();
const mockConfirmRemove = vi.fn();

vi.mock("../utils/confirmToast", () => ({
  confirmRemove: (...args: unknown[]) => mockConfirmRemove(...args),
}));

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listFeedback: (...args: unknown[]) => mockListFeedback(...args),
      listProducts: (...args: unknown[]) => mockListProducts(...args),
      createFeedback: (...args: unknown[]) => mockCreateFeedback(...args),
      updateFeedback: (...args: unknown[]) => mockUpdateFeedback(...args),
      deleteFeedback: (...args: unknown[]) => mockDeleteFeedback(...args),
      setFeedbackApproved: (...args: unknown[]) => mockSetFeedbackApproved(...args),
      uploadFeedbackImage: vi.fn(),
      listCategories: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("FeedbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmRemove.mockResolvedValue(true);
    mockListFeedback.mockResolvedValue({ data: { feedback: [] }, pagination: { total: 0 } });
    mockListProducts.mockResolvedValue({
      data: [{ _id: "p1", name: { en: "Product 1", ar: "منتج 1" } }],
    });
    mockCreateFeedback.mockResolvedValue({});
  });

  it("renders and loads feedback", async () => {
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListFeedback).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /feedback/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting feedback form with empty product", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListFeedback).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /add feedback/i }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    const dialog = screen.getByRole("dialog");
    const submitBtn = within(dialog).getByRole("button", { name: /add feedback|save/i });
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText("Product is required")).toBeInTheDocument();
    });
    expect(mockCreateFeedback).not.toHaveBeenCalled();
  });

  it("changes approved filter and reloads", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListFeedback).toHaveBeenCalled());
    const filterSelects = screen.getAllByRole("combobox");
    const filterSelect = filterSelects.find((s) => (s as HTMLSelectElement).options.length >= 2) ?? filterSelects[0];
    await user.selectOptions(filterSelect, "true");
    await waitFor(() => {
      expect(mockListFeedback).toHaveBeenLastCalledWith(
        expect.objectContaining({ approved: "true" }),
      );
    });
  });

  it("calls createFeedback when submitting valid form", async () => {
    const user = userEvent.setup();
    mockCreateFeedback.mockResolvedValue({});
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListFeedback).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /add feedback/i }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    const dialog = screen.getByRole("dialog");
    const productSelect = within(dialog).getAllByRole("combobox")[0];
    await user.selectOptions(productSelect, "p1");
    await user.type(within(dialog).getByPlaceholderText(/sarah/i), "Test User");
    await user.type(within(dialog).getByPlaceholderText(/what the customer/i), "Great product");
    await user.click(within(dialog).getByRole("button", { name: /add|save/i }));
    await waitFor(() => {
      expect(mockCreateFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          product: "p1",
          customerName: "Test User",
          message: "Great product",
          rating: 5,
        }),
      );
    });
  });

  it("calls deleteFeedback when delete confirmed", async () => {
    const user = userEvent.setup();
    mockConfirmRemove.mockResolvedValue(true);
    mockListFeedback.mockResolvedValue({
      data: {
        feedback: [
          {
            _id: "fb1",
            product: { _id: "p1", name: { en: "Product 1" } },
            customerName: "Jane",
            message: "Nice",
            rating: 5,
            approved: true,
            order: 0,
            createdAt: "2024-01-01",
          },
        ],
      },
      pagination: { total: 1 },
    });
    mockDeleteFeedback.mockResolvedValue({});
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Jane")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await waitFor(() => expect(mockDeleteFeedback).toHaveBeenCalledWith("fb1"));
  });

  it("loads with approved filter false", async () => {
    mockListFeedback.mockResolvedValue({
      data: { feedback: [] },
      pagination: { total: 0 },
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListFeedback).toHaveBeenCalled());
    const filterSelects = screen.getAllByRole("combobox");
    const filterSelect = filterSelects.find((s) => (s as HTMLSelectElement).options.length >= 2) ?? filterSelects[0];
    await user.selectOptions(filterSelect, "false");
    await waitFor(() => {
      expect(mockListFeedback).toHaveBeenLastCalledWith(
        expect.objectContaining({ approved: "false" }),
      );
    });
  });

  it("calls setFeedbackApproved when clicking approve button", async () => {
    const user = userEvent.setup();
    mockListFeedback.mockResolvedValue({
      data: {
        feedback: [
          {
            _id: "fb1",
            product: { _id: "p1", name: { en: "Product 1" } },
            customerName: "Jane",
            message: "Nice",
            rating: 5,
            approved: false,
            order: 0,
            createdAt: "2024-01-01",
          },
        ],
      },
      pagination: { total: 1 },
    });
    mockSetFeedbackApproved.mockResolvedValue({});
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Jane")).toBeInTheDocument());
    const approveBtn = screen.getByRole("button", { name: /no|unapprove/i });
    await user.click(approveBtn);
    await waitFor(() => {
      expect(mockSetFeedbackApproved).toHaveBeenCalledWith("fb1", true);
    });
  });
});
