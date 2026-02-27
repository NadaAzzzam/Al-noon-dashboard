# Testing Audit & Recommendations

This document audits test coverage for **products**, **orders**, and **checkout** features, identifies gaps, redundancies, and provides recommendations.

---

## 1. Field Coverage Summary

### Product Schema (create/update)

| Field | Type | Tested | Notes |
|-------|------|--------|-------|
| nameEn | required | ✅ | Rejects empty |
| nameAr | required | ✅ | Rejects empty |
| price | required positive | ✅ | Rejects 0, negative |
| stock | required int nonnegative | ✅ | Rejects negative, non-integer |
| category | required | ✅ | Rejects empty |
| discountPrice | optional positive | ✅ | Rejects 0, negative; accepts positive |
| costPerItem | optional positive | ✅ | Rejects 0, negative; accepts positive |
| status | optional enum | ✅ | ACTIVE, INACTIVE, DRAFT |
| isNewArrival | optional boolean | ✅ | In optional media/localized blocks |
| images, viewImage, hoverImage, imageColors | optional | ✅ | Accepts |
| videos | optional | ✅ | Accepts |
| defaultMediaType, hoverMediaType | optional enum | ✅ | Accepts; rejects invalid |
| detailsEn/Ar, stylingTipEn/Ar | optional | ✅ | Accepts |
| sizes, sizeDescriptions, colors | optional | ✅ | Accepts |
| slug | optional regex | ✅ | Valid format, invalid format |
| tags, vendor | optional | ✅ | Accepts |
| metaTitleEn/Ar, metaDescriptionEn/Ar | optional | ✅ | Accepts |
| weight, weightUnit | optional | ✅ | Accepts; rejects invalid weightUnit |

### Product Query Schema

| Field | Tested | Notes |
|-------|--------|------|
| page, limit | ✅ | Defaults, limit 100, limit > 100 |
| search, status, category | ✅ | |
| newArrival | ✅ | true, false |
| availability | ✅ | inStock, outOfStock, all; rejects invalid |
| color, minPrice, maxPrice | ✅ | minPrice negative rejected |
| sort, minRating, tags, vendor, hasDiscount | ✅ | minRating 0, 6 rejected |

### Order Schema

| Field | Tested | Notes |
|-------|--------|------|
| items (product, quantity, price) | ✅ | Empty, invalid product, zero qty, negative price, non-int qty |
| paymentMethod | ✅ | COD, INSTAPAY |
| shippingAddress | ✅ | String, structured; empty address/city rejected |
| deliveryFee | ✅ | Accepts, rejects negative |
| guestName, guestEmail, guestPhone | ✅ | Invalid email rejected |
| firstName, lastName, email, phone | ✅ | Invalid email rejected |
| billingAddress, specialInstructions, shippingMethod | ✅ | Accepts |
| emailNews, textNews | ✅ | Accepts |

### Inventory & Payments Validators

| Schema | Fields | Tested |
|--------|--------|--------|
| stockUpdateSchema | params.id, body.stock | ✅ |
| paymentProofSchema | params.id, body.instaPayProofUrl | ✅ |
| paymentConfirmSchema | params.id, body.approved | ✅ |

---

## 2. Removed / Consolidated Tests

| Removed | Reason |
|---------|--------|
| Duplicate "accepts valid status values" loop | Merged into single test with all 3 statuses |
| Separate "accepts COD" and "accepts INSTAPAY" | Combined into one test |
| Redundant "accepts product with optional fields" | Split into focused tests per field group |
| Overly generic "accepts valid filters" | Expanded to cover each filter field explicitly |

---

## 3. Recommendations

### Implemented (admin perspective)

1. **discountPrice < price** — Added `.refine()` to product schema; rejects when discountPrice >= price.
2. **mongodb-memory-server** — Integration tests in `server/src/integration/` use in-memory MongoDB. Run: `cd server && npm run test:integration`.
3. **Seed test data before E2E** — Root `npm run test:e2e` runs `seed:test` first (admin, category, product, order). Requires MongoDB running.

### Add (not yet implemented)

1. **E2E: Storefront checkout**
   - The admin dashboard does not host the storefront checkout UI. If a separate storefront app exists, add Cypress tests for:
     - Add to cart → checkout → guest info → place order
     - Logged-in checkout (contact pre-filled)

2. **API integration tests with real DB**
   - Current API tests run against `createApp()` without MongoDB. Consider:
     - `mongodb-memory-server` for full create/read/update flows
     - Or document that API tests are "validation-only" and require running server for full E2E

