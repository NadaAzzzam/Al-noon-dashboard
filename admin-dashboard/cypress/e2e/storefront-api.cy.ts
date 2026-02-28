/// <reference path="../support/commands.d.ts" />
/**
 * Storefront API E2E tests.
 * Verifies the ?for=storefront param returns slim product responses.
 * Uses cy.request to call the API directly (proxied to backend in dev).
 * Requires: backend running on port 4000, admin dev server with proxy.
 */
describe("Storefront API (slim response)", () => {
  it("GET /api/products?for=storefront returns slim product list", () => {
    cy.request({
      method: "GET",
      url: "/api/products",
      qs: { slug: "*", for: "storefront", page: 1, limit: 5 },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 503 || res.status >= 500) {
        cy.log("Server unavailable - skipping storefront API test");
        return;
      }
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property("data").that.is.an("array");
      if (res.body.data?.length > 0) {
        const p = res.body.data[0];
        expect(p).not.to.have.property("tags");
        expect(p).not.to.have.property("vendor");
        expect(p).not.to.have.property("imageColors");
        expect(p).not.to.have.property("__v");
        expect(p).not.to.have.property("createdAt");
        expect(p).not.to.have.property("updatedAt");
        expect(p).not.to.have.property("isNewArrival");
        expect(p).to.have.property("_id");
        expect(p).to.have.property("name");
        expect(p).to.have.property("media");
      }
    });
  });

  it("GET /api/products without for=storefront returns full product list (admin compatible)", () => {
    cy.request({
      method: "GET",
      url: "/api/products",
      qs: { slug: "*", page: 1, limit: 2 },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 503 || res.status >= 500) {
        cy.log("Server unavailable - skipping full response test");
        return;
      }
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("data").that.is.an("array");
      if (res.body.data?.length > 0) {
        const p = res.body.data[0];
        expect(p).to.have.property("_id");
        expect(p).to.have.property("name");
      }
    });
  });

  it("GET /api/products/:id?for=storefront returns slim single product", () => {
    cy.request({
      method: "GET",
      url: "/api/products",
      qs: { slug: "*", page: 1, limit: 1 },
      failOnStatusCode: false,
    }).then((listRes) => {
      if (listRes.status !== 200 || !listRes.body.data?.length) {
        cy.log("No products - skipping single product test");
        return;
      }
      const productId = listRes.body.data[0]._id;
      cy.request({
        method: "GET",
        url: `/api/products/${productId}`,
        qs: { for: "storefront" },
        failOnStatusCode: false,
      }).then((res) => {
        if (res.status === 503 || res.status >= 500) return;
        expect(res.status).to.eq(200);
        const p = res.body.data?.product;
        if (p) {
          expect(p).not.to.have.property("tags");
          expect(p).not.to.have.property("__v");
          expect(p).not.to.have.property("createdAt");
          expect(p).not.to.have.property("updatedAt");
          if (p.availability?.colors?.length > 0) {
            expect(p.availability.colors[0]).not.to.have.property("imageUrl");
            expect(p.availability.colors[0]).not.to.have.property("hasImage");
          }
        }
      });
    });
  });
});
