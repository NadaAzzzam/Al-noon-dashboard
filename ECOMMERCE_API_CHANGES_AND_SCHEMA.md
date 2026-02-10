# Backend Changes & E-commerce API Schema (Send to E-commerce Website)

Use this document in your **e-commerce storefront project** so the frontend stays in sync with the dashboard API. **No breaking changes:** all request/response shapes and property names are unchanged.

---

## 1. Backend changes (no action required on storefront)

The dashboard API was updated for production readiness. **Existing API contracts are unchanged.**

| Change                 | What it is                                                                                                 | Impact on e-commerce                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Config validation**  | Environment variables validated at startup (Zod).                                                          | None. Same base URL and behavior.                                                                      |
| **Structured logging** | Server uses Pino instead of console.                                                                       | None.                                                                                                  |
| **Request ID**         | Each response includes header `X-Request-Id` (same as request if client sends it).                         | Optional: send `X-Request-Id` on requests and use the same value from responses for support/debugging. |
| **Rate limiting**      | In production, API and auth endpoints are rate-limited (e.g. 100 req/15 min general, 10/15 min for login). | If you get HTTP 429, retry with backoff. Avoid burst traffic; normal usage is fine.                    |
| **Graceful shutdown**  | Server closes connections cleanly on deploy.                                                               | None.                                                                                                  |
| **Auth service layer** | Login/register logic moved to an internal service.                                                         | None. Request/response for auth are unchanged.                                                         |

**Summary for e-commerce:**

- **No schema or prop renames.**
- **No changes to request bodies, query params, or response JSON shapes.**
- Optional: use **X-Request-Id** for tracing when talking to support.

---

## 2. Optional: Request ID (for support/debugging)

- **Request:** You may send header `X-Request-Id: <your-uuid>` on any API request.
- **Response:** The API always sets `X-Request-Id` on the response (echoes yours or generates one).
- Use the same value in logs or when reporting issues so the backend team can find the request.

---

## 3. API response schemas (unchanged)

### Success response (all successful endpoints)

```json
{
  "success": true,
  "data": { ... },
  "message": "<optional translated message>",
  "pagination": { "total", "page", "limit", "totalPages" },
  "appliedFilters": { ... }
}
```

- `data`: always present for 200/201 (except 204 No Content).
- `pagination`: only on list endpoints.
- `appliedFilters`: only on list endpoints that support filters.

### Error response (unchanged)

```json
{
  "success": false,
  "message": "<translated message>",
  "code": "<i18n key e.g. errors.common.not_found>",
  "data": null,
  "details": "<optional validation/details>"
}
```

- Use `code` for stable error handling; `message` is human-readable (and locale-dependent if you send `Accept-Language` / `x-language`).

### Rate limit (new scenario in production)

- **Status:** `429 Too Many Requests`
- **Body:** same error shape as above (e.g. `code` for rate limit).
- **Action:** back off and retry after the `Retry-After` header (if present) or after a short delay.

---

## 4. Single home page API (unchanged)

**GET** `/api/store/home` (or `/store/home` depending on your base URL)

Returns one object `data.home` with every section needed for the home page.

### Response shape: `data.home`

| Field                    | Description                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `store`                  | `{ storeName, logo, quickLinks, socialLinks, newsletterEnabled }` – header/footer/newsletter                                          |
| `hero`                   | `{ images[] (up to 3), videos[], title, subtitle, ctaLabel, ctaUrl }`                                                                 |
| `heroEnabled`            | boolean – whether to show hero                                                                                                        |
| `newArrivals`            | **Array of products** – each has `viewImage`, `hoverImage?`, `video?`, plus `_id`, `name`, `price`, `discountPrice`, `category`, etc. |
| `homeCollections`        | `{ title: { en, ar }, image, video?, url, order }[]` – show video if set, else image                                                  |
| `feedbackSectionEnabled` | boolean                                                                                                                               |
| `feedbackDisplayLimit`   | number                                                                                                                                |
| `feedbacks`              | testimonials array                                                                                                                    |
| `announcementBar`        | `{ text, enabled, backgroundColor }`                                                                                                  |
| `promoBanner`            | `{ enabled, image, title, subtitle, ctaLabel, ctaUrl }`                                                                               |

### Product object (in `newArrivals` and in all product APIs)

- **`viewImage`** (string) – main image (required).
- **`hoverImage`** (string, optional) – image on hover.
- **`video`** (string, optional) – optional video URL.

Use `viewImage` by default, `hoverImage` on hover, and `video` when showing product video.

---

## 5. Prompt to paste into the e-commerce project

```
Our storefront talks to the Al-Noon dashboard API. Backend was updated for production; no API contract or schema changes.

- **Success:** { success: true, data?, message?, pagination?, appliedFilters? }
- **Error:** { success: false, message, code, data: null, details? }
- **Rate limit:** 429 in production; back off and retry. Optional: send X-Request-Id for support.

Home page: GET /store/home (or /api/store/home) → data.home with store, hero, newArrivals, homeCollections, feedbacks, announcementBar, promoBanner.

Product shape everywhere: viewImage (required), hoverImage? (optional), video? (optional), plus _id, name, price, discountPrice, category, etc.
```

---

## 6. Quick reference (unchanged)

| Feature       | Source                      | Usage                                         |
| ------------- | --------------------------- | --------------------------------------------- |
| **Full home** | GET /store/home → data.home | One request for all sections.                 |
| Hero          | data.home.hero.images       | Up to 3 URLs; hero slider.                    |
| New Arrivals  | data.home.newArrivals       | Products with viewImage, hoverImage?, video?. |
| Collections   | data.home.homeCollections   | Per item: video if set, else image.           |
| Testimonials  | data.home.feedbacks         | When feedbackSectionEnabled is true.          |
| Product shape | Any product API             | viewImage (required), hoverImage?, video?.    |

No prop renames or schema changes. Optional: use X-Request-Id and handle 429 with retry.
