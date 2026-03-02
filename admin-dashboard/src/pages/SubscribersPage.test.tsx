import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

  it("fetches next page when pagination next clicked", async () => {
    mockListSubscribers
      .mockResolvedValueOnce({
        data: { subscribers: [{ email: "s1@test.com", createdAt: "2024-01-01" }] },
        pagination: { total: 25 },
      })
      .mockResolvedValue({
        data: { subscribers: [{ email: "s2@test.com", createdAt: "2024-01-02" }] },
        pagination: { total: 25 },
      });
    render(
      <MemoryRouter>
        <SubscribersPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("s1@test.com")).toBeInTheDocument());
    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    await waitFor(() => expect(mockListSubscribers).toHaveBeenCalledTimes(2));
  });

  it("displays empty state when no subscribers", async () => {
    mockListSubscribers.mockReset();
    mockListSubscribers.mockResolvedValue({ data: { subscribers: [] }, pagination: { total: 0 } });
    render(
      <MemoryRouter>
        <SubscribersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/No subscribers yet/i)).toBeInTheDocument();
    });
  });
});
