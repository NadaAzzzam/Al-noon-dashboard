# Seed videos (optional)

Place a file named **product-sample.mp4** in this folder to use your own sample video for seeding.

- If `product-sample.mp4` exists here, the seeder copies it to `uploads/products/videos/` and uses it for all product and hero/section videos (no external HTTP links).
- If this file is missing, the seeder will try to download a small sample MP4 once and save it under `uploads/products/videos/`.

All product detail pages will then have **6 local images** and **1 local video** for testing, with no redundant or external media links.
