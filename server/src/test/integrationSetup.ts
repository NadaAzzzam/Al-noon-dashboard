import { beforeAll, afterAll } from "vitest";
import { startTestDb, stopTestDb } from "./mongoSetup.js";

beforeAll(async () => {
  await startTestDb();
}, 15000);

afterAll(async () => {
  await stopTestDb();
});
