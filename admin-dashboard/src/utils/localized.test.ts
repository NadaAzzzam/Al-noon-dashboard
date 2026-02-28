import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { getLocalized, useLocalized } from "./localized";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";

describe("getLocalized", () => {
  it("returns empty string for null", () => {
    expect(getLocalized(null, "en")).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getLocalized(undefined, "en")).toBe("");
  });

  it("returns string value as-is", () => {
    expect(getLocalized("Hello", "en")).toBe("Hello");
  });

  it("returns en value for en lang", () => {
    expect(getLocalized({ en: "Hello", ar: "مرحبا" }, "en")).toBe("Hello");
  });

  it("returns ar value for ar lang", () => {
    expect(getLocalized({ en: "Hello", ar: "مرحبا" }, "ar")).toBe("مرحبا");
  });

  it("falls back to en when lang value missing", () => {
    expect(getLocalized({ en: "Hello", ar: "" }, "ar")).toBe("");
    expect(getLocalized({ en: "Hello", ar: "مرحبا" }, "ar")).toBe("مرحبا");
  });

  it("falls back to en when ar missing", () => {
    expect(getLocalized({ en: "Hello" } as { en: string; ar: string }, "ar")).toBe("Hello");
  });

  it("falls back to ar when en missing", () => {
    expect(getLocalized({ ar: "مرحبا" } as { en: string; ar: string }, "en")).toBe("مرحبا");
  });

  it("returns empty string when both missing", () => {
    expect(getLocalized({} as { en: string; ar: string }, "en")).toBe("");
  });
});

describe("useLocalized", () => {
  it("returns function that localizes for current language", async () => {
    await i18n.changeLanguage("en");
    const { result } = renderHook(() => useLocalized(), {
      wrapper: ({ children }) => React.createElement(I18nextProvider, { i18n }, children),
    });
    expect(result.current({ en: "Hello", ar: "مرحبا" })).toBe("Hello");

    await i18n.changeLanguage("ar");
    const { result: resultAr } = renderHook(() => useLocalized(), {
      wrapper: ({ children }) => React.createElement(I18nextProvider, { i18n }, children),
    });
    expect(resultAr.current({ en: "Hello", ar: "مرحبا" })).toBe("مرحبا");
  });
});
