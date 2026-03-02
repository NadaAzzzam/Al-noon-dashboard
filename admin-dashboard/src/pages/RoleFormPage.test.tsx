import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RoleFormPage from "./RoleFormPage";
import "../i18n";

const mockListRolePermissions = vi.fn();
const mockGetRole = vi.fn();
const mockCreateRole = vi.fn();
const mockUpdateRole = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listRolePermissions: (...args: unknown[]) => mockListRolePermissions(...args),
      getRole: (...args: unknown[]) => mockGetRole(...args),
      createRole: (...args: unknown[]) => mockCreateRole(...args),
      updateRole: (...args: unknown[]) => mockUpdateRole(...args),
      deleteRole: vi.fn(),
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

function renderRoleForm(route = "/roles/new") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/roles/new" element={<RoleFormPage />} />
        <Route path="/roles/:id/edit" element={<RoleFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RoleFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListRolePermissions.mockResolvedValue({ data: { permissions: [] } });
  });

  it("renders new role form and loads permissions", async () => {
    renderRoleForm("/roles/new");
    await waitFor(() => {
      expect(mockListRolePermissions).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/new|role/i);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("renders edit role form when id provided", async () => {
    mockGetRole.mockResolvedValue({
      data: {
        role: {
          id: "r1",
          name: "Editor",
          key: "EDITOR",
          status: "ACTIVE",
          permissionIds: [],
          permissionsCount: 0,
        },
      },
    });
    renderRoleForm("/roles/r1/edit");
    await waitFor(() => {
      expect(mockGetRole).toHaveBeenCalledWith("r1");
    });
    expect(screen.getByDisplayValue("Editor")).toBeInTheDocument();
  });

  it("shows validation error when submitting empty name", async () => {
    const user = userEvent.setup();
    renderRoleForm("/roles/new");
    await waitFor(() => expect(mockListRolePermissions).toHaveBeenCalled());
    const submitBtn = screen.getByRole("button", { name: /create|save/i });
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
    });
    expect(mockCreateRole).not.toHaveBeenCalled();
  });

  it("calls createRole when submitting valid new role", async () => {
    const user = userEvent.setup();
    mockCreateRole.mockResolvedValue({});
    renderRoleForm("/roles/new");
    await waitFor(() => expect(mockListRolePermissions).toHaveBeenCalled());
    await user.type(screen.getByLabelText(/name/i), "Manager");
    await user.click(screen.getByRole("button", { name: /create|save/i }));
    await waitFor(() => {
      expect(mockCreateRole).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Manager" }),
      );
    });
  });

  it("shows loading state when editing", async () => {
    mockGetRole.mockImplementation(() => new Promise(() => {}));
    renderRoleForm("/roles/r1/edit");
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
