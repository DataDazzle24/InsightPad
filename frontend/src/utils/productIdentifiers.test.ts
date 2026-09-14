import { describe, expect, it } from "vitest";
import { isValidGtin, isValidScaleCode, normalizeProductIdentifier, resolveGroceryIdentifier } from "./productIdentifiers";

describe("product identifiers", () => {
  it.each(["96385074", "036000291452", "7894900011517", "10012345000017"])("accepts valid GTIN %s", (value) => {
    expect(isValidGtin(value)).toBe(true);
  });

  it.each(["", "7894900011518", "1234567", "123456789012345", "78949A0011517"])("rejects malformed GTIN %s", (value) => {
    expect(isValidGtin(value)).toBe(false);
  });

  it("normalizes surrounding whitespace without changing the identifier", () => {
    expect(normalizeProductIdentifier(" 7894900011517 ")).toBe("7894900011517");
  });

  it("uses a valid EAN before the scale code", () => {
    expect(resolveGroceryIdentifier("7894900011517", "BAL-10")).toEqual({
      value: "7894900011517",
      kind: "EAN",
      valid: true,
      error: null,
    });
  });

  it("falls back to a safe scale code when EAN is absent or invalid", () => {
    expect(resolveGroceryIdentifier("123", "BAL-10")).toEqual({
      value: "BAL-10",
      kind: "SCALE_CODE",
      valid: true,
      error: null,
    });
    expect(isValidScaleCode("BAL_10.2")).toBe(true);
  });

  it("returns an actionable error when no partner identifier is usable", () => {
    expect(resolveGroceryIdentifier("123", null)).toMatchObject({ valid: false, kind: "EAN" });
    expect(resolveGroceryIdentifier(null, "código inválido")).toMatchObject({ valid: false, kind: "SCALE_CODE" });
    expect(resolveGroceryIdentifier(null, null)).toMatchObject({ valid: false, kind: null });
  });
});
