import { describe, it, expect } from "vitest";
import { escapeRegex } from "./escapeRegex.js";

describe("escapeRegex", () => {
  it("escapes regex special characters", () => {
    expect(escapeRegex(".*+?^${}()[]\\|")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\[\\]\\\\\\|");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeRegex("hello world")).toBe("hello world");
  });

  it("can be used safely in RegExp", () => {
    const userInput = "test.*";
    const re = new RegExp(escapeRegex(userInput), "i");
    expect("test123".match(re)).toBeNull();
    expect("test.*".match(re)).not.toBeNull();
  });

  it("prevents ReDoS from repeated pattern", () => {
    const malicious = "a".repeat(20) + ".*";
    const escaped = escapeRegex(malicious);
    const re = new RegExp(escaped);
    expect(() => "x".match(re)).not.toThrow();
  });
});
