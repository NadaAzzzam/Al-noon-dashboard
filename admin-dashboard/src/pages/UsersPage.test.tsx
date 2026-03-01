import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UsersPage from "./UsersPage";
import "../i18n";

const mockListUsers = vi.fn();
const mockListUserRoleOptions = vi.fn();
const mockListUserDepartmentOptions = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listUsers: (...args: unknown[]) => mockListUsers(...args),
      listUserRoleOptions: (...args: unknown[]) => mockListUserRoleOptions(...args),
      listUserDepartmentOptions: (...args: unknown[]) => mockListUserDepartmentOptions(...args),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
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

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockListUserRoleOptions.mockResolvedValue({ data: { roles: [{ id: "1", key: "ADMIN", name: "Admin" }] } });
    mockListUserDepartmentOptions.mockResolvedValue({ data: { departments: [] } });
  });

  it("renders and loads users", async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /users/i })).toBeInTheDocument();
  });

  it("loads role and department options when can manage", async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListUserRoleOptions).toHaveBeenCalled();
      expect(mockListUserDepartmentOptions).toHaveBeenCalled();
    });
  });
});
