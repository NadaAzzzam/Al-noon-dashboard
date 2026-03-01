/// <reference path="../support/commands.d.ts" />
describe("Contact Submissions E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to contact submissions page", () => {
    cy.visit("/");
    cy.contains(/contact|submissions/i).click();
    cy.url().should("include", "/contact");
    cy.contains(/contact|name|email|comment/i).should("be.visible");
  });

  it("displays contact submissions list or empty state", () => {
    cy.visit("/contact");
    cy.get("table, .card, .empty-state").should("exist");
  });
});
