import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AiChatHistoryPage from "./AiChatHistoryPage";
import "../i18n";

const mockListAiSessions = vi.fn();
const mockGetAiSession = vi.fn();
const mockDeleteAiSession = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      listAiSessions: (...args: unknown[]) => mockListAiSessions(...args),
      getAiSession: (...args: unknown[]) => mockGetAiSession(...args),
      deleteAiSession: (...args: unknown[]) => mockDeleteAiSession(...args),
      listCategories: vi.fn(),
      listProducts: vi.fn(),
      listOrders: vi.fn(),
      getOrder: vi.fn(),
      getSettings: vi.fn(),
      getDashboardStats: vi.fn(),
    },
    hasPermission: () => true,
  };
});

function renderAiChatHistory(route = "/ai-chats") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/ai-chats" element={<AiChatHistoryPage />} />
        <Route path="/ai-chats/:id" element={<AiChatHistoryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AiChatHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListAiSessions.mockResolvedValue({
      data: { sessions: [], total: 0 },
      sessions: [],
      total: 0,
    });
  });

  it("renders and loads AI chat sessions", async () => {
    renderAiChatHistory("/ai-chats");
    await waitFor(() => {
      expect(mockListAiSessions).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { level: 1, name: /ai.*chat|chat.*history/i })).toBeInTheDocument();
  });

  it("displays sessions when data is returned", async () => {
    mockListAiSessions.mockResolvedValue({
      data: {
        sessions: [
          {
            id: "s1",
            sessionId: "session-abc123",
            messageCount: 5,
            customerName: "Test User",
            status: "active",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:05:00Z",
          },
        ],
        total: 1,
      },
    });
    renderAiChatHistory("/ai-chats");
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays empty state when no sessions", async () => {
    renderAiChatHistory("/ai-chats");
    await waitFor(() => {
      expect(mockListAiSessions).toHaveBeenCalled();
    });
    expect(screen.getByText(/no.*sessions/i)).toBeInTheDocument();
  });

  it("displays error when load fails", async () => {
    mockListAiSessions.mockRejectedValue(new Error("Failed to load"));
    renderAiChatHistory("/ai-chats");
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it("loads session detail when viewing a session", async () => {
    mockListAiSessions.mockResolvedValue({
      data: {
        sessions: [
          {
            id: "s1",
            sessionId: "session-abc123",
            messageCount: 5,
            status: "active",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:05:00Z",
          },
        ],
        total: 1,
      },
    });
    mockGetAiSession.mockResolvedValue({
      data: {
        id: "s1",
        sessionId: "session-abc123",
        messages: [{ role: "user", content: "Hello" }],
        status: "active",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:05:00Z",
      },
    });
    renderAiChatHistory("/ai-chats/s1");
    await waitFor(() => {
      expect(mockGetAiSession).toHaveBeenCalledWith("s1");
    });
  });

  it("displays session messages in detail view", async () => {
    mockGetAiSession.mockResolvedValue({
      data: {
        id: "s1",
        sessionId: "session-abc123",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi! How can I help?" },
        ],
        status: "active",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:05:00Z",
      },
    });
    renderAiChatHistory("/ai-chats/s1");
    await waitFor(() => expect(mockGetAiSession).toHaveBeenCalled());
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText(/Hi! How can I help/i)).toBeInTheDocument();
  });

  it("shows loading then empty detail when session load fails", async () => {
    mockGetAiSession.mockRejectedValue(new Error("Not found"));
    renderAiChatHistory("/ai-chats/s1");
    await waitFor(() => expect(mockGetAiSession).toHaveBeenCalledWith("s1"));
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
