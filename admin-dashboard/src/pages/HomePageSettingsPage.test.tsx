import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import HomePageSettingsPage from "./HomePageSettingsPage";
import "../i18n";

const mockGetSettings = vi.fn();
const mockUpdateSettings = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      updateSettings: (...args: unknown[]) => mockUpdateSettings(...args),
      uploadHomePageMedia: vi.fn(),
      uploadCollectionImage: vi.fn(),
      uploadHeroImage: vi.fn(),
      uploadHeroVideo: vi.fn(),
      uploadPromoImage: vi.fn(),
      uploadSectionImage: vi.fn(),
      uploadSectionVideo: vi.fn(),
      listCategories: vi.fn(),
      listProducts: vi.fn(),
    },
    hasPermission: () => true,
  };
});

const defaultSettings = {
  hero: { images: [], videos: [], title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" }, ctaUrl: "" },
  heroEnabled: true,
  homeCollections: [] as Array<{ title: { en: string; ar: string }; image?: string; video?: string; hoverVideo?: string; url?: string; order?: number }>,
  newArrivalsSectionImages: [] as string[],
  newArrivalsSectionVideos: [] as string[],
};

describe("HomePageSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({
      data: { settings: { ...defaultSettings, homeCollections: [] } },
    });
  });

  it("renders and loads home page settings", async () => {
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/home|page/i);
  });

  it("displays announcement bar section", async () => {
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /announcement bar/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /show announcement bar/i })).toBeInTheDocument();
  });

  it("displays hero section and toggles hero enabled", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /hero section/i })).toBeInTheDocument();
    const heroCheckbox = screen.getByRole("checkbox", { name: /show hero section on storefront/i });
    expect(heroCheckbox).toBeChecked();
    await user.click(heroCheckbox);
    expect(heroCheckbox).not.toBeChecked();
  });

  it("loads homeCollections and displays collection fields when present", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          homeCollections: [
            { title: { en: "Abayas", ar: "عباءات" }, image: "/a.jpg", video: "/uploads/videos/abaya.mp4", hoverVideo: "/uploads/videos/abaya-hover.mp4", url: "/cat/abayas", order: 0 },
          ],
        },
      },
    });
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByDisplayValue("Abayas")).toBeInTheDocument();
    expect(screen.getByDisplayValue("/cat/abayas")).toBeInTheDocument();
    expect(screen.getByText(/default video/i)).toBeInTheDocument();
    expect(screen.getByText(/hover video/i)).toBeInTheDocument();
  });

  it("adds a new collection when Add collection clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /add collection/i }));
    const titleInputs = screen.getAllByPlaceholderText(/title.*en|collection/i);
    expect(titleInputs.length).toBeGreaterThan(0);
  });

  it("saves settings when Save clicked", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue({});
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("saves homeCollections with video, hoverVideo, defaultMediaType, hoverMediaType when present", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          homeCollections: [
            { title: { en: "Abayas", ar: "عباءات" }, image: "/a.jpg", video: "/uploads/abaya.mp4", hoverVideo: "/uploads/abaya-hover.mp4", defaultMediaType: "video", hoverMediaType: "image", url: "/cat/abayas", order: 0 },
          ],
        },
      },
    });
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    const payload = mockUpdateSettings.mock.calls[0][0];
    const collections = payload.homeCollections ?? [];
    expect(collections.length).toBe(1);
    expect(collections[0].titleEn).toBe("Abayas");
    expect(collections[0].titleAr).toBe("عباءات");
    expect(collections[0].image).toBe("/a.jpg");
    expect(collections[0].video).toBe("/uploads/abaya.mp4");
    expect(collections[0].hoverVideo).toBe("/uploads/abaya-hover.mp4");
    expect(collections[0].defaultMediaType).toBe("video");
    expect(collections[0].hoverMediaType).toBe("image");
    expect(collections[0].url).toBe("/cat/abayas");
  });

  it("shows error when load fails", async () => {
    mockGetSettings.mockRejectedValue(new Error("Network error"));
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
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
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it("displays new arrivals section and limit input", async () => {
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /new arrivals/i })).toBeInTheDocument();
    const limitInput = document.getElementById("home-new-arrivals-limit") as HTMLInputElement;
    expect(limitInput).toBeInTheDocument();
    expect(limitInput?.value).toBe("8");
  });

  it("displays featured products section", async () => {
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /featured|trending products/i })).toBeInTheDocument();
  });

  it("displays feedback section", async () => {
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /feedback/i })).toBeInTheDocument();
  });

  it("can remove a collection", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          homeCollections: [
            { title: { en: "Abayas", ar: "عباءات" }, image: "/a.jpg", url: "/cat/abayas", order: 0 },
          ],
        },
      },
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByDisplayValue("Abayas")).toBeInTheDocument());
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(screen.queryByDisplayValue("Abayas")).not.toBeInTheDocument();
    });
  });

  it("can update collection title and url", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          homeCollections: [
            { title: { en: "Abayas", ar: "عباءات" }, image: "", url: "/cat/abayas", order: 0 },
          ],
        },
      },
    });
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByDisplayValue("Abayas")).toBeInTheDocument());
    const titleInput = screen.getByDisplayValue("Abayas");
    await user.clear(titleInput);
    await user.type(titleInput, "Summer Collection");
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.homeCollections[0].titleEn).toBe("Summer Collection");
  });

  it("loads and saves announcement bar text", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          announcementBar: {
            text: { en: "Free shipping!", ar: "شحن مجاني!" },
            enabled: true,
            backgroundColor: "#1a1a2e",
          },
        },
      },
    });
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByDisplayValue("Free shipping!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("شحن مجاني!")).toBeInTheDocument();
    const enInput = screen.getByDisplayValue("Free shipping!");
    await user.clear(enInput);
    await user.type(enInput, "Sale ends soon!");
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.announcementBar.textEn).toBe("Sale ends soon!");
    expect(payload.announcementBar.textAr).toBe("شحن مجاني!");
    expect(payload.announcementBar.enabled).toBe(true);
  });

  it("loads and saves hero title and subtitle", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          hero: {
            images: [],
            videos: [],
            title: { en: "Welcome", ar: "مرحبا" },
            subtitle: { en: "Shop now", ar: "تسوق الآن" },
            ctaLabel: { en: "", ar: "" },
            ctaUrl: "",
          },
        },
      },
    });
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByDisplayValue("Welcome")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Shop now")).toBeInTheDocument();
    const titleInput = screen.getByDisplayValue("Welcome");
    await user.clear(titleInput);
    await user.type(titleInput, "New Season");
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.hero.titleEn).toBe("New Season");
    expect(payload.hero.subtitleEn).toBe("Shop now");
  });

  it("loads and saves new arrivals limit", async () => {
    mockGetSettings.mockResolvedValue({
      data: { settings: { ...defaultSettings, newArrivalsLimit: 12 } },
    });
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const limitInput = document.getElementById("home-new-arrivals-limit") as HTMLInputElement;
    expect(limitInput?.value).toBe("12");
    await user.click(limitInput);
    await user.keyboard("{Control>}a{/Control}16");
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.newArrivalsLimit).toBe(16);
  });

  it("loads and saves featured products toggle and limit", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          featuredProductsEnabled: true,
          featuredProductsLimit: 12,
        },
      },
    });
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const checkbox = screen.getByRole("checkbox", { name: /show featured products/i });
    expect(checkbox).toBeChecked();
    const limitInput = document.getElementById("home-featured-limit") as HTMLInputElement;
    expect(limitInput?.value).toBe("12");
    await user.click(checkbox);
    fireEvent.change(limitInput, { target: { value: "6" } });
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.featuredProductsEnabled).toBe(false);
    expect(payload.featuredProductsLimit).toBe(6);
  });

  it("loads and saves feedback section toggle and limit", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          feedbackSectionEnabled: true,
          feedbackDisplayLimit: 10,
        },
      },
    });
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const limitInput = document.getElementById("home-feedback-limit") as HTMLInputElement;
    expect(limitInput?.value).toBe("10");
    fireEvent.change(limitInput, { target: { value: "8" } });
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.feedbackSectionEnabled).toBe(true);
    expect(payload.feedbackDisplayLimit).toBe(8);
  });

  it("displays promo banner section", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          promoBanner: {
            enabled: true,
            image: "/promo.jpg",
            title: { en: "Summer Sale", ar: "تخفيضات الصيف" },
            subtitle: { en: "Up to 50% off", ar: "خصم حتى ٥٠٪" },
            ctaLabel: { en: "Shop", ar: "تسوق" },
            ctaUrl: "/sale",
          },
        },
      },
    });
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /promotional banner|promo/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Summer Sale")).toBeInTheDocument();
    expect(screen.getByDisplayValue("/sale")).toBeInTheDocument();
  });

  it("displays home collections section heading", async () => {
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /our collection/i })).toBeInTheDocument();
  });

  it("shows Upload video buttons for collections", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          ...defaultSettings,
          homeCollections: [
            { title: { en: "Abayas", ar: "عباءات" }, image: "/a.jpg", url: "/cat/abayas", order: 0 },
          ],
        },
      },
    });
    render(
      <MemoryRouter>
        <HomePageSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByDisplayValue("Abayas")).toBeInTheDocument());
    const uploadBtns = screen.getAllByRole("button", { name: /upload video/i });
    expect(uploadBtns.length).toBeGreaterThanOrEqual(2);
  });
});
