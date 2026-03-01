/// <reference path="../support/commands.d.ts" />
describe("Departments E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to departments page", () => {
    cy.visit("/");
    cy.contains(/departments/i).click();
    cy.url().should("include", "/departments");
    cy.contains(/departments|marketing|admin/i).should("be.visible");
  });

  it("displays departments list or empty state", () => {
    cy.visit("/departments");
    cy.get("table, .card, .empty-state").should("exist");
  });
});
