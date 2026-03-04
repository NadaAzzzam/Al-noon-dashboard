/// <reference path="../support/commands.d.ts" />
describe("Customers E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to customers page", () => {
    cy.visit("/");
    cy.contains(/customers/i).click();
    cy.url().should("include", "/customers");
    cy.contains(/customers|email|member/i).should("be.visible");
  });

  it("displays customers list or empty state", () => {
    cy.visit("/customers");
    cy.get("table, .card, .empty-state").should("exist");
  });

  it("can open customer detail and change password modal", () => {
    cy.intercept("GET", "**/api/customers", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          customers: [
            { id: "cust-e2e-1", name: "E2E Customer", email: "e2e@example.com", role: "USER", createdAt: "2024-01-01T00:00:00Z" },
          ],
        },
      },
    }).as("listCustomers");
    cy.intercept("GET", "**/api/customers/cust-e2e-1", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          customer: {
            id: "cust-e2e-1",
            name: "E2E Customer",
            email: "e2e@example.com",
            role: "USER",
            createdAt: "2024-01-01T00:00:00Z",
          },
        },
      },
    }).as("getCustomer");
    cy.intercept("GET", "**/api/customers/cust-e2e-1/orders", {
      statusCode: 200,
      body: { success: true, data: { orders: [] } },
    }).as("getOrders");
    cy.intercept("PUT", "**/api/customers/cust-e2e-1/password", {
      statusCode: 200,
      body: { success: true, message: "OK", data: { updated: true } },
    }).as("updatePassword");

    cy.visit("/customers");
    cy.wait("@listCustomers");
    // Open actions dropdown for the first row, then click View link (customer detail)
    cy.get(".table-actions-trigger").first().click();
    cy.get('a[href*="/customers/cust-e2e-1"]').click();
    cy.url().should("include", "/customers/cust-e2e-1");
    cy.wait(["@getCustomer", "@getOrders"]);
    cy.contains("E2E Customer").should("be.visible");

    cy.get("[data-testid=customer-change-password-btn]").click();
    cy.get("[role=dialog]").should("be.visible");
    cy.get("[data-testid=customer-new-password]").type("newpass123");
    cy.get("[data-testid=customer-confirm-password]").type("newpass123");
    cy.get("[data-testid=customer-password-submit]").click();
    cy.wait("@updatePassword");
    cy.get("[role=dialog]").should("not.exist");
  });

  it("customer detail page (direct URL) shows change password flow", () => {
    cy.intercept("GET", "**/api/customers/cust-direct-1", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          customer: {
            id: "cust-direct-1",
            name: "Direct Customer",
            email: "direct@example.com",
            role: "USER",
            createdAt: "2024-01-01T00:00:00Z",
          },
        },
      },
    }).as("getCustomer");
    cy.intercept("GET", "**/api/customers/cust-direct-1/orders", {
      statusCode: 200,
      body: { success: true, data: { orders: [] } },
    }).as("getOrders");
    cy.intercept("PUT", "**/api/customers/cust-direct-1/password", {
      statusCode: 200,
      body: { success: true, message: "OK", data: { updated: true } },
    }).as("updatePassword");

    cy.visit("/customers/cust-direct-1");
    cy.wait(["@getCustomer", "@getOrders"]);
    cy.contains("Direct Customer").should("be.visible");
    cy.get("[data-testid=customer-change-password-btn]").click();
    cy.get("[role=dialog]").should("be.visible");
    cy.get("[data-testid=customer-new-password]").type("newpass123");
    cy.get("[data-testid=customer-confirm-password]").type("newpass123");
    cy.get("[data-testid=customer-password-submit]").click();
    cy.wait("@updatePassword");
    cy.get("[role=dialog]").should("not.exist");
  });
});
