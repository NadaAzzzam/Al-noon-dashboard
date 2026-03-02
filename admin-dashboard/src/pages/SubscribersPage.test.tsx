import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SubscribersPage from "./SubscribersPage";
import "../i18n";

const mockListSubscribers = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listSubscribers: (...args: unknown[]) => mockListSubscribers(...args),
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

describe("SubscribersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListSubscribers.mockResolvedValue({
      data: { subscribers: [] },
      pagination: { total: 0 },
    });
  });

  it("renders and loads subscribers", async () => {
    render(
      <MemoryRouter>
        <SubscribersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListSubscribers).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /subscribers/i })).toBeInTheDocument();
  });

  it("displays subscribers when data is returned", async () => {
    mockListSubscribers.mockResolvedValue({
      data: { subscribers: [{ email: "sub@test.com", createdAt: "2024-01-01" }] },
      pagination: { total: 1 },
    });
    render(
      <MemoryRouter>
        <SubscribersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("sub@test.com")).toBeInTheDocument();
    });
  });

  it("displays empty state when no subscribers", async () => {
    render(
      <MemoryRouter>
        <SubscribersPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListSubscribers).toHaveBeenCalled());
    expect(screen.getByText(/no subscribers yet|no_subscribers/i)).toBeInTheDocument();
  });
});