3. **Frontend: formatPriceEGP edge cases** (optional)
   - Already tested. Consider: very large numbers, NaN handling if applicable.

4. **Order controller business logic** (requires DB)
   - `createOrder` guest vs logged-in branching
   - `updateOrderStatus` stock decrement on CONFIRMED
   - `cancelOrder` stock restore when was CONFIRMED
   - These require DB/integration tests.

### Remove (if applicable)

1. **api.test.ts: hasPermission with "products:read"**
   - Backend uses `products.view`, `products.manage`. The test uses `products:read` as a generic example—acceptable for unit testing the helper. No change needed unless you want to align with exact permission keys.

2. **E2E tests that skip when no data**
   - Tests like "can open order detail when orders exist" use conditional logic. Consider:
     - **Option A:** Seed test data before E2E run so orders always exist.
     - **Option B:** Keep conditional; document that some tests only run when DB has data.

### Handle / Improve

1. **productSchema: discountPrice < price**
   - Schema does not enforce `discountPrice < price`. Business rule is in controller. Consider:
     - Adding `.refine()` in schema, or
     - Documenting that controller must validate.

2. **orderSchema: guest vs logged-in**
   - Schema allows both guest fields and new fields. Controller enforces: guest requires guestName+guestEmail (or firstName+lastName+email). Schema cannot express "either guest OR logged-in" without `.superRefine()`. Current approach is acceptable; controller handles it.

3. **structuredAddressSchema: city as ObjectId**
   - Backend resolves `city` when it's an ObjectId string. Schema accepts any non-empty string. Consider documenting that `city` can be city name or city `_id`.

4. **Vitest config**
   - `server/vitest.config.ts` includes `src/**/*.test.ts` — inventory and payments tests are picked up. ✅

---

## 4. Test File Map

| File | Purpose |
|------|---------|
| `server/src/validators/products.test.ts` | Product schema, params, query, status |
| `server/src/validators/orders.test.ts` | Order schema, status, params, query |
| `server/src/validators/inventory.test.ts` | Stock update schema |
| `server/src/validators/payments.test.ts` | Payment proof & confirm schemas |
| `server/src/validators/auth.test.ts` | Auth login/register |
| `server/src/utils/response.test.ts` | Response helpers |
| `server/src/utils/richTextFormatter.test.ts` | Rich text parse/serialize |
| `server/src/routes/products.test.ts` | Products API |
| `server/src/routes/orders.test.ts` | Orders API validation & auth |
| `server/src/routes/checkout.test.ts` | Checkout & shipping API |
| `admin-dashboard/src/utils/format.test.ts` | formatPriceEGP |
| `admin-dashboard/src/utils/orderUtils.test.ts` | daysSinceOrder, isLongWait |
| `admin-dashboard/src/services/api.test.ts` | API helpers |
| `admin-dashboard/src/services/products.test.ts` | Product helpers |
| `admin-dashboard/cypress/e2e/*.cy.ts` | E2E flows |

---

## 5. Running Tests

```bash
# Backend (unit + API validation)
cd server && npm run test

# Backend integration (with in-memory MongoDB)
cd server && npm run test:integration

# Frontend
cd admin-dashboard && npm run test

# E2E (seeds test data, then runs Cypress; backend + admin + MongoDB must be running)
npm run test:e2e
# Or from admin-dashboard: npm run test:e2e (no seed)

# E2E against production build (no backend; login-form tests pass, login-flow tests need backend)
cd admin-dashboard && npm run test:e2e:ci
```

### Troubleshooting

**Backend: `ERR_MODULE_NOT_FOUND` for vitest**
- Stop all dev servers (they lock `node_modules`)
- Run `cd server && rm -rf node_modules && npm install` (or on Windows: `Remove-Item -Recurse node_modules; npm install`)
- Retry `npm run test`

**Cypress: "Cypress executable not found"**
- Run `cd admin-dashboard && npx cypress install` (downloads ~400MB binary; may take a few minutes)
- Then run `npm run test:e2e`

**Cypress: npm EBUSY during install**
- Stop dev servers first, then run `npm install` or `npx cypress install`

**Cypress: blank page / login form not found**
- Use production build: `cd admin-dashboard && npm run test:e2e:ci` (builds, serves preview, runs Cypress)
- For full E2E with login, ensure backend is running: `npm run dev:server` in one terminal, then `npm run test:e2e`
