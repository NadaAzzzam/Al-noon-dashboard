import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DepartmentsPage from "./DepartmentsPage";
import "../i18n";

const mockListDepartments = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listDepartments: (...args: unknown[]) => mockListDepartments(...args),
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

describe("DepartmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListDepartments.mockResolvedValue({ data: { departments: [] } });
  });

  it("renders and loads departments", async () => {
    render(
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListDepartments).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1, name: /^departments$/i })).toBeInTheDocument();
  });

  it("displays departments when data is returned", async () => {
    mockListDepartments.mockResolvedValue({
      data: {
        departments: [
          { id: "d1", name: "Marketing", key: "marketing", status: "ACTIVE" },
          { id: "d2", name: "Sales", key: "sales", status: "INACTIVE" },
        ],
      },
    });
    render(
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Marketing")).toBeInTheDocument();
    });
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("shows empty state when no departments", async () => {
    render(
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockListDepartments).toHaveBeenCalled();
    });
    expect(screen.getByText(/no departments found/i)).toBeInTheDocument();
  });

  it("displays error when load fails", async () => {
    mockListDepartments.mockRejectedValue(new Error("Failed to load"));
    render(
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
