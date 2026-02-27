import { Order } from "../models/Order.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { env } from "../config/env.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

/** Admin users only (role !== "USER"). Used for Users page. */
export const listUsers = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { users: [] } });
  }
  const users = await User.find({ role: { $ne: "USER" } })
    .select("name email role department avatar createdAt")
    .populate<{ department?: { _id: unknown; name: string; key: string } }>("department", "name key")
    .sort({ createdAt: -1 })
    .lean();
  const superAdminEmail = env.adminEmail?.toLowerCase() ?? "";
  sendResponse(res, req.locale, {
    data: {
      users: users.map((u) => {
        const dep = (u as { department?: { _id: unknown; name: string; key: string } }).department;
        const email = (u as { email: string }).email?.toLowerCase() ?? "";
        return {
          id: (u as { _id: unknown })._id,
          name: (u as { name: string }).name,
          email: (u as { email: string }).email,
          role: (u as { role: string }).role,
          departmentId: dep?._id ?? null,
          departmentName: dep?.name ?? null,
          departmentKey: dep?.key ?? null,
          avatar: (u as { avatar?: string }).avatar,
          createdAt: (u as { createdAt: Date }).createdAt,
          isSuperAdmin: email === superAdminEmail
        };
      })
    }
  });
});

/** Storefront customers only (role === "USER"). Used for Customers page. */
export const listCustomers = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { customers: [] } });
  }
  const users = await User.find({ role: "USER" })
    .select("name email role avatar createdAt")
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, req.locale, {
    data: {
      customers: users.map((u) => ({
        id: (u as { _id: unknown })._id,
        name: (u as { name: string }).name,
        email: (u as { email: string }).email,
        role: (u as { role: string }).role,
        avatar: (u as { avatar?: string }).avatar,
        createdAt: (u as { createdAt: Date }).createdAt
      }))
    }
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const user = await User.findById(req.params.id)
    .select("name email role department avatar createdAt updatedAt")
    .populate<{ department?: { _id: unknown; name: string; key: string } }>("department", "name key")
    .lean();
  if (!user) {
    throw new ApiError(404, "Customer not found", { code: "errors.user.customer_not_found" });
  }
  if ((user as { role: string }).role !== "USER") {
    throw new ApiError(404, "Customer not found", { code: "errors.user.customer_not_found" });
  }
  const dep = (user as { department?: { _id: unknown; name: string; key: string } }).department;
  sendResponse(res, req.locale, {
    data: {
      customer: {
        id: (user as { _id: unknown })._id,
        name: (user as { name: string }).name,
        email: (user as { email: string }).email,
        role: (user as { role: string }).role,
        departmentId: dep?._id ?? null,
        departmentName: dep?.name ?? null,
        departmentKey: dep?.key ?? null,
        avatar: (user as { avatar?: string }).avatar,
        createdAt: (user as { createdAt: Date }).createdAt,
        updatedAt: (user as { updatedAt?: Date }).updatedAt
      }
    }
  });
});

export const getCustomerOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const orders = await Order.find({ user: req.params.id })
    .populate("items.product", "name price")
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, req.locale, { data: { orders } });
});

export const listRoleOptions = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { roles: [] } });
  }
  const roles = await Role.find({ status: "ACTIVE" })
    .select("key name")
    .sort({ name: 1 })
    .lean();
  sendResponse(res, req.locale, {
    data: {
      roles: roles.map((r) => ({
        id: (r as { _id: unknown })._id,
        key: (r as { key: string }).key,
        name: (r as { name: string }).name,
      })),
    },
  });
});

export const listDepartmentOptions = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, { data: { departments: [] } });
  }
  const departments = await Department.find({ status: "ACTIVE" })
    .select("key name")
    .sort({ name: 1 })
    .lean();
  sendResponse(res, req.locale, {
    data: {
      departments: departments.map((d) => ({
        id: (d as { _id: unknown })._id,
        key: (d as { key: string }).key,
        name: (d as { name: string }).name,
      })),
    },
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const { id } = req.params;
  const { role } = req.body;
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found", { code: "errors.user.not_found" });
  }
  const superAdminEmail = env.adminEmail?.toLowerCase() ?? "";
  if (user.email?.toLowerCase() === superAdminEmail) {
    throw new ApiError(403, "Cannot modify Super Admin", { code: "errors.user.cannot_modify_super_admin" });
  }
  const roleDoc = await Role.findOne({ key: role, status: "ACTIVE" }).lean();
  if (!roleDoc) {
    throw new ApiError(400, "Invalid or inactive role", { code: "errors.user.invalid_role" });
  }
  user.role = role;
  await user.save();
  sendResponse(res, req.locale, {
    message: "success.user.role_updated",
    data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  });
});

