import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env.js";
import { isDbConnected } from "../../config/db.js";
import { User } from "../../models/User.js";
import { PasswordReset } from "../../models/PasswordReset.js";
import { ApiError } from "../../utils/apiError.js";
import { logger } from "../../utils/logger.js";
import { ALL_PERMISSION_KEYS } from "../../config/permissions.js";
import { Permission, Role, RolePermission } from "../../models/Role.js";
import { sendMail } from "../../utils/email.js";
import { buildResetPasswordEmailHtml, getEmailBrandingFromSettings } from "../../utils/emailTemplates.js";
import { Settings } from "../../models/Settings.js";

const DEV_ADMIN_ID = "dev-admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Role key, e.g. "ADMIN", "USER", or any custom role. */
  role: string;
  /** Permission keys granted via the user's role. */
  permissions?: string[];
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

function signToken(userId: string, role: string): string {
  try {
    return jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  } catch (err) {
    logger.error({ err }, "JWT sign error");
    throw new ApiError(503, "Server misconfiguration (auth)");
  }
}

async function getPermissionsForRole(roleKey: string): Promise<string[]> {
  if (!isDbConnected()) {
    // In dev-without-db mode, treat ADMIN as full access and others as having no explicit permissions.
    return roleKey === "ADMIN" ? ALL_PERMISSION_KEYS : [];
  }
  const role = await Role.findOne({ key: roleKey }).lean<{ _id: typeof Role.prototype._id } | null>();
  if (!role) {
    return roleKey === "ADMIN" ? ALL_PERMISSION_KEYS : [];
  }

  const rolePerms = await RolePermission.find({ roleId: role._id }).lean<{ permissionId: typeof Permission.prototype._id }[]>();
  if (!rolePerms.length) {
    return roleKey === "ADMIN" ? ALL_PERMISSION_KEYS : [];
  }
  const ids = rolePerms.map((rp) => rp.permissionId);
  const perms = await Permission.find({ _id: { $in: ids } }).lean<{ key: string }[]>();
  return perms.map((p) => p.key);
}

export async function register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }
  const { name, email, password } = input;
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "User already exists", { code: "errors.auth.user_exists" });
  }
  const user = await User.create({ name, email, password });
  const permissions = await getPermissionsForRole(user.role);
  const token = signToken(user.id, user.role);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions }
  };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const { email, password } = input;

  if (email === env.adminEmail && password === env.adminPassword) {
    try {
      const token = signToken(DEV_ADMIN_ID, "ADMIN");
      const permissions = await getPermissionsForRole("ADMIN");
      return {
        token,
        user: { id: DEV_ADMIN_ID, name: env.adminName, email: env.adminEmail, role: "ADMIN", permissions }
      };
    } catch (e) {
      logger.error({ err: e }, "Dev login fallback error");
    }
  }

  if (!isDbConnected()) {
    throw new ApiError(401, "Invalid credentials", { code: "errors.auth.invalid_credentials" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Invalid credentials", { code: "errors.auth.invalid_credentials" });
    }
    let isValid = false;
    try {
      isValid = await user.comparePassword(password);
    } catch (compareErr) {
      logger.error({ err: compareErr }, "Password compare error (invalid hash?)");
      throw new ApiError(503, "Database error", { code: "errors.common.db_error_fallback" });
    }
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials", { code: "errors.auth.invalid_credentials" });
    }
    const permissions = await getPermissionsForRole(user.role);
    const token = signToken(user.id, user.role);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions }
    };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    logger.error({ err: e }, "Login error");
    throw new ApiError(503, "Database error", { code: "errors.common.db_error_fallback" });
  }
}

export async function getMe(userId: string): Promise<AuthUser | null> {
  // Dev-admin login uses a non-ObjectId id; never look it up in DB
  if (userId === DEV_ADMIN_ID) {
    const permissions = await getPermissionsForRole("ADMIN");
    return { id: userId, name: env.adminName, email: env.adminEmail, role: "ADMIN", permissions };
  }
  if (!isDbConnected()) {
    return null;
  }
  const user = await User.findById(userId).select("name email role").lean();
  if (!user) return null;
  const u = user as { _id: { toString: () => string }; name: string; email: string; role: string };
  const permissions = await getPermissionsForRole(u.role);
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    permissions,
  };
}

const RESET_TOKEN_EXPIRY_HOURS = 1;

/** Request a password reset email. Always returns success for unknown emails (security). */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  await PasswordReset.deleteMany({ userId: user._id });
  await PasswordReset.create({ userId: user._id, token, expiresAt });
  const baseUrl = (env.storefrontUrl || "http://localhost:4200").replace(/\/?$/, "");
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  let branding = getEmailBrandingFromSettings(null, baseUrl);
  if (isDbConnected()) {
    const settings = await Settings.findOne().select("storeName logo").lean();
    branding = getEmailBrandingFromSettings(settings as { storeName?: { en?: string; ar?: string }; logo?: string } | null, baseUrl);
  }
  const html = buildResetPasswordEmailHtml({
    ...branding,
    resetLink,
    expiryHours: RESET_TOKEN_EXPIRY_HOURS
  });
  const result = await sendMail(
    normalizedEmail,
    `Reset your password${branding.storeName ? ` - ${branding.storeName}` : ""}`,
    html
  );
  if (!result.ok) {
    logger.warn({ err: result.error }, "Password reset email failed");
  }
}

/** Reset password using token from email. Validates password === confirmPassword on server. */
export async function resetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<void> {
  const { token, password, confirmPassword } = input;
  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match", { code: "errors.auth.password_mismatch" });
  }
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }
  const record = await PasswordReset.findOne({ token }).sort({ createdAt: -1 });
  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired reset link", { code: "errors.auth.reset_token_invalid" });
  }
  const user = await User.findById(record.userId);
  if (!user) {
    await PasswordReset.deleteOne({ _id: record._id });
    throw new ApiError(400, "Invalid or expired reset link", { code: "errors.auth.reset_token_invalid" });
  }
  user.password = password;
  await user.save();
  await PasswordReset.deleteMany({ userId: user._id });
}

/** Change password for logged-in user. Validates current password and password === confirmPassword. */
export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string; confirmPassword: string }
): Promise<void> {
  const { currentPassword, newPassword, confirmPassword } = input;
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirmation do not match", {
      code: "errors.auth.password_mismatch"
    });
  }
  if (userId === DEV_ADMIN_ID) {
    throw new ApiError(400, "Cannot change dev admin password via API", {
      code: "errors.auth.cannot_change_dev_admin"
    });
  }
  if (!isDbConnected()) {
    throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", { code: "errors.auth.user_not_found" });
  }
  const valid = await user.comparePassword(currentPassword);
  if (!valid) {
    throw new ApiError(401, "Current password is incorrect", { code: "errors.auth.invalid_credentials" });
  }
  user.password = newPassword;
  await user.save();
}
