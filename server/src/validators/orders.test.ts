import { describe, it, expect } from "vitest";
import {
  orderSchema,
  orderStatusSchema,
  orderParamsSchema,
  orderQuerySchema,
} from "./orders.js";

const validGuestOrder = {
  items: [{ product: "507f1f77bcf86cd799439011", quantity: 2, price: 99.99 }],
  paymentMethod: "COD" as const,
  shippingAddress: { address: "123 Main St", city: "Cairo", apartment: "Apt 4", postalCode: "12345" },
  guestName: "John Doe",
  guestEmail: "john@example.com",
};

describe("orders validators", () => {
  describe("orderSchema", () => {
    // === Items ===
    it("accepts valid guest checkout", () => {
      expect(orderSchema.safeParse({ body: validGuestOrder }).success).toBe(true);
    });

    it("rejects empty items", () => {
      expect(orderSchema.safeParse({ body: { ...validGuestOrder, items: [] } }).success).toBe(false);
    });

    it("rejects item with empty product", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "", quantity: 1, price: 50 }],
          guestName: "John",
          guestEmail: "john@test.com",
        },
      }).success).toBe(false);
    });

    it("rejects item with zero quantity", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 0, price: 50 }],
          guestName: "John",
          guestEmail: "john@test.com",
        },
      }).success).toBe(false);
    });

    it("rejects item with negative price", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: -10 }],
          guestName: "John",
          guestEmail: "john@test.com",
        },
      }).success).toBe(false);
    });

    it("rejects item with non-integer quantity", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1.5, price: 50 }],
          guestName: "John",
          guestEmail: "john@test.com",
        },
      }).success).toBe(false);
    });

    // === Guest fields ===
    it("accepts minimal guest checkout", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 50 }],
          guestName: "Jane",
          guestEmail: "jane@test.com",
        },
      }).success).toBe(true);
    });

    it("rejects invalid guest email", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 50 }],
          guestName: "John",
          guestEmail: "not-an-email",
        },
      }).success).toBe(false);
    });

    it("accepts guestPhone", () => {
      expect(orderSchema.safeParse({
        body: { ...validGuestOrder, guestPhone: "+201234567890" },
      }).success).toBe(true);
    });

    // === New checkout fields ===
    it("accepts firstName, lastName, email (Shopify-style)", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 50 }],
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@test.com",
          shippingAddress: { address: "123 St", city: "Cairo" },
        },
      }).success).toBe(true);
    });

    it("rejects invalid email in new fields", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 50 }],
          firstName: "Jane",
          lastName: "Doe",
          email: "bad",
          shippingAddress: { address: "123 St", city: "Cairo" },
        },
      }).success).toBe(false);
    });

    it("accepts phone, billingAddress, specialInstructions, shippingMethod", () => {
      expect(orderSchema.safeParse({
        body: {
          ...validGuestOrder,
          phone: "01234567890",
          billingAddress: { address: "456 Billing", city: "Cairo" },
          specialInstructions: "Ring the bell",
          shippingMethod: "express",
        },
      }).success).toBe(true);
    });

    it("accepts emailNews and textNews", () => {
      expect(orderSchema.safeParse({
        body: { ...validGuestOrder, emailNews: true, textNews: true },
      }).success).toBe(true);
    });

    // === Shipping address ===
    it("accepts shippingAddress as string", () => {
      expect(orderSchema.safeParse({
        body: {
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 50 }],
          guestName: "John",
          guestEmail: "john@test.com",
          shippingAddress: "123 Main St, Cairo",
        },
      }).success).toBe(true);
    });

    it("rejects structured address with empty address", () => {
      expect(orderSchema.safeParse({
        body: {
          ...validGuestOrder,
          shippingAddress: { address: "", city: "Cairo" },
        },
      }).success).toBe(false);
    });

    it("rejects structured address with empty city", () => {
      expect(orderSchema.safeParse({
        body: {
          ...validGuestOrder,
          shippingAddress: { address: "123 St", city: "" },
        },
      }).success).toBe(false);
    });

    // === Payment & delivery ===
    it("accepts COD and INSTAPAY", () => {
      expect(orderSchema.safeParse({ body: { ...validGuestOrder, paymentMethod: "COD" } }).success).toBe(true);
      expect(orderSchema.safeParse({ body: { ...validGuestOrder, paymentMethod: "INSTAPAY" } }).success).toBe(true);
    });

    it("accepts deliveryFee", () => {
      expect(orderSchema.safeParse({ body: { ...validGuestOrder, deliveryFee: 25 } }).success).toBe(true);
    });

    it("rejects negative deliveryFee", () => {
      expect(orderSchema.safeParse({ body: { ...validGuestOrder, deliveryFee: -5 } }).success).toBe(false);
    });
  });

  describe("orderStatusSchema", () => {
    it("accepts all valid statuses", () => {
      for (const status of ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]) {
        expect(orderStatusSchema.safeParse({
          params: { id: "507f1f77bcf86cd799439011" },
          body: { status },
        }).success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      expect(orderStatusSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { status: "INVALID" },
      }).success).toBe(false);
    });
  });

  describe("orderParamsSchema", () => {
    it("accepts valid id", () => {
      expect(orderParamsSchema.safeParse({ params: { id: "507f1f77bcf86cd799439011" } }).success).toBe(true);
    });

    it("rejects empty id", () => {
      expect(orderParamsSchema.safeParse({ params: { id: "" } }).success).toBe(false);
    });
  });

  describe("orderQuerySchema", () => {
    it("accepts empty query with defaults", () => {
      const result = orderQuerySchema.safeParse({ query: {} });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe(1);
        expect(result.data.query.limit).toBe(20);
      }
    });

    it("accepts status and paymentMethod filters", () => {
      expect(orderQuerySchema.safeParse({
        query: { status: "PENDING", paymentMethod: "COD" },
      }).success).toBe(true);
    });

    it("rejects limit > 100", () => {
      expect(orderQuerySchema.safeParse({ query: { limit: 101 } }).success).toBe(false);
    });
  });
});
