/// <reference path="../support/commands.d.ts" />
describe("Feedback E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to feedback page", () => {
    cy.visit("/");
    cy.contains(/feedback|reviews/i).click();
    cy.url().should("include", "/feedback");
    cy.contains(/feedback|rating|customer/i).should("be.visible");
  });

  it("displays feedback list or empty state", () => {
    cy.visit("/feedback");
    cy.get("table, .card, .empty-state").should("exist");
  });
});
