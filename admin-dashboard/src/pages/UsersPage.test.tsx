import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UsersPage from "./UsersPage";
import "../i18n";

const mockListUsers = vi.fn();
const mockListUserRoleOptions = vi.fn();
const mockListUserDepartmentOptions = vi.fn();
const mockCreateUser = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listUsers: (...args: unknown[]) => mockListUsers(...args),
      listUserRoleOptions: (...args: unknown[]) => mockListUserRoleOptions(...args),
      listUserDepartmentOptions: (...args: unknown[]) => mockListUserDepartmentOptions(...args),
      createUser: (...args: unknown[]) => mockCreateUser(...args),
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

  it("shows validation errors when submitting user form with empty name", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockListUsers).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /new user/i }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    const nameInput = screen.getByPlaceholderText(/john doe/i);
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});
