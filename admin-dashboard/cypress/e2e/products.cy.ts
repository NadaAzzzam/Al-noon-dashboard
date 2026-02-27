/// <reference path="../support/commands.d.ts" />
describe("Products E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to products page", () => {
    cy.visit("/");
    cy.contains(/products/i).click();
    cy.url().should("include", "/products");
    cy.contains(/product|search|filter/i).should("be.visible");
  });

  it("displays products list with filters", () => {
    cy.visit("/products");
    cy.get("table, .card, [data-testid='products-list']").should("exist");
    cy.get("select, input[type='search'], .filters").should("exist");
  });

  it("can apply status filter", () => {
    cy.visit("/products");
    cy.get(".filters select").first().select("ACTIVE");
    cy.wait(300);
    cy.get(".filters").should("exist");
  });

  it("can search products", () => {
    cy.visit("/products");
    cy.get(".filters input").first().type("test");
    cy.wait(500);
    cy.get(".filters").should("exist");
  });

  it("navigates to new product form", () => {
    cy.visit("/products");
    cy.contains(/new|add|create/i).click();
    cy.url().should("match", /\/products\/new/);
    cy.contains(/name|title|product/i).should("be.visible");
  });

  it("new product form has required fields", () => {
    cy.visit("/products/new");
    cy.get('input[name="nameEn"], input[placeholder*="name" i]').should("exist");
    cy.get('input[name="price"], input[type="number"]').should("exist");
    cy.get('input[name="stock"], input[placeholder*="stock" i]').should("exist");
  });
});
