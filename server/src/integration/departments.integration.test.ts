import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Department } from "../models/Department.js";

describe("Departments API (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    const loginRes = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "admin@localhost", password: "admin123" });
    authToken = loginRes.body?.data?.token ?? loginRes.body?.token ?? "";
  });

  it("POST /api/departments creates department and persists to DB", async () => {
    const name = `Integration Dept ${Date.now()}`;
    const res = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.department).toBeDefined();

    const key = name.trim().toUpperCase().replace(/\s+/g, "_");
    const saved = await Department.findOne({ key });
    expect(saved).toBeTruthy();
    expect(saved!.name).toBe(name.trim());
    expect(saved!.key).toBe(key);
  });

  it("PUT /api/departments/:id updates department and persists to DB", async () => {
    const existing = await Department.findOne();
    if (!existing) return;
    const deptId = existing._id.toString();
    const updatedName = `Updated Dept ${Date.now()}`;

    const res = await request(app)
      .put(`/api/departments/${deptId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: updatedName });
    expect(res.status).toBe(200);

    const saved = await Department.findById(deptId);
    expect(saved).toBeTruthy();
    expect(saved!.name).toBe(updatedName.trim());
  });
});
