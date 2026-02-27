import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { ApiError } from "../utils/apiError.js";
import { Department } from "../models/Department.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { isDbConnected } from "../config/db.js";

export const listDepartments = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { departments: [] } });
  }
  const departments = await Department.find().sort({ name: 1 }).lean();
  sendResponse(res, req.locale, {
    data: {
      departments: departments.map((d) => ({
        id: (d as { _id: unknown })._id,
        name: (d as { name: string }).name,
        key: (d as { key: string }).key,
        description: (d as { description?: string }).description,
        status: (d as { status?: string }).status ?? "ACTIVE",
        createdAt: (d as { createdAt: Date }).createdAt,
        updatedAt: (d as { updatedAt: Date }).updatedAt,
      })),
    },
  });
});

export const getDepartment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const department = await Department.findById(req.params.id).lean();
  if (!department) {
    throw new ApiError(404, "Department not found", { code: "errors.departments.not_found" });
  }
  const deptId = (department as { _id: unknown })._id;
  const rolesInDept = await Role.find({ department: deptId }).lean<{ _id: unknown }[]>();
  const roleIds = rolesInDept.map((r) => r._id);
  sendResponse(res, req.locale, {
    data: {
      department: {
        id: deptId,
        name: (department as { name: string }).name,
        key: (department as { key: string }).key,
        status: (department as { status?: string }).status ?? "ACTIVE",
        roleIds,
        createdAt: (department as { createdAt: Date }).createdAt,
        updatedAt: (department as { updatedAt: Date }).updatedAt,
      },
    },
  });
});

export const createDepartment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const { name, roleIds } = req.body as { name?: string; roleIds?: string[] };

  if (!name || !name.trim()) {
    throw new ApiError(400, "Name is required", { code: "errors.departments.invalid_input" });
  }

  const key = name.trim().toUpperCase().replace(/\s+/g, "_") || "DEPT";
  const existing = await Department.findOne({ key });
  if (existing) {
    throw new ApiError(409, "Department with this name already exists", { code: "errors.departments.duplicate_key" });
  }

  const department = await Department.create({
    name: name.trim(),
    key,
    status: "ACTIVE",
  });

  const ids = Array.from(new Set(roleIds ?? []));
  if (ids.length > 0) {
    await Role.updateMany(
      { _id: { $in: ids } },
      { $set: { department: department._id } }
    );
  }

  sendResponse(res, req.locale, {
    status: 201,
    message: "success.departments.created",
    data: {
      department: {
        id: department.id,
        name: department.name,
        key: department.key,
        status: department.status,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
      },
    },
  });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const { name, status, roleIds } = req.body as { name?: string; status?: string; roleIds?: string[] };
  const department = await Department.findById(req.params.id);
  if (!department) {
    throw new ApiError(404, "Department not found", { code: "errors.departments.not_found" });
  }

  if (name != null) department.name = name.trim();
  if (status != null) department.status = status;

  await department.save();

  const ids = Array.from(new Set(roleIds ?? []));
  await Role.updateMany(
    { department: department._id },
    { $unset: { department: 1 } }
  );
  if (ids.length > 0) {
    await Role.updateMany(
      { _id: { $in: ids } },
      { $set: { department: department._id } }
    );
  }

  sendResponse(res, req.locale, {
    message: "success.departments.updated",
    data: {
      department: {
        id: department.id,
        name: department.name,
        key: department.key,
        status: department.status,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
      },
    },
  });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const department = await Department.findById(req.params.id);
  if (!department) {
    throw new ApiError(404, "Department not found", { code: "errors.departments.not_found" });
  }
  await Role.updateMany({ department: department._id }, { $unset: { department: 1 } });
  await User.updateMany({ department: department._id }, { $unset: { department: 1 } });
  await department.deleteOne();
  sendResponse(res, req.locale, { message: "success.departments.deleted" }, 204);
});
