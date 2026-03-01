import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SettingsLayout from "./SettingsLayout";
import "../i18n";
import { hasPermission } from "../services/api";

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return { ...mod, hasPermission: vi.fn() };
});

describe("SettingsLayout", () => {
  beforeEach(() => {
    vi.mocked(hasPermission).mockReturnValue(true);
  });

  const renderWithRouter = (initialPath = "/settings") => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<span>General settings</span>} />
            <Route path="home" element={<span>Home page settings</span>} />
            <Route path="content-pages" element={<span>Content pages</span>} />
            <Route path="ai" element={<span>AI assistant</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders settings subnav and outlet", () => {
    renderWithRouter();
    expect(document.querySelector(".settings-layout")).toBeInTheDocument();
    expect(document.querySelector(".settings-subnav")).toBeInTheDocument();
    expect(screen.getByText("General settings")).toBeInTheDocument();
  });

  it("shows General tab when user has settings permission", () => {
    vi.mocked(hasPermission).mockImplementation(
      (p) => p === "settings.view" || p === "settings.manage"
    );
    renderWithRouter();
    expect(screen.getByRole("link", { name: /general/i })).toBeInTheDocument();
  });

  it("shows Home page tab when user has home_page permission", () => {
    vi.mocked(hasPermission).mockImplementation(
      (p) => p === "home_page.view" || p === "home_page.manage"
    );
    renderWithRouter();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
  });

  it("shows Content pages tab when user has content_pages permission", () => {
    vi.mocked(hasPermission).mockImplementation(
      (p) => p === "content_pages.view" || p === "content_pages.manage"
    );
    renderWithRouter();
    expect(screen.getByRole("link", { name: /content/i })).toBeInTheDocument();
  });

  it("shows AI assistant tab when user has ai_settings permission", () => {
    vi.mocked(hasPermission).mockImplementation(
      (p) => p === "ai_settings.manage" || p === "settings.manage"
    );
    renderWithRouter();
    expect(screen.getByRole("link", { name: /ai/i })).toBeInTheDocument();
  });

  it("renders outlet content for nested route", () => {
    renderWithRouter("/settings/home");
    expect(screen.getByText("Home page settings")).toBeInTheDocument();
  });
});
