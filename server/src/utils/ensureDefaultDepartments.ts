import { isDbConnected } from "../config/db.js";
import { Department } from "../models/Department.js";
import { logger } from "./logger.js";

const DEFAULT_DEPARTMENTS = [
  { key: "MARKETING", name: "Marketing", description: "Marketing team, content and campaigns" },
  { key: "ADMIN", name: "Admin", description: "Administration and full access" },
];

export async function ensureDefaultDepartments(): Promise<void> {
  if (!isDbConnected()) {
    logger.warn("Skipping default departments initialization because database is not connected");
    return;
  }

  for (const def of DEFAULT_DEPARTMENTS) {
    const existing = await Department.findOne({ key: def.key });
    if (!existing) {
      await Department.create({
        key: def.key,
        name: def.name,
        description: def.description,
        status: "ACTIVE",
      });
      logger.info({ departmentKey: def.key }, "Created default department");
    }
  }
}
