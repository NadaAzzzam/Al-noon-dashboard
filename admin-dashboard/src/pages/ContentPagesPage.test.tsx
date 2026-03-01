import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContentPagesPage from "./ContentPagesPage";
import "../i18n";

const mockGetSettings = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      updateSettings: vi.fn(),
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
});
