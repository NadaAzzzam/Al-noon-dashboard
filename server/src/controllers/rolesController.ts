import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { ApiError } from "../utils/apiError.js";
import { Permission, Role, RolePermission } from "../models/Role.js";

export const listRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ createdAt: 1 }).lean();
  const roleIds = roles.map((r) => (r as { _id: unknown })._id);
  const rolePerms = await RolePermission.find({ roleId: { $in: roleIds } }).lean<{ roleId: unknown; permissionId: unknown }[]>();

  const permIdsByRole = new Map<string, unknown[]>();
  for (const rp of rolePerms) {
    const key = String(rp.roleId);
    const list = permIdsByRole.get(key) ?? [];
    list.push(rp.permissionId);
    permIdsByRole.set(key, list);
  }

  sendResponse(res, req.locale, {
    data: {
      roles: roles.map((r) => {
        const id = (r as { _id: unknown })._id;
        const key = String(id);
        const permIds = permIdsByRole.get(key) ?? [];
        return {
          id,
          name: (r as { name: string }).name,
          key: (r as { key: string }).key,
          status: (r as { status?: string }).status ?? "ACTIVE",
          description: (r as { description?: string }).description,
          permissionIds: permIds,
          permissionsCount: permIds.length,
          createdAt: (r as { createdAt: Date }).createdAt,
          updatedAt: (r as { updatedAt: Date }).updatedAt,
        };
      }),
    },
  });
});

export const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id).lean();
  if (!role) {
    throw new ApiError(404, "Role not found", { code: "errors.roles.not_found" });
  }
  const permLinks = await RolePermission.find({ roleId: (role as { _id: unknown })._id }).lean<{
    permissionId: unknown;
  }[]>();
  const permissionIds = permLinks.map((p) => p.permissionId);
  sendResponse(res, req.locale, {
    data: {
      role: {
        id: (role as { _id: unknown })._id,
        name: (role as { name: string }).name,
        key: (role as { key: string }).key,
        status: (role as { status?: string }).status ?? "ACTIVE",
        description: (role as { description?: string }).description,
        permissionIds,
        permissionsCount: permissionIds.length,
        createdAt: (role as { createdAt: Date }).createdAt,
        updatedAt: (role as { updatedAt: Date }).updatedAt,
      },
    },
  });
});

export const createRole = asyncHandler(async (req, res) => {
  const { name, key, description, permissionIds } = req.body as {
    name?: string;
    key?: string;
    description?: string;
    permissionIds?: string[];
  };

  if (!name || !key) {
    throw new ApiError(400, "Missing name or key", { code: "errors.roles.invalid_input" });
  }

  const existing = await Role.findOne({ key });
  if (existing) {
    throw new ApiError(409, "Role key already exists", { code: "errors.roles.duplicate_key" });
  }

  const role = await Role.create({
    name: name.trim(),
    key: key.trim(),
    description: description?.trim() || undefined,
    status: "ACTIVE",
  });

  const uniquePermissionIds = Array.from(new Set(permissionIds ?? []));
  if (uniquePermissionIds.length > 0) {
    const perms = await Permission.find({ _id: { $in: uniquePermissionIds } }).lean<{ _id: unknown }[]>();
    const validIds = new Set(perms.map((p) => String(p._id)));
    for (const pid of uniquePermissionIds) {
      if (!validIds.has(String(pid))) continue;
      await RolePermission.updateOne(
        { roleId: role._id, permissionId: pid },
        { $setOnInsert: { roleId: role._id, permissionId: pid } },
        { upsert: true }
      );
    }
  }

  const links = await RolePermission.find({ roleId: role._id }).lean<{ permissionId: unknown }[]>();
  const ids = links.map((l) => l.permissionId);

  sendResponse(res, req.locale, {
    status: 201,
    message: "success.roles.created",
    data: {
      role: {
        id: role.id,
        name: role.name,
        key: role.key,
        status: role.status,
        description: role.description,
        permissionIds: ids,
        permissionsCount: ids.length,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    },
  });
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { name, description, permissionIds, status } = req.body as {
    name?: string;
    description?: string;
    permissionIds?: string[];
    status?: "ACTIVE" | "INACTIVE";
  };

  const role = await Role.findById(id);
  if (!role) {
    throw new ApiError(404, "Role not found", { code: "errors.roles.not_found" });
  }

  if (typeof name === "string" && name.trim()) {
    role.name = name.trim();
  }
  if (typeof description === "string") {
    role.description = description.trim() || undefined;
  }
  if (status === "ACTIVE" || status === "INACTIVE") {
    role.status = status;
  }
  await role.save();

  if (Array.isArray(permissionIds)) {
    await RolePermission.deleteMany({ roleId: role._id });
    const uniquePermissionIds = Array.from(new Set(permissionIds));
    if (uniquePermissionIds.length > 0) {
      const perms = await Permission.find({ _id: { $in: uniquePermissionIds } }).lean<{ _id: unknown }[]>();
      const validIds = new Set(perms.map((p) => String(p._id)));
      for (const pid of uniquePermissionIds) {
        if (!validIds.has(String(pid))) continue;
        await RolePermission.updateOne(
          { roleId: role._id, permissionId: pid },
          { $setOnInsert: { roleId: role._id, permissionId: pid } },
          { upsert: true }
        );
      }
    }
  }

  const links = await RolePermission.find({ roleId: role._id }).lean<{ permissionId: unknown }[]>();
  const ids = links.map((l) => l.permissionId);

  sendResponse(res, req.locale, {
    message: "success.roles.updated",
    data: {
      role: {
        id: role.id,
        name: role.name,
        key: role.key,
        status: role.status,
        description: role.description,
        permissionIds: ids,
        permissionsCount: ids.length,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    },
  });
});

export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const role = await Role.findById(id);
  if (!role) {
    throw new ApiError(404, "Role not found", { code: "errors.roles.not_found" });
  }
  if (role.key === "ADMIN") {
    throw new ApiError(400, "Cannot delete ADMIN role", { code: "errors.roles.cannot_delete_admin" });
  }
  await RolePermission.deleteMany({ roleId: role._id });
  await role.deleteOne();
  sendResponse(res, req.locale, { status: 204 });
});

export const listPermissionDefinitions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find().sort({ group: 1, name: 1 }).lean();
  sendResponse(res, req.locale, {
    data: {
      permissions: permissions.map((p) => ({
        id: (p as { _id: unknown })._id,
        key: (p as { key: string }).key,
        label: (p as { name: string }).name,
        group: (p as { group: string }).group,
        description: (p as { description?: string }).description,
      })),
    },
  });
});

