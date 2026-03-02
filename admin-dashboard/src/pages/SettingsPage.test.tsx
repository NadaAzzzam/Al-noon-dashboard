import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";
import "../i18n";

const mockGetSettings = vi.fn();
const mockUpdateSettings = vi.fn();
const mockUploadLogo = vi.fn();
const mockSendTestOrderEmail = vi.fn();

vi.mock("../services/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/api")>();
  return {
    ...mod,
    api: {
      ...mod.api,
      getSettings: (...args: unknown[]) => mockGetSettings(...args),
      updateSettings: (...args: unknown[]) => mockUpdateSettings(...args),
      uploadLogo: (...args: unknown[]) => mockUploadLogo(...args),
      sendTestOrderEmail: (...args: unknown[]) => mockSendTestOrderEmail(...args),
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
    await waitFor(() => {
      expect(screen.getByDisplayValue("My Store")).toBeInTheDocument();
    });
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

  it("uploads logo when valid image file selected", async () => {
    const { fireEvent } = await import("@testing-library/react");
    mockUploadLogo.mockResolvedValue("/uploads/logos/new.png");
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(mockUploadLogo).toHaveBeenCalledWith(file));
  });

  it("shows error when non-image file selected for logo", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Please select an image file \(PNG/i);
    });
    expect(mockUploadLogo).not.toHaveBeenCalled();
  });

  it("removes logo when remove logo clicked", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          storeName: { en: "Store", ar: "" },
          logo: "/uploads/logos/current.png",
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
    await user.click(screen.getByRole("button", { name: /remove logo|remove_logo/i }));
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    expect(mockUpdateSettings.mock.calls[0][0].logo).toBe("");
  });

  it("loads advancedSettings when present", async () => {
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          storeName: { en: "S", ar: "" },
          logo: null,
          advancedSettings: { currency: "USD", currencySymbol: "$" },
          quickLinks: [{ label: { en: "Link" }, url: "/link" }],
        },
      },
    });
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.getByDisplayValue("USD")).toBeInTheDocument();
    expect(screen.getByDisplayValue("$")).toBeInTheDocument();
  });

  it("shows error when logo upload fails with ApiError", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const { ApiError } = await import("../services/api");
    mockUploadLogo.mockRejectedValue(new ApiError(400, "Logo too large"));
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "logo.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Logo too large");
    });
  });

  it("shows error when logo upload fails with generic error", async () => {
    const { fireEvent } = await import("@testing-library/react");
    mockUploadLogo.mockRejectedValue(new Error("Network failure"));
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "logo.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows error when test order email fails", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          storeName: { en: "S", ar: "" },
          logo: null,
          currency: "EGP",
          orderNotificationsEnabled: true,
          orderNotificationEmail: "admin@test.com",
        },
      },
    });
    mockSendTestOrderEmail.mockRejectedValue(new Error("SMTP error"));
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const testEmailBtn = screen.getByRole("button", {
      name: /test.*order.*email|send test/i,
    });
    await user.click(testEmailBtn);
    await waitFor(() => expect(mockSendTestOrderEmail).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(/Could not send test email|Check SMTP/i)).toBeInTheDocument();
    });
  });

  it("sends test order email and shows success", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          storeName: { en: "S", ar: "" },
          logo: null,
          currency: "EGP",
          orderNotificationsEnabled: true,
          orderNotificationEmail: "admin@test.com",
        },
      },
    });
    mockSendTestOrderEmail.mockResolvedValue({});
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const testEmailBtn = screen.getByRole("button", {
      name: /test.*order.*email|send test/i,
    });
    await user.click(testEmailBtn);
    await waitFor(() => expect(mockSendTestOrderEmail).toHaveBeenCalled());
    expect(screen.getByText(/sent|success/i)).toBeInTheDocument();
  });

  it("adds and removes quick link", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      data: {
        settings: {
          storeName: { en: "S", ar: "" },
          logo: null,
          currency: "EGP",
          quickLinks: [],
        },
      },
    });
    mockUpdateSettings.mockResolvedValue({});
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    const addLinkBtn = screen.getByRole("button", { name: /add link|add_link/i });
    await user.click(addLinkBtn);
    const urlInputs = screen.getAllByPlaceholderText("URL");
    await user.type(urlInputs[urlInputs.length - 1], "https://example.com");
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteBtn);
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
  });
});
