const sel = {
  email: "[data-testid=login-email], input[type=email]",
  password: "[data-testid=login-password], input[type=password]",
  submit: "[data-testid=login-submit], button[type=submit]",
};

describe("Login E2E", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => win.sessionStorage.clear());
    cy.visit("/login", { timeout: 20000 });
  });

  it("displays login form", () => {
    cy.get("body").should("be.visible");
    cy.get(sel.email, { timeout: 20000 }).should("be.visible");
    cy.get(sel.password).should("be.visible");
    cy.get(sel.submit).should("be.visible");
  });

  it("has default credentials pre-filled", () => {
    cy.get(sel.email).should("have.value", "admin@localhost");
    cy.get(sel.password).should("have.value", "admin123");
  });

  it("redirects to dashboard after successful login", () => {
    // Requires backend running with MongoDB or DEV_WITHOUT_DB=1
    cy.get(sel.submit).click();
    cy.url({ timeout: 15000 }).should("not.include", "/login");
    cy.url().should("match", /\/(dashboard)?$/);
  });

  it("redirects to login when an API returns 403 Forbidden", () => {
    cy.get(sel.submit).click();
    cy.url({ timeout: 15000 }).should("not.include", "/login");
    cy.intercept("GET", "**/api/**", { statusCode: 403, body: { success: false, message: "Forbidden" } }).as("api403");
    cy.visit("/users", { timeout: 10000 });
    cy.url({ timeout: 5000 }).should("include", "/login");
  });
});