export const createUser = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const { name, email, password, role, departmentId } = req.body as {
    name: string;
    email: string;
    password: string;
    role: string;
    departmentId?: string;
  };

  const roleDoc = await Role.findOne({ key: role, status: "ACTIVE" }).lean();
  if (!roleDoc) {
    throw new ApiError(400, "Invalid or inactive role", { code: "errors.user.invalid_role" });
  }

  const lowerEmail = email.trim().toLowerCase();
  const superAdminEmail = env.adminEmail?.toLowerCase() ?? "";
  if (lowerEmail === superAdminEmail) {
    throw new ApiError(403, "Cannot create user with Super Admin email", { code: "errors.user.cannot_use_super_admin_email" });
  }
  const existing = await User.findOne({ email: lowerEmail });
  if (existing) {
    throw new ApiError(409, "Email already in use", { code: "errors.user.email_exists" });
  }

  const userData: { name: string; email: string; password: string; role: string; department?: unknown } = {
    name: name.trim(),
    email: lowerEmail,
    password,
    role,
  };
  if (departmentId && departmentId.trim()) {
    const dept = await Department.findById(departmentId).lean();
    if (dept) userData.department = dept._id;
  }

  const user = await User.create(userData);
  const populated = await User.findById(user._id)
    .select("name email role department avatar createdAt")
    .populate<{ department?: { _id: unknown; name: string; key: string } }>("department", "name key")
    .lean();

  const dep = populated?.department as { _id: unknown; name: string; key: string } | undefined;
  sendResponse(res, req.locale, {
    status: 201,
    message: "success.user.created",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: dep?._id ?? null,
        departmentName: dep?.name ?? null,
        departmentKey: dep?.key ?? null,
        createdAt: user.createdAt,
      },
    },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const { id } = req.params;
  const { name, email, password, role, departmentId } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    departmentId?: string | null;
  };

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found", { code: "errors.user.not_found" });
  }
  const superAdminEmail = env.adminEmail?.toLowerCase() ?? "";
  if (user.email?.toLowerCase() === superAdminEmail) {
    throw new ApiError(403, "Cannot modify Super Admin", { code: "errors.user.cannot_modify_super_admin" });
  }

  if (role != null) {
    const roleDoc = await Role.findOne({ key: role, status: "ACTIVE" }).lean();
    if (!roleDoc) {
      throw new ApiError(400, "Invalid or inactive role", { code: "errors.user.invalid_role" });
    }
    user.role = role;
  }
  if (name != null) user.name = name.trim();
  if (email != null) {
    const lower = email.trim().toLowerCase();
    if (lower !== user.email) {
      const existing = await User.findOne({ email: lower });
      if (existing) {
        throw new ApiError(409, "Email already in use", { code: "errors.user.email_exists" });
      }
      user.email = lower;
    }
  }
  if (password != null && password.trim().length >= 6) {
    user.password = password;
  }
  if (departmentId !== undefined) {
    if (departmentId && departmentId.trim()) {
      const dept = await Department.findById(departmentId).lean();
      user.department = dept?._id ?? undefined;
    } else {
      user.set("department", undefined);
    }
  }

  await user.save();

  const populated = await User.findById(user._id)
    .select("name email role department avatar createdAt")
    .populate<{ department?: { _id: unknown; name: string; key: string } }>("department", "name key")
    .lean();

  const dep = populated?.department as { _id: unknown; name: string; key: string } | undefined;
  sendResponse(res, req.locale, {
    message: "success.user.updated",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: dep?._id ?? null,
        departmentName: dep?.name ?? null,
        departmentKey: dep?.key ?? null,
        createdAt: user.createdAt,
      },
    },
  });
});
