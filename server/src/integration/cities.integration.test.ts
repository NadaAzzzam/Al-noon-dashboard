import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { City } from "../models/City.js";

describe("Cities API (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    const loginRes = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "admin@localhost", password: "admin123" });
    authToken = loginRes.body?.data?.token ?? loginRes.body?.token ?? "";
  });

  it("POST /api/cities creates city and persists to DB", async () => {
    const nameEn = `TestCity${Date.now()}`;
    const nameAr = "مدينة تجريبية";
    const deliveryFee = 25;
    const res = await request(app)
      .post("/api/cities")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ nameEn, nameAr, deliveryFee });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.city).toBeDefined();

    const saved = await City.findOne({ "name.en": nameEn });
    expect(saved).toBeTruthy();
    expect(saved!.name.en).toBe(nameEn);
    expect(saved!.name.ar).toBe(nameAr);
    expect(saved!.deliveryFee).toBe(deliveryFee);
  });

  it("PUT /api/cities/:id updates city and persists to DB", async () => {
    const city = await City.findOne() ?? (await City.create({ name: { en: "UpdateCity", ar: "تحديث" }, deliveryFee: 0 }));
    const cityId = city._id.toString();
    const updatedEn = `UpdatedCity${Date.now()}`;
    const updatedAr = "مدينة محدثة";
    const updatedFee = 40;

    const res = await request(app)
      .put(`/api/cities/${cityId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ nameEn: updatedEn, nameAr: updatedAr, deliveryFee: updatedFee });
    expect(res.status).toBe(200);

    const saved = await City.findById(cityId);
    expect(saved).toBeTruthy();
    expect(saved!.name.en).toBe(updatedEn);
    expect(saved!.name.ar).toBe(updatedAr);
    expect(saved!.deliveryFee).toBe(updatedFee);
  });
});
