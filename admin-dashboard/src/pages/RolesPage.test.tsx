import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RolesPage from "./RolesPage";
import "../i18n";

const mockListRoles = vi.fn();
const mockDeleteRole = vi.fn();

vi.mock("../utils/confirmToast", () => ({
  confirmRemove: vi.fn().mockResolvedValue(true),
}));

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listRoles: (...args: unknown[]) => mockListRoles(...args),
      deleteRole: (...args: unknown[]) => mockDeleteRole(...args),
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

  it("displays roles when data returned", async () => {
    mockListRoles.mockResolvedValue({
      data: {
        roles: [
          { id: "r1", name: "Admin", key: "ADMIN", permissionIds: [], permissionsCount: 0 },
          { id: "r2", name: "Editor", key: "EDITOR", permissionIds: [], permissionsCount: 0 },
        ],
      },
    });
    render(
      <MemoryRouter>
        <RolesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Admin")).toBeInTheDocument());
    expect(screen.getByText("Editor")).toBeInTheDocument();
  });

  it("shows error when load fails", async () => {
    mockListRoles.mockRejectedValue(new Error("Failed"));
    render(
      <MemoryRouter>
        <RolesPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load|error/i)).toBeInTheDocument();
    });
  });

  it("calls deleteRole when delete confirmed", async () => {
    mockListRoles
      .mockResolvedValueOnce({
        data: {
          roles: [
            { id: "r1", name: "Custom", key: "CUSTOM", permissionIds: [], permissionsCount: 0 },
          ],
        },
      })
      .mockResolvedValue({ data: { roles: [] } });
    mockDeleteRole.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RolesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Custom")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(mockDeleteRole).toHaveBeenCalledWith("r1");
  });

  it("handles 404 from listRoles as empty", async () => {
    const { ApiError } = await import("../services/api");
    mockListRoles.mockRejectedValue(new ApiError(404, "Not found"));
    render(
      <MemoryRouter>
        <RolesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListRoles).toHaveBeenCalled());
    expect(screen.queryByText(/failed|error/i)).not.toBeInTheDocument();
  });
});
