import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";
import "../i18n";

const mockGetSettings = vi.fn();
const mockUpdateSettings = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      ...mod.api,
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      updateSettings: (...args: unknown[]) => mockUpdateSettings(...args),
      uploadLogo: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          storeName: { en: "Test Store", ar: "متجر" },
          logo: "/uploads/logos/test.png",
          currency: "EGP",
          currencySymbol: "LE",
          newsletterEnabled: true,
        },
      },
    });
  });

  it("renders and loads settings", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetSettings).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/settings/i);
  });

  it("displays loaded store name in form", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          storeName: { en: "My Store", ar: "متجري" },
          logo: null,
          currency: "EGP",
        },
      },
    });
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.some((i) => (i as HTMLInputElement).value === "My Store")).toBe(true);
  });

  it("shows error when load fails", async () => {
    mockGetSettings.mockRejectedValue(new Error("Network error"));
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load|error/i)).toBeInTheDocument();
    });
  });

  it("shows error when save fails", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockRejectedValue(new Error("Save failed"));
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it("calls updateSettings when save is clicked", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue({});
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const saveBtn = screen.getByRole("button", { name: /save/i });
    await user.click(saveBtn);
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });
});
