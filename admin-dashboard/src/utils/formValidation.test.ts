import { describe, it, expect } from "vitest";
import {
  validateLogin,
  validateRegister,
  validateCategory,
  validateCity,
  validateDepartment,
  validateRole,
  validateUserCreate,
  validateUserUpdate,
  validateFeedback,
  validateProduct,
  validateShippingMethod,
} from "./formValidation";

describe("formValidation", () => {
  describe("validateLogin", () => {
    it("returns valid for admin@localhost and password >= 6 chars", () => {
      expect(validateLogin("admin@localhost", "admin123")).toEqual({ valid: true });
      expect(validateLogin("admin@localhost", "123456")).toEqual({ valid: true });
    });

    it("returns valid for valid email and password >= 6 chars", () => {
      expect(validateLogin("user@example.com", "password1")).toEqual({ valid: true });
      expect(validateLogin("test@test.co", "123456")).toEqual({ valid: true });
    });

    it("returns invalid for empty email", () => {
      const result = validateLogin("", "password123");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.email).toBe("Valid email is required");
    });

    it("returns invalid for invalid email format", () => {
      const result = validateLogin("notanemail", "password123");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.email).toBe("Valid email is required");
    });

    it("returns invalid for short password", () => {
      const result = validateLogin("user@example.com", "12345");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.password).toBe("Password must be at least 6 characters");
    });

    it("returns invalid for empty password", () => {
      const result = validateLogin("user@example.com", "");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.password).toBe("Password must be at least 6 characters");
    });

    it("returns multiple errors when both email and password invalid", () => {
      const result = validateLogin("", "123");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.email).toBe("Valid email is required");
        expect(result.errors.password).toBe("Password must be at least 6 characters");
      }
    });
  });

  describe("validateRegister", () => {
    it("returns valid for name >= 2, valid email, password 6-128 chars", () => {
      expect(validateRegister("John", "john@test.com", "password1")).toEqual({ valid: true });
    });

    it("returns invalid for name < 2 chars", () => {
      const result = validateRegister("J", "john@test.com", "password1");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.name).toBe("Name must be at least 2 characters");
    });

    it("returns invalid for name > 100 chars", () => {
      const result = validateRegister("a".repeat(101), "john@test.com", "password1");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.name).toBe("Name must be at most 100 characters");
    });

    it("returns invalid for invalid email", () => {
      const result = validateRegister("John", "invalid", "password1");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.email).toBe("Valid email is required");
    });

    it("returns invalid for password > 128 chars", () => {
      const result = validateRegister("John", "john@test.com", "a".repeat(129));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.password).toBe("Password must be at most 128 characters");
    });
  });

  describe("validateCategory", () => {
    it("returns valid for non-empty nameEn and nameAr", () => {
      expect(validateCategory("Electronics", "إلكترونيات")).toEqual({ valid: true });
    });

    it("returns invalid for empty nameEn", () => {
      const result = validateCategory("", "تصنيف");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.nameEn).toBe("Name (EN) is required");
    });

    it("returns invalid for empty nameAr", () => {
      const result = validateCategory("Category", "");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.nameAr).toBe("Name (AR) is required");
    });

    it("returns invalid for nameEn > 200 chars", () => {
      const result = validateCategory("a".repeat(201), "تصنيف");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.nameEn).toContain("200 characters");
    });
  });

  describe("validateCity", () => {
    it("returns valid for non-empty names and deliveryFee >= 0", () => {
      expect(validateCity("Cairo", "القاهرة", 25)).toEqual({ valid: true });
      expect(validateCity("Alex", "الإسكندرية", 0)).toEqual({ valid: true });
    });

    it("returns invalid for negative deliveryFee", () => {
      const result = validateCity("Cairo", "القاهرة", -1);
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.deliveryFee).toBe("Delivery fee cannot be negative");
    });

    it("returns invalid for deliveryFee > 100000", () => {
      const result = validateCity("Cairo", "القاهرة", 100001);
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.deliveryFee).toContain("100,000");
    });

    it("returns invalid for empty nameEn", () => {
      const result = validateCity("", "القاهرة", 0);
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.nameEn).toBe("Name (EN) is required");
    });
  });

  describe("validateDepartment", () => {
    it("returns valid for non-empty name max 100 chars", () => {
      expect(validateDepartment("Marketing")).toEqual({ valid: true });
    });

    it("returns invalid for empty name", () => {
      const result = validateDepartment("");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.name).toBe("Department name is required");
    });

    it("returns invalid for name > 100 chars", () => {
      const result = validateDepartment("a".repeat(101));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.name).toContain("100 characters");
    });
  });

  describe("validateRole", () => {
    it("returns valid for non-empty name", () => {
      expect(validateRole("Store Manager")).toEqual({ valid: true });
    });

    it("returns invalid for empty name", () => {
      const result = validateRole("");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.name).toBe("Role name is required");
    });

    it("validates key when provided - rejects lowercase", () => {
      const result = validateRole("Manager", "admin");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.key).toContain("uppercase");
    });

    it("validates key when provided - accepts valid key", () => {
      expect(validateRole("Manager", "ADMIN")).toEqual({ valid: true });
      expect(validateRole("Manager", "STORE_MANAGER")).toEqual({ valid: true });
    });
  });

  describe("validateUserCreate", () => {
    it("returns valid for name, valid email, password >= 6", () => {
      expect(validateUserCreate("John Doe", "john@test.com", "password123")).toEqual({ valid: true });
    });

    it("returns invalid for short password", () => {
      const result = validateUserCreate("John", "john@test.com", "12345");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.password).toBe("Password must be at least 6 characters");
    });

    it("returns invalid for invalid email", () => {
      const result = validateUserCreate("John", "notanemail", "password1");
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.email).toBe("Invalid email");
    });
  });

  describe("validateUserUpdate", () => {
    it("returns valid for name and email when password not provided", () => {
      expect(validateUserUpdate({ name: "John", email: "john@test.com" })).toEqual({ valid: true });
    });

    it("returns valid when password provided and >= 6 chars", () => {
      expect(validateUserUpdate({ name: "John", email: "john@test.com", password: "newpass123" })).toEqual({
        valid: true,
      });
    });

    it("returns invalid when password provided but < 6 chars", () => {
      const result = validateUserUpdate({ name: "John", email: "john@test.com", password: "123" });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.password).toBe("Password must be at least 6 characters");
    });

    it("accepts empty password (optional)", () => {
      expect(validateUserUpdate({ name: "John", email: "john@test.com", password: "" })).toEqual({ valid: true });
    });
  });

  describe("validateFeedback", () => {
    it("returns valid for product, customerName, message, rating 1-5", () => {
      expect(
        validateFeedback({ product: "prod1", customerName: "Ahmed", message: "Great!", rating: 5 })
      ).toEqual({ valid: true });
    });

    it("returns invalid for empty product", () => {
      const result = validateFeedback({ product: "", customerName: "Ahmed", message: "Great!", rating: 5 });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.product).toBe("Product is required");
    });

    it("returns invalid for empty customerName", () => {
      const result = validateFeedback({ product: "p1", customerName: "", message: "Great!", rating: 5 });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.customerName).toBe("Customer name is required");
    });

    it("returns invalid for empty message", () => {
      const result = validateFeedback({ product: "p1", customerName: "Ahmed", message: "", rating: 5 });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.message).toBe("Message is required");
    });

    it("returns invalid for rating out of 1-5", () => {
      const result = validateFeedback({ product: "p1", customerName: "Ahmed", message: "Hi", rating: 0 });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.rating).toContain("1 and 5");
    });
  });

  describe("validateProduct", () => {
    it("returns valid for required fields and price > 0, stock >= 0", () => {
      expect(
        validateProduct({ nameEn: "Shirt", nameAr: "قميص", price: 99, stock: 10, category: "cat1" })
      ).toEqual({ valid: true });
    });

    it("returns invalid for empty nameEn", () => {
      const result = validateProduct({ nameEn: "", nameAr: "قميص", price: 99, stock: 10, category: "cat1" });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.nameEn).toBe("Name (EN) is required");
    });

    it("returns invalid for price <= 0", () => {
      const result = validateProduct({ nameEn: "S", nameAr: "ق", price: 0, stock: 0, category: "cat1" });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.price).toBe("Price must be greater than 0");
    });

    it("returns invalid for negative stock", () => {
      const result = validateProduct({ nameEn: "S", nameAr: "ق", price: 10, stock: -1, category: "cat1" });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.stock).toBe("Stock must be 0 or greater");
    });

    it("returns invalid for empty category", () => {
      const result = validateProduct({ nameEn: "S", nameAr: "ق", price: 10, stock: 0, category: "" });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.category).toBe("Category is required");
    });

    it("returns invalid when discountPrice >= price", () => {
      const result = validateProduct({
        nameEn: "S",
        nameAr: "ق",
        price: 100,
        stock: 5,
        category: "c1",
        discountPrice: 100,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.discountPrice).toContain("less than regular price");
    });
  });

  describe("validateShippingMethod", () => {
    it("returns valid for all required fields", () => {
      expect(
        validateShippingMethod({
          nameEn: "Standard",
          nameAr: "قياسي",
          descriptionEn: "5-7 days",
          descriptionAr: "5-7 أيام",
          price: 50,
          estimatedDaysMin: 5,
          estimatedDaysMax: 7,
        })
      ).toEqual({ valid: true });
    });

    it("returns invalid for empty nameEn", () => {
      const result = validateShippingMethod({
        nameEn: "",
        nameAr: "ق",
        descriptionEn: "d",
        descriptionAr: "د",
        price: 0,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.nameEn).toBe("Name (EN) is required");
    });

    it("returns invalid for empty descriptionEn", () => {
      const result = validateShippingMethod({
        nameEn: "S",
        nameAr: "ق",
        descriptionEn: "",
        descriptionAr: "د",
        price: 0,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.descriptionEn).toBe("Description (EN) is required");
    });

    it("returns invalid for negative price", () => {
      const result = validateShippingMethod({
        nameEn: "S",
        nameAr: "ق",
        descriptionEn: "d",
        descriptionAr: "د",
        price: -1,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.price).toBe("Price must be 0 or greater");
    });

    it("returns invalid when estimatedDaysMax < estimatedDaysMin", () => {
      const result = validateShippingMethod({
        nameEn: "S",
        nameAr: "ق",
        descriptionEn: "d",
        descriptionAr: "د",
        price: 0,
        estimatedDaysMin: 7,
        estimatedDaysMax: 3,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.estimatedDaysMax).toContain("min");
    });
  });
});
