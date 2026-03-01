import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequirePermission from "./RequirePermission";
import "../i18n";
import { hasPermission } from "../services/api";

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return { ...mod, hasPermission: vi.fn() };
});

describe("RequirePermission", () => {
  beforeEach(() => {
    vi.mocked(hasPermission).mockReturnValue(true);
  });

  it("renders children when user has permission", () => {
    render(
      <MemoryRouter initialEntries={["/test"]}>
        <Routes>
          <Route path="/test" element={<RequirePermission permission="test.view"><span>Protected content</span></RequirePermission>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects when user lacks permission (non-dashboard path)", () => {
    vi.mocked(hasPermission).mockReturnValueOnce(false);
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <Routes>
          <Route path="/products" element={<RequirePermission permission="products.view"><span>Products</span></RequirePermission>} />
          <Route path="/" element={<span>Dashboard</span>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows no-permission message when on dashboard and lacks access", () => {
    vi.mocked(hasPermission).mockReturnValueOnce(false);
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RequirePermission permission="dashboard.view"><span>Dashboard</span></RequirePermission>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/no permission|do not have permission/i)).toBeInTheDocument();
  });
});
