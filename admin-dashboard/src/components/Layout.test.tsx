import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import "../i18n";
import * as apiModule from "../services/api";

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getProfile: vi.fn(),
      getDashboardStats: vi.fn(),
      getSettings: vi.fn(),
      signOut: vi.fn(),
    } as unknown as typeof mod.api,
    hasPermission: vi.fn(),
    getUploadsBaseUrl: vi.fn(() => "http://api.example.com"),
    setCurrentUser: vi.fn(),
    clearToken: vi.fn(),
    DEFAULT_LOGO_PATH: "/uploads/logos/default-logo.jpeg",
  };
});

vi.mock("../utils/googleAnalytics", () => ({
  initGoogleAnalytics: vi.fn(),
  sendPageView: vi.fn(),
}));

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.api.getProfile).mockResolvedValue({
      data: { user: { id: "1", name: "Test User", email: "test@example.com", role: "ADMIN" } },
    });
    vi.mocked(apiModule.api.getDashboardStats).mockResolvedValue({
      data: { lowStockCount: 0, ordersToday: 0 },
    });
    vi.mocked(apiModule.api.getSettings).mockResolvedValue({ data: { settings: {} } });
    vi.mocked(apiModule.hasPermission).mockReturnValue(true);
    const link = document.createElement("link");
    link.id = "dashboard-favicon";
    document.head.appendChild(link);
  });

  it("shows loading state initially", () => {
    vi.mocked(apiModule.api.getProfile).mockImplementation(
      () => new Promise(() => {})
    );
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Dashboard</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders layout with sidebar and outlet when auth ready", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Dashboard content</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    });
    expect(document.querySelector(".dashboard")).toBeInTheDocument();
    expect(document.querySelector(".sidebar")).toBeInTheDocument();
    expect(document.querySelector(".main")).toBeInTheDocument();
    expect(document.querySelector(".topbar-welcome")).toHaveTextContent(/welcome back|Test/i);
  });

  it("shows logout button and calls signOut on click", async () => {
    vi.mocked(apiModule.api.signOut).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Dashboard</span>} />
          </Route>
          <Route path="/login" element={<span>Login page</span>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      const logoutBtn = document.querySelector(".sidebar-footer button");
      expect(logoutBtn).toBeInTheDocument();
    });
    const logoutBtn = document.querySelector(".sidebar-footer button");
    fireEvent.click(logoutBtn!);
    await waitFor(() => {
      expect(apiModule.api.signOut).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(apiModule.clearToken).toHaveBeenCalled();
    });
  });

  it("shows nav links when user has permissions", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Dashboard</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
    expect(document.querySelector(".sidebar nav")).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});
