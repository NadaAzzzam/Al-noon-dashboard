/// <reference types="cypress" />
/// <reference path="./commands.d.ts" />

// Selectors that work with or without data-testid (e.g. during HMR or cached builds)
const LOGIN_EMAIL = "[data-testid=login-email], input[type=email]";
const LOGIN_PASSWORD = "[data-testid=login-password], input[type=password]";
const LOGIN_SUBMIT = "[data-testid=login-submit], button[type=submit]";

// Custom command to login with default admin credentials
Cypress.Commands.add("login", (email = "admin@localhost", password = "admin123") => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit("/login", { timeout: 20000 });
  // Wait for React to mount (SPA shell loads first, then React hydrates)
  cy.get(".login-page, .login-card, " + LOGIN_EMAIL, { timeout: 20000 }).should("exist");
  cy.get(LOGIN_EMAIL).clear().type(email);
  cy.get(LOGIN_PASSWORD).clear().type(password);
  cy.get(LOGIN_SUBMIT).click();
  cy.url().should("not.include", "/login");
});
