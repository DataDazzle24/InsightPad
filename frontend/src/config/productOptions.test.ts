import { describe, expect, it } from "vitest";
import {
  PRODUCT_COLOR_OPTIONS,
  PRODUCT_SIZE_OPTIONS,
  productSizeLabel,
} from "./productOptions";

describe("product catalog options", () => {
  it("offers at least fifty distinct sizes for every measurement type", () => {
    for (const values of Object.values(PRODUCT_SIZE_OPTIONS)) {
      expect(values.length).toBeGreaterThanOrEqual(50);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("covers litres through fifty litres", () => {
    expect(PRODUCT_SIZE_OPTIONS.L).toContain("50");
    expect(productSizeLabel("L", "50")).toBe("50 L");
  });

  it("offers fifty distinct commercial colour names", () => {
    expect(PRODUCT_COLOR_OPTIONS).toHaveLength(50);
    expect(new Set(PRODUCT_COLOR_OPTIONS).size).toBe(50);
  });
});
