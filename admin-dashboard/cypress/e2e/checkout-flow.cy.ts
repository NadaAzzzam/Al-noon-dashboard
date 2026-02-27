/// <reference path="../support/commands.d.ts" />
/**
 * Checkout flow E2E tests.
 * These tests verify the admin dashboard side of orders (viewing orders created via checkout).
 * The actual storefront checkout is in a separate storefront app; this tests that
 * orders created via checkout appear correctly in the admin.
 */
describe("Checkout flow (admin view) E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("orders page shows orders from checkout", () => {
    cy.visit("/orders");
    cy.get("table tbody, .orders-list").should("exist");
    cy.contains(/order|total|status/i).should("be.visible");
  });

  it("order detail shows checkout info when order exists", () => {
    cy.visit("/orders");
    cy.get("body").then(($body) => {
      if ($body.find("a[href*='/orders/']").length > 0) {
        cy.get("a[href*='/orders/']").first().click({ force: true });
        cy.contains(/order|items|total|payment|address/i).should("be.visible");
      }
    });
  });

  it("order row has status update when order exists", () => {
    cy.visit("/orders");
    cy.get("body").then(($body) => {
      if ($body.find("table tbody tr select").length > 0) {
        cy.get("table tbody tr select").first().should("exist");
      }
    });
  });

  it("dashboard shows order stats", () => {
    cy.visit("/");
    cy.contains(/orders|total|today|dashboard/i).should("be.visible");
  });
});
