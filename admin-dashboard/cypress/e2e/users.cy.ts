/// <reference path="../support/commands.d.ts" />
describe("Users E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to users page", () => {
    cy.visit("/");
    cy.contains(/users/i).click();
    cy.url().should("include", "/users");
    cy.contains(/users|email|role/i).should("be.visible");
  });

  it("displays users list or empty state", () => {
    cy.visit("/users");
    cy.get("table, .card, .empty-state").should("exist");
  });
});
