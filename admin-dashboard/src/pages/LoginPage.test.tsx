import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import "../i18n";

// Mock the api service
vi.mock("../services/api", () => ({
  api: {
    signIn: vi.fn(),
  },
  setToken: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

const renderLoginPage = () => {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with default credentials", async () => {
    renderLoginPage();
    await screen.findByPlaceholderText(/email/i);
    expect(screen.getByPlaceholderText(/email/i)).toHaveValue("admin@localhost");
    expect(screen.getByPlaceholderText(/password/i)).toHaveValue("admin123");
  });

  it("shows sign in button", () => {
    renderLoginPage();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("allows typing in email and password", async () => {
    const user = userEvent.setup();
    renderLoginPage();
    const emailInput = await screen.findByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    await user.clear(emailInput);
    await user.type(emailInput, "test@example.com");
    await user.clear(passwordInput);
    await user.type(passwordInput, "mypassword");
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("mypassword");
  });
});
