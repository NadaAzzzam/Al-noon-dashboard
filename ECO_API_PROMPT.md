# E-commerce Home Page – API Integration Prompt

Use this prompt in your **e-commerce storefront project** so the frontend consumes the dashboard API correctly for the home page.

---

## Single home page API

**GET** `/store/home`

Returns **one** object `data.home` with every section needed for the home page. No need to call `/store` and `/products` separately.

### Response shape: `data.home`

| Field | Description |
|-------|-------------|
| `store` | `{ storeName, logo, quickLinks, socialLinks, newsletterEnabled }` – header/footer/newsletter |
| `hero` | `{ images[] (up to 3), videos[], title, subtitle, ctaLabel, ctaUrl }` |
| `heroEnabled` | boolean – whether to show hero |
| `newArrivals` | **Array of products** – each has `viewImage`, `hoverImage?`, `video?`, plus `_id`, `name`, `price`, `discountPrice`, `category`, etc. |
| `homeCollections` | `{ title: { en, ar }, image, video?, url, order }[]` – show video if set, else image |
| `feedbackSectionEnabled` | boolean |
| `feedbackDisplayLimit` | number |
| `feedbacks` | testimonials array |
| `announcementBar` | `{ text, enabled, backgroundColor }` |
| `promoBanner` | `{ enabled, image, title, subtitle, ctaLabel, ctaUrl }` |

### Product object (in `newArrivals` and in **all** product APIs)

Every product in list/detail/home responses includes:

- **`viewImage`** (string) – main image to show (required).
- **`hoverImage`** (string, optional) – image to show on hover; omit or keep main if not set.
- **`video`** (string, optional) – optional video URL.

Use `viewImage` as the default product image, `hoverImage` when the user hovers, and `video` if you show a product video.

---

## Prompt for E-commerce Project

```
Our storefront home page should use a single API.

**GET** `/store/home` – returns `data.home` with all sections:

- **store** – storeName, logo, quickLinks, socialLinks, newsletterEnabled (header/footer/newsletter).
- **hero** – hero.images (up to 3 URLs for slider), hero.title, hero.subtitle, hero.ctaLabel, hero.ctaUrl. Respect heroEnabled.
- **newArrivals** – array of products. Each product has **viewImage** (main image), **hoverImage** (optional, show on hover), **video** (optional). Plus _id, name, price, discountPrice, category, etc.
- **homeCollections** – each item has title, image, optional **video**, url. Show video if set, else image.
- **feedbackSectionEnabled**, **feedbackDisplayLimit**, **feedbacks** – testimonials section.
- **announcementBar**, **promoBanner** – optional top bars.

Product objects everywhere (home newArrivals, GET /products, GET /products/:id) always have **viewImage**, **hoverImage** (optional), **video** (optional). Use viewImage by default and hoverImage on hover.
```

---

## Quick reference

| Feature | Source | Usage |
|--------|--------|--------|
| **Full home** | **GET /store/home** → **data.home** | One request for all sections. |
| Hero | `data.home.hero.images` | Up to 3 URLs; hero slider. |
| New Arrivals | `data.home.newArrivals` | Products with viewImage, hoverImage?, video?. |
| Collections | `data.home.homeCollections` | Per item: show video if set, else image. |
| Testimonials | `data.home.feedbacks` | When feedbackSectionEnabled is true. |
| Product shape | Any product API | viewImage (required), hoverImage? (optional), video? (optional). |

Use this prompt in your e-commerce repo so the home page matches the dashboard API contract above.
