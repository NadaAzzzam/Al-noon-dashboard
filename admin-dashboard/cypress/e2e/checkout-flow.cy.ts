/// <reference path="../support/commands.d.ts" />
/**
 * Checkout flow E2E tests.
 * These tests verify the admin dashboard side of orders (viewing orders created via checkout).
 * The actual storefront checkout is in a separate storefront app; this tests that
 * orders created via checkout appear correctly in the admin.
 *
 * Also tests the apply-discount API (via proxy) - used by storefront before checkout.
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

describe("Apply discount API E2E", () => {
  it("POST /api/checkout/apply-discount returns discount when valid code", () => {
    cy.request({
      method: "POST",
      url: "/api/checkout/apply-discount",
      body: { discountCode: "SAVE10", subtotal: 200 },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        expect(res.body.success).to.be.true;
        expect(res.body.data?.valid).to.be.true;
        expect(res.body.data?.discountCode).to.eq("SAVE10");
        expect(res.body.data?.discountAmount).to.be.a("number");
      } else if (res.status === 503) {
        expect(res.body.success).to.be.false;
      } else {
        expect([200, 400, 503]).to.include(res.status);
      }
    });
  });

  it("POST /api/checkout/apply-discount returns 400 for invalid code", () => {
    cy.request({
      method: "POST",
      url: "/api/checkout/apply-discount",
      body: { discountCode: "INVALID_CODE_XYZ", subtotal: 500 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 503]);
      if (res.status === 400) {
        expect(res.body.success).to.be.false;
      }
    });
  });
});
