import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePageSettingsPage from "./HomePageSettingsPage";
import "../i18n";

const mockGetSettings = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      uploadHomePageMedia: vi.fn(),
      uploadCollectionImage: vi.fn(),
      listCategories: vi.fn(),
      listProducts: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("HomePageSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          hero: { images: [], videos: [], title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" }, ctaUrl: "" },
          heroEnabled: true,
          homeCollections: [],
          newArrivalsSectionImages: [],
          newArrivalsSectionVideos: [],
        },
      },
    });
  });

  it("renders and loads home page settings", async () => {
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetSettings).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/home|page/i);
  });
});
