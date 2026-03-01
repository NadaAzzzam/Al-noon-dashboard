import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FeedbackPage from "./FeedbackPage";
import "../i18n";

const mockListFeedback = vi.fn();
const mockListProducts = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listFeedback: (...args: unknown[]) => mockListFeedback(...args),
      listProducts: (...args: unknown[]) => mockListProducts(...args),
      createFeedback: vi.fn(),
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
    mockListProducts.mockResolvedValue({ data: [], pagination: { total: 0 } });
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
});
