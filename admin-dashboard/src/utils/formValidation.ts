/**
 * Client-side validation mirroring backend (server/src/validators) rules.
 * Use for consistent UX and immediate feedback before API calls.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult = { valid: true } | { valid: false; errors: Record<string, string> };

function setError(errors: Record<string, string>, key: string, msg: string): void {
  errors[key] = msg;
}

/** Auth: login (email, password min 6) */
export function validateLogin(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  const e = email.trim().toLowerCase();
  if (!e) setError(errors, "email", "Valid email is required");
  else if (e !== "admin@localhost" && !EMAIL_REGEX.test(e)) setError(errors, "email", "Valid email is required");
  if (!password || password.length < 6) setError(errors, "password", "Password must be at least 6 characters");
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Auth: register (name min 2, email, password min 6) */
export function validateRegister(name: string, email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  const n = name.trim();
  if (!n || n.length < 2) setError(errors, "name", "Name must be at least 2 characters");
  if (n.length > 100) setError(errors, "name", "Name must be at most 100 characters");
  if (!email.trim()) setError(errors, "email", "Valid email is required");
  else if (!EMAIL_REGEX.test(email.trim().toLowerCase())) setError(errors, "email", "Valid email is required");
  if (!password || password.length < 6) setError(errors, "password", "Password must be at least 6 characters");
  if (password.length > 128) setError(errors, "password", "Password must be at most 128 characters");
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Categories: nameEn, nameAr required, max 200 */
export function validateCategory(nameEn: string, nameAr: string): ValidationResult {
  const errors: Record<string, string> = {};
  const en = nameEn.trim();
  const ar = nameAr.trim();
  if (!en) setError(errors, "nameEn", "Name (EN) is required");
  else if (en.length > 200) setError(errors, "nameEn", "Name (EN) must be at most 200 characters");
  if (!ar) setError(errors, "nameAr", "Name (AR) is required");
  else if (ar.length > 200) setError(errors, "nameAr", "Name (AR) must be at most 200 characters");
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Cities: nameEn, nameAr required max 100; deliveryFee >= 0 */
export function validateCity(nameEn: string, nameAr: string, deliveryFee: number): ValidationResult {
  const errors: Record<string, string> = {};
  const en = nameEn.trim();
  const ar = nameAr.trim();
  if (!en) setError(errors, "nameEn", "Name (EN) is required");
  else if (en.length > 100) setError(errors, "nameEn", "Name (EN) must be at most 100 characters");
  if (!ar) setError(errors, "nameAr", "Name (AR) is required");
  else if (ar.length > 100) setError(errors, "nameAr", "Name (AR) must be at most 100 characters");
  if (deliveryFee < 0) setError(errors, "deliveryFee", "Delivery fee cannot be negative");
  if (deliveryFee > 100000) setError(errors, "deliveryFee", "Delivery fee must be at most 100,000");
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Department: name required, max 100 */
export function validateDepartment(name: string): ValidationResult {
  const errors: Record<string, string> = {};
  const n = name.trim();
  if (!n) setError(errors, "name", "Department name is required");
  else if (n.length > 100) setError(errors, "name", "Department name must be at most 100 characters");
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Role: name required max 100; create also needs key (uppercase, numbers, underscores) */
export function validateRole(name: string, key?: string): ValidationResult {
  const errors: Record<string, string> = {};
  const n = name.trim();
  if (!n) setError(errors, "name", "Role name is required");
  else if (n.length > 100) setError(errors, "name", "Role name must be at most 100 characters");
  if (key !== undefined) {
    const k = key.trim();
    if (!k) setError(errors, "key", "Role key is required");
    else if (k.length > 50) setError(errors, "key", "Role key must be at most 50 characters");
    else if (!/^[A-Z0-9_]+$/.test(k)) setError(errors, "key", "Key must be uppercase letters, numbers, and underscores");
  }
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** User create: name, email, password min 6 required */
export function validateUserCreate(name: string, email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  const n = name.trim();
  if (!n) setError(errors, "name", "Name is required");
  else if (n.length > 100) setError(errors, "name", "Name must be at most 100 characters");
  if (!email.trim()) setError(errors, "email", "Invalid email");
  else if (!EMAIL_REGEX.test(email.trim().toLowerCase())) setError(errors, "email", "Invalid email");
  if (!password || password.length < 6) setError(errors, "password", "Password must be at least 6 characters");
  if (password.length > 128) setError(errors, "password", "Password must be at most 128 characters");
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** User update: name and email required; password optional but if provided min 6 */
export function validateUserUpdate(data: {
  name: string;
  email: string;
  password?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const n = data.name.trim();
  if (!n) setError(errors, "name", "Name is required");
  else if (n.length > 100) setError(errors, "name", "Name must be at most 100 characters");
  const em = data.email.trim();
  if (!em) setError(errors, "email", "Invalid email");
  else if (!EMAIL_REGEX.test(em.toLowerCase())) setError(errors, "email", "Invalid email");
  if (data.password != null && data.password.trim()) {
    if (data.password.length < 6) setError(errors, "password", "Password must be at least 6 characters");
    if (data.password.length > 128) setError(errors, "password", "Password must be at most 128 characters");
  }
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Feedback: product, customerName, message required; customerName max 200, message max 2000; rating 1–5 */
export function validateFeedback(data: {
  product: string;
  customerName: string;
  message: string;
  rating: number;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.product.trim()) setError(errors, "product", "Product is required");
  const cn = data.customerName.trim();
  if (!cn) setError(errors, "customerName", "Customer name is required");
  else if (cn.length > 200) setError(errors, "customerName", "Customer name must be at most 200 characters");
  const msg = data.message.trim();
  if (!msg) setError(errors, "message", "Message is required");
  else if (msg.length > 2000) setError(errors, "message", "Message must be at most 2000 characters");
  const r = data.rating;
  if (typeof r !== "number" || r < 1 || r > 5 || !Number.isInteger(r)) {
    setError(errors, "rating", "Rating must be between 1 and 5");
  }
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Product: nameEn, nameAr required max 500; price > 0; stock >= 0; category required */
const MAX_PRODUCT_NAME = 500;
export function validateProduct(data: {
  nameEn: string;
  nameAr: string;
  price: number;
  stock: number;
  category: string;
  discountPrice?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const en = data.nameEn.trim();
  const ar = data.nameAr.trim();
  if (!en) setError(errors, "nameEn", "Name (EN) is required");
  else if (en.length > MAX_PRODUCT_NAME) setError(errors, "nameEn", `Name (EN) must be at most ${MAX_PRODUCT_NAME} characters`);
  if (!ar) setError(errors, "nameAr", "Name (AR) is required");
  else if (ar.length > MAX_PRODUCT_NAME) setError(errors, "nameAr", `Name (AR) must be at most ${MAX_PRODUCT_NAME} characters`);
  if (typeof data.price !== "number" || data.price <= 0) setError(errors, "price", "Price must be greater than 0");
  if (typeof data.stock !== "number" || data.stock < 0 || !Number.isInteger(data.stock)) {
    setError(errors, "stock", "Stock must be 0 or greater");
  }
  if (!data.category.trim()) setError(errors, "category", "Category is required");
  if (data.discountPrice != null && data.discountPrice >= data.price) {
    setError(errors, "discountPrice", "Discount price must be less than regular price");
  }
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

/** Shipping method: nameEn, nameAr, descriptionEn, descriptionAr required; price >= 0; estimatedDays min/max >= 1 */
export function validateShippingMethod(data: {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const en = data.nameEn.trim();
  const ar = data.nameAr.trim();
  const descEn = data.descriptionEn.trim();
  const descAr = data.descriptionAr.trim();
  if (!en) setError(errors, "nameEn", "Name (EN) is required");
  if (!ar) setError(errors, "nameAr", "Name (AR) is required");
  if (!descEn) setError(errors, "descriptionEn", "Description (EN) is required");
  if (!descAr) setError(errors, "descriptionAr", "Description (AR) is required");
  if (typeof data.price !== "number" || data.price < 0) setError(errors, "price", "Price must be 0 or greater");
  const min = data.estimatedDaysMin;
  const max = data.estimatedDaysMax;
  if (typeof min !== "number" || min < 1) setError(errors, "estimatedDaysMin", "Estimated days min must be at least 1");
  if (typeof max !== "number" || max < 1) setError(errors, "estimatedDaysMax", "Estimated days max must be at least 1");
  if (min > max) setError(errors, "estimatedDaysMax", "Max days must be greater than or equal to min");
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}
