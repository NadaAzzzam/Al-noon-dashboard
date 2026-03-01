/// <reference path="../support/commands.d.ts" />
describe("Subscribers E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to subscribers page", () => {
    cy.visit("/");
    cy.contains(/subscribers|newsletter/i).click();
    cy.url().should("include", "/subscribers");
    cy.contains(/subscribers|email/i).should("be.visible");
  });

  it("displays subscribers list or empty state", () => {
    cy.visit("/subscribers");
    cy.get("table, .card, .empty-state").should("exist");
  });
});
