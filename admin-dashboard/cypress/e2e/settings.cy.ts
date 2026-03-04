/// <reference path="../support/commands.d.ts" />

describe("Settings E2E", () => {
  beforeEach(() => {
    cy.login();
  });

  it("navigates to settings and shows general form", () => {
    cy.visit("/settings", { timeout: 15000 });
    cy.url().should("include", "/settings");
    cy.contains(/settings/i).should("be.visible");
    cy.contains(/store name|Store information/i).should("be.visible");
    cy.get("#settings-store-name-en").should("be.visible");
    cy.get('button[type="submit"]').contains(/save settings/i).should("be.visible");
  });

  it("can update store name and save", () => {
    cy.visit("/settings", { timeout: 15000 });
    cy.get("#settings-store-name-en").should("be.visible").clear().type("Al-noon Test Store");
    cy.get('button[type="submit"]').contains(/save/i).click();
    cy.contains(/saved/i, { timeout: 10000 }).should("be.visible");
  });
});
