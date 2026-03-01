/// <reference path="../support/commands.d.ts" />
describe("Cities E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to cities page", () => {
    cy.visit("/");
    cy.contains(/cities/i).click();
    cy.url().should("include", "/cities");
    cy.contains(/cities|delivery/i).should("be.visible");
  });

  it("displays cities list or empty state", () => {
    cy.visit("/cities");
    cy.get("table, .card, .empty-state, .no-cities").should("exist");
  });
});
