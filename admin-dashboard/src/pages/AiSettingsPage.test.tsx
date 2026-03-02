import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AiSettingsPage from "./AiSettingsPage";
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
    },
    hasPermission: () => true,
  };
});

describe("AiSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          aiAssistant: {
            enabled: false,
            geminiApiKey: "",
            assistantName: "alnoon-admin",
            greeting: { en: "Hi!", ar: "مرحباً" },
            systemPrompt: "You are helpful.",
            suggestedQuestions: [
              { en: "Shipping?", ar: "شحن؟" },
              { en: "Returns?", ar: "إرجاع؟" },
            ],
          },
        },
      },
    });
  });

  it("renders and loads AI settings", async () => {
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockGetSettings).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/ai|assistant/i);
  });

  it("shows loading state initially", () => {
    mockGetSettings.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays AI form when settings loaded", async () => {
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByRole("checkbox", { name: /enable ai/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/gemini api key/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("calls updateSettings when submitting form", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue({});
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          aiAssistant: expect.objectContaining({
            enabled: false,
            assistantName: "alnoon-admin",
          }),
        }),
      );
    });
  });

  it("displays saved message after successful save", async () => {
    const user = userEvent.setup();
    mockUpdateSettings.mockResolvedValue({});
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it("displays error when load fails", async () => {
    mockGetSettings.mockRejectedValue(new Error("Failed to load"));
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it("adds suggested question when add button clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const addBtn = screen.getByRole("button", { name: /add question/i });
    const initialInputs = screen.getAllByPlaceholderText(/question \(en\)/i);
    await user.click(addBtn);
    const newInputs = screen.getAllByPlaceholderText(/question \(en\)/i);
    expect(newInputs.length).toBeGreaterThan(initialInputs.length);
  });

  it("removes suggested question when remove button clicked", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          aiAssistant: {
            enabled: false,
            suggestedQuestions: [
              { en: "Q1", ar: "س1" },
              { en: "Q2", ar: "س2" },
            ],
          },
        },
      },
    });
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByDisplayValue("Q1")).toBeInTheDocument());
    const removeBtns = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeBtns[0]);
    await waitFor(() => {
      expect(screen.queryByDisplayValue("Q1")).not.toBeInTheDocument();
    });
  });

  it("toggles show/hide API key", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          aiAssistant: {
            enabled: false,
            geminiApiKey: "sk-secret-key",
          },
        },
      },
    });
    render(
      <MemoryRouter>
        <AiSettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const toggleBtn = screen.getByRole("button", { name: /show/i });
    const keyInput = screen.getByLabelText(/gemini api key/i);
    expect(keyInput).toHaveAttribute("type", "password");
    await user.click(toggleBtn);
    expect(keyInput).toHaveAttribute("type", "text");
  });
});
