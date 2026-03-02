import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ContentPagesPage from "./ContentPagesPage";
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
      listCategories: vi.fn(),
      listProducts: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

describe("ContentPagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({ data: { settings: { contentPages: [] } } });
  });

  it("renders and loads content pages settings", async () => {
    render(
      <MemoryRouter>
        <ContentPagesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("switches tabs and updates page content", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          contentPages: [
            { slug: "privacy", title: { en: "Privacy", ar: "الخصوصية" }, content: { en: "", ar: "" } },
          ],
        },
      },
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContentPagesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByDisplayValue("Privacy")).toBeInTheDocument();
    const returnPolicyTab = screen.getByRole("button", { name: /return policy|return_policy/i });
    await user.click(returnPolicyTab);
    const saveBtn = screen.getByRole("button", { name: /save settings/i });
    expect(saveBtn).toBeInTheDocument();
  });

  it("saves content pages when submit clicked", async () => {
    mockUpdateSettings.mockResolvedValue({});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContentPagesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const titleInput = screen.getByPlaceholderText(/title.*en|content_title_en/i);
    await user.type(titleInput, "Privacy Policy");
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("shows error when load fails", async () => {
    mockGetSettings.mockRejectedValue(new Error("Network error"));
    render(
      <MemoryRouter>
        <ContentPagesPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed to load|error/i)).toBeInTheDocument();
    });
  });

  it("shows error when save fails", async () => {
    mockUpdateSettings.mockRejectedValue(new Error("Save failed"));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContentPagesPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });
});
