import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DepartmentFormPage from "./DepartmentFormPage";
import "../i18n";

const mockListRoles = vi.fn();
const mockGetDepartment = vi.fn();
const mockCreateDepartment = vi.fn();
const mockUpdateDepartment = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listRoles: (...args: unknown[]) => mockListRoles(...args),
      getDepartment: (...args: unknown[]) => mockGetDepartment(...args),
      createDepartment: (...args: unknown[]) => mockCreateDepartment(...args),
      updateDepartment: (...args: unknown[]) => mockUpdateDepartment(...args),
      deleteDepartment: vi.fn(),
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

function renderDepartmentForm(route = "/departments/new") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/departments/new" element={<DepartmentFormPage />} />
        <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DepartmentFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListRoles.mockResolvedValue({ data: { roles: [] } });
  });

  it("renders new department form and loads roles", async () => {
    renderDepartmentForm("/departments/new");
    await waitFor(() => {
      expect(mockListRoles).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/new|department/i);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("renders edit department form when id provided", async () => {
    mockGetDepartment.mockResolvedValue({
      data: {
        department: {
          id: "dept1",
          name: "Marketing",
          key: "marketing",
          status: "ACTIVE",
          roleIds: [],
        },
      },
    });
    renderDepartmentForm("/departments/dept1/edit");
    await waitFor(() => {
      expect(mockGetDepartment).toHaveBeenCalledWith("dept1");
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Marketing")).toBeInTheDocument();
    });
  });

  it("shows validation error when submitting empty name", async () => {
    const user = userEvent.setup();
    renderDepartmentForm("/departments/new");
    await waitFor(() => expect(mockListRoles).toHaveBeenCalled());
    const submitBtn = screen.getByRole("button", { name: /create|save/i });
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
    });
    expect(mockCreateDepartment).not.toHaveBeenCalled();
  });

  it("calls createDepartment when submitting valid new department", async () => {
    const user = userEvent.setup();
    mockCreateDepartment.mockResolvedValue({});
    renderDepartmentForm("/departments/new");
    await waitFor(() => expect(mockListRoles).toHaveBeenCalled());
    await user.type(screen.getByLabelText(/name/i), "Sales");
    await user.click(screen.getByRole("button", { name: /create|save/i }));
    await waitFor(() => {
      expect(mockCreateDepartment).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Sales" }),
      );
    });
  });

  it("shows loading state when editing", async () => {
    mockGetDepartment.mockImplementation(() => new Promise(() => {}));
    renderDepartmentForm("/departments/dept1/edit");
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
