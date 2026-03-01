import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import "../i18n";

const mockSignIn = vi.fn();

vi.mock("../services/api", () => ({
  api: {
    signIn: (...args: unknown[]) => mockSignIn(...args),
  },
  setToken: vi.fn(),
  setCurrentUser: vi.fn(),
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

  it("shows validation error when submitting with short password", async () => {
    const user = userEvent.setup();
    renderLoginPage();
    const emailInput = await screen.findByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    await user.clear(passwordInput);
    await user.type(passwordInput, "123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/password must be at least 6 characters/i);
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows validation error when submitting with invalid email", async () => {
    const user = userEvent.setup();
    renderLoginPage();
    const emailInput = await screen.findByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    await user.clear(emailInput);
    await user.type(emailInput, "notanemail");
    await user.clear(passwordInput);
    await user.type(passwordInput, "validpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("calls signIn API when validation passes", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ data: { token: "jwt", user: {} } });
    renderLoginPage();
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("admin@localhost", "admin123");
    });
  });
});
