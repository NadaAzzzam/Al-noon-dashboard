import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";
import "../i18n";

const mockGetSettings = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      ...mod.api,
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
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
});
