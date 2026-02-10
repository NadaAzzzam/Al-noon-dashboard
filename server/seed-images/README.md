# Seed images (local only)

Place your **local** product and hero images here. The seed script copies them into `uploads/products` and uses **no external image links**.

## Default vs hover images

Products and home collections use **two images** each:

- **Default** – shown by default (e.g. product card, collection tile).
- **Hover** – shown on hover (e.g. when the user hovers the card).

The seeder expects **pairs** of files. If you only add the first file of a pair (e.g. `abaya1.jpg`), the seed script will **copy it as the second** (e.g. `seed-abaya2.jpg`) so both default and hover URLs exist. Add both files when you want different default and hover images.

| Default (1) | Hover (2) | Used for                              |
| ----------- | --------- | ------------------------------------- |
| `abaya1`    | `abaya2`  | Abayas, home collection Abayas        |
| `cape1`     | `cape2`   | Capes, home collection Capes          |
| `hijab1`    | `hijab2`  | Hijab products, home collection Hijab |
| `scarf1`    | `scarf2`  | Niqab, Tarha                          |
| `fabric1`   | `fabric2` | Malhafa, home collection Malhafa      |
| `cardigan1` | `coat1`   | Cardigans & coats                     |
| `dress1`    | (abaya2)  | Melton Dress                          |
| `kaftan1`   | (fabric1) | Kaftan                                |

Videos for products and sections are **URLs** (configured in seed data), not files in this folder.

## Quick setup: download placeholders

From the `server` directory, run:

```bash
npm run download-seed-images
```

This downloads placeholder images (from Picsum) into this folder with the expected filenames. Then run `npm run seed` to copy them into uploads and seed the database.

## Expected filenames

Use any of these extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.

| Filename            | Role / used for                                  |
| ------------------- | ------------------------------------------------ |
| `abaya1.jpg`        | Default: abayas, home collection Abayas          |
| `abaya2.jpg`        | Hover: abayas (or copied from abaya1 if missing) |
| `cape1.jpg`         | Default: capes, home collection Capes            |
| `cape2.jpg`         | Hover: capes                                     |
| `hijab1.jpg`        | Default: hijab products, home collection Hijab   |
| `hijab2.jpg`        | Hover: hijab products                            |
| `scarf1.jpg`        | Default: scarf / niqab / tarha                   |
| `scarf2.jpg`        | Hover: scarf / niqab / tarha                     |
| `fabric1.jpg`       | Default: malhafa, home collection Malhafa        |
| `fabric2.jpg`       | Hover: malhafa                                   |
| `dress1.jpg`        | Melton Dress (default)                           |
| `coat1.jpg`         | Wool Coat; hover for cardigan                    |
| `kaftan1.jpg`       | Kaftan (default)                                 |
| `cardigan1.jpg`     | Cardigan, twin set (default)                     |
| `hero1.jpg`         | Hero slider (first)                              |
| `hero2.jpg`         | Hero slider, promo banner                        |
| `hero3.jpg`         | Hero slider                                      |
| `section1.jpg`      | New Arrivals / Our Collection sections           |
| `section2.jpg`      | Sections                                         |
| `section3.jpg`      | Sections                                         |
| `placeholder.png`   | Fallback if a file above is missing              |
| `payment-proof.png` | (Optional) InstaPay proof demo                   |

**Tip:** Copy or move images from your Downloads folder (or anywhere on your PC) into this folder with the names above. Then run `npm run seed` from the `server` directory.
