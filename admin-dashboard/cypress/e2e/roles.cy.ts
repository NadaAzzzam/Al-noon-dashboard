/// <reference path="../support/commands.d.ts" />
describe("Roles E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to roles page", () => {
    cy.visit("/");
    cy.contains(/roles|permissions/i).click();
    cy.url().should("include", "/roles");
    cy.contains(/roles|permissions/i).should("be.visible");
  });

  it("displays roles list or empty state", () => {
    cy.visit("/roles");
    cy.get("table, .card, .empty-state").should("exist");
  });

  it("can navigate to new role form", () => {
    cy.visit("/roles");
    cy.contains(/new role/i).first().click();
    cy.url().should("match", /\/roles\/new/);
  });
});
