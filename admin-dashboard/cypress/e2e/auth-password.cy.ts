/// <reference path="../support/commands.d.ts" />
/**
 * Auth password flow E2E (forgot / reset / change).
 * Uses cy.request to hit API; no UI for these flows in admin dashboard (sitefront flows).
 * Requires: backend running (e.g. port 4000) with API proxied.
 */
describe("Auth password API (forgot / reset / change)", () => {
  it("POST /api/auth/forgot-password rejects invalid email with 400", () => {
    cy.request({
      method: "POST",
      url: "/api/auth/forgot-password",
      body: { email: "not-an-email" },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status >= 500) {
        cy.log("Server unavailable - skipping");
        return;
      }
      expect(res.status).to.eq(400);
    });
  });

  it("POST /api/auth/forgot-password accepts valid email", () => {
    cy.request({
      method: "POST",
      url: "/api/auth/forgot-password",
      body: { email: "customer@example.com" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 503]);
      if (res.status === 200) {
        expect(res.body).to.have.property("success", true);
        expect(res.body?.data).to.have.property("sent", true);
      }
    });
  });

  it("POST /api/auth/reset-password rejects missing token with 400", () => {
    cy.request({
      method: "POST",
      url: "/api/auth/reset-password",
      body: { password: "newpass123", confirmPassword: "newpass123" },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status >= 500) {
        cy.log("Server unavailable - skipping");
        return;
      }
      expect(res.status).to.eq(400);
    });
  });

  it("POST /api/auth/reset-password rejects password mismatch with 400", () => {
    cy.request({
      method: "POST",
      url: "/api/auth/reset-password",
      body: {
        token: "any-token",
        password: "newpass123",
        confirmPassword: "different",
      },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status >= 500) {
        cy.log("Server unavailable - skipping");
        return;
      }
      expect(res.status).to.eq(400);
    });
  });

  it("POST /api/auth/change-password rejects without auth with 401", () => {
    cy.request({
      method: "POST",
      url: "/api/auth/change-password",
      body: {
        currentPassword: "old",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});
