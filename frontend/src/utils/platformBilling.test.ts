import { describe, expect, it } from "vitest";
import {
  effectiveBillingStatus,
  invoiceRemainingCents,
  maskMoneyInput,
  moneyInputFromCents,
  nextPlatformTenantStep,
  parseMoneyToCents,
} from "./platformBilling";

describe("platform billing", () => {
  it("converts Brazilian money without floating point storage", () => {
    expect(parseMoneyToCents("R$ 1.234,56")).toBe(123456);
    expect(parseMoneyToCents("74,90")).toBe(7490);
    expect(parseMoneyToCents("")).toBe(0);
  });

  it("formats monetary inputs while the user types", () => {
    expect(maskMoneyInput("1")).toMatch(/0,01/);
    expect(maskMoneyInput("R$ 1.234,56")).toMatch(/1\.234,56/);
    expect(maskMoneyInput("")).toBe("");
    expect(moneyInputFromCents("125050")).toMatch(/1\.250,50/);
  });

  it("never skips the billing step in the environment wizard", () => {
    expect(nextPlatformTenantStep("identity")).toBe("responsible");
    expect(nextPlatformTenantStep("responsible")).toBe("billing");
    expect(nextPlatformTenantStep("billing")).toBe("billing");
  });

  it("never exposes a negative remaining balance", () => {
    expect(invoiceRemainingCents({ totalCents: "10000", paidCents: "3500" })).toBe(6500);
    expect(invoiceRemainingCents({ totalCents: 10000, paidCents: 12000 })).toBe(0);
  });

  it("derives overdue and partial states from facts", () => {
    const base = { totalCents: 10000, paidCents: 0, status: "OPEN" };
    expect(effectiveBillingStatus({ ...base, dueDate: "2026-08-10" }, "2026-09-04")).toBe("OVERDUE");
    expect(effectiveBillingStatus({ ...base, paidCents: 2000, dueDate: "2026-09-10" }, "2026-09-04")).toBe("PARTIALLY_PAID");
    expect(effectiveBillingStatus({ ...base, paidCents: 10000, dueDate: "2026-08-10" }, "2026-09-04")).toBe("PAID");
  });

  it("keeps cancellation authoritative", () => {
    expect(effectiveBillingStatus({ status: "VOID", dueDate: "2026-01-01", totalCents: 100, paidCents: 0 }, "2026-09-04")).toBe("VOID");
  });
});
