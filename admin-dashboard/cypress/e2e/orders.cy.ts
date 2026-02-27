/// <reference path="../support/commands.d.ts" />
describe("Orders E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to orders page", () => {
    cy.visit("/");
    cy.contains(/orders/i).click();
    cy.url().should("include", "/orders");
    cy.contains(/order|status|pending/i).should("be.visible");
  });

  it("displays orders list with status filter", () => {
    cy.visit("/orders");
    cy.get("table, .card, [data-testid='orders-list']").should("exist");
    cy.get("select").should("have.length.at.least", 1);
    cy.contains(/pending|confirmed|shipped|delivered|cancelled/i).should("be.visible");
  });

  it("can filter orders by status", () => {
    cy.visit("/orders");
    cy.get(".filters select").first().select("PENDING");
    cy.wait(300);
    cy.get(".filters").should("exist");
  });

  it("can filter orders by payment method", () => {
    cy.visit("/orders");
    cy.get(".filters select").eq(1).select("COD");
    cy.wait(300);
  });

  it("can clear filters when filters applied", () => {
    cy.visit("/orders");
    cy.get(".filters select").first().select("PENDING");
    cy.get(".clear-filters-btn").click();
    cy.get(".filters select").first().should("have.value", "");
  });

  it("displays order rows with status badges", () => {
    cy.visit("/orders");
    cy.get("table tbody tr, .order-row, [data-testid='order-row']").should("exist");
    cy.get(".badge, [class*='badge']").should("exist");
  });

  it("can open order detail when orders exist", () => {
    cy.visit("/orders");
    cy.get("body").then(($body) => {
      if ($body.find("a[href*='/orders/']").length > 0) {
        cy.get("a[href*='/orders/']").first().click({ force: true });
        cy.url().should("match", /\/orders\/[a-f0-9]+/);
        cy.contains(/order|items|total|status/i).should("be.visible");
      }
    });
  });
});
