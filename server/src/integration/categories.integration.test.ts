import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Category } from "../models/Category.js";

describe("Categories API (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    const loginRes = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "admin@localhost", password: "admin123" });
    authToken = loginRes.body?.data?.token ?? loginRes.body?.token ?? "";
  });

  it("POST /api/categories creates category and persists to DB", async () => {
    const nameEn = `Integration Test Cat ${Date.now()}`;
    const nameAr = "فئة تجريبية";
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ nameEn, nameAr });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.category).toBeDefined();

    const saved = await Category.findOne({ "name.en": nameEn });
    expect(saved).toBeTruthy();
    expect(saved!.name.en).toBe(nameEn);
    expect(saved!.name.ar).toBe(nameAr);
  });

  it("PUT /api/categories/:id updates category and persists to DB", async () => {
    const cat = await Category.findOne() ?? (await Category.create({ name: { en: "Update Test", ar: "تحديث" }, status: "visible" }));
    const catId = cat._id.toString();
    const updatedEn = `Updated Cat ${Date.now()}`;
    const updatedAr = "فئة محدثة";

    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ nameEn: updatedEn, nameAr: updatedAr });
    expect(res.status).toBe(200);

    const saved = await Category.findById(catId);
    expect(saved).toBeTruthy();
    expect(saved!.name.en).toBe(updatedEn);
    expect(saved!.name.ar).toBe(updatedAr);
  });
});
