import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RolesPage from "./RolesPage";
import "../i18n";

const mockListRoles = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listRoles: (...args: unknown[]) => mockListRoles(...args),
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

describe("RolesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListRoles.mockResolvedValue({ data: { roles: [] } });
  });

  it("renders and loads roles", async () => {
    render(
      <MemoryRouter>
        <RolesPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListRoles).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1, name: /roles & permissions/i })).toBeInTheDocument();
  });

  it("shows add role link when can manage", async () => {
    render(
      <MemoryRouter>
        <RolesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListRoles).toHaveBeenCalled());
    const links = screen.getAllByRole("link", { name: /new role/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/roles/new");
  });
});
