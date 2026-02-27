/// <reference path="../support/commands.d.ts" />
describe("Dashboard E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("shows dashboard after login", () => {
    cy.url().should("include", "/");
    cy.contains(/dashboard|orders|products/i).should("be.visible");
  });

  it("has navigation sidebar", () => {
    cy.get("nav").should("be.visible");
    cy.contains(/products|orders|categories/i).should("be.visible");
  });
});
