import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactSubmissionsPage from "./ContactSubmissionsPage";
import "../i18n";

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
});
