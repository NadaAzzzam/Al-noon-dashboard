import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactSubmissionsPage from "./ContactSubmissionsPage";
import "../i18n";
import userEvent from "@testing-library/user-event";

const mockListContactSubmissions = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listContactSubmissions: (...args: unknown[]) => mockListContactSubmissions(...args),
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

describe("ContactSubmissionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListContactSubmissions.mockResolvedValue({
      data: { submissions: [] },
      pagination: { total: 0 },
    });
  });

  it("renders and loads contact submissions", async () => {
    render(
      <MemoryRouter>
        <ContactSubmissionsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListContactSubmissions).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /contact/i })).toBeInTheDocument();
  });

  it("displays submissions and pagination when multiple pages", async () => {
    mockListContactSubmissions.mockResolvedValue({
      data: {
        submissions: [{ _id: "s1", name: "John", email: "j@test.com", comment: "Hi", createdAt: "2024-01-01" }],
      },
      pagination: { total: 25 },
    });
    render(
      <MemoryRouter>
        <ContactSubmissionsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
    });
    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(nextBtn);
    await waitFor(() => {
      expect(mockListContactSubmissions).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });
  });
});
