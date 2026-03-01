import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FeedbackPage from "./FeedbackPage";
import "../i18n";

const mockListFeedback = vi.fn();
const mockListProducts = vi.fn();
const mockCreateFeedback = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listFeedback: (...args: unknown[]) => mockListFeedback(...args),
      listProducts: (...args: unknown[]) => mockListProducts(...args),
      createFeedback: (...args: unknown[]) => mockCreateFeedback(...args),
      updateFeedback: vi.fn(),
      deleteFeedback: vi.fn(),
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
});
