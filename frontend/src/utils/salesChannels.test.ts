import { describe, expect, it } from "vitest";
import { buildSalesChannelCsv, countActiveFilters, isSalesChannelOperational, salesChannelHealth, salesChannelProviderLabel } from "./salesChannels";

describe("sales channel helpers", () => {
  it("supports every prepared partner", () => {
    expect(salesChannelProviderLabel("IFOOD")).toBe("iFood");
    expect(salesChannelProviderLabel("ZE_DELIVERY")).toBe("Zé Delivery");
    expect(salesChannelProviderLabel("NINETYNINE_FOOD")).toBe("99Food");
  });

  it("requires an active and authorized connection", () => {
    expect(isSalesChannelOperational({ enabled: true, status: "ACTIVE", authorizationStatus: "AUTHORIZED" })).toBe(true);
    expect(isSalesChannelOperational({ enabled: true, status: "DRAFT", authorizationStatus: "AUTHORIZED" })).toBe(false);
    expect(isSalesChannelOperational({ enabled: true, status: "ACTIVE", authorizationStatus: "PENDING" })).toBe(false);
  });

  it("prioritizes failures in the health indicator", () => {
    expect(salesChannelHealth({ enabled: true, status: "ACTIVE", authorizationStatus: "AUTHORIZED", consecutiveFailures: 2 }).key).toBe("error");
    expect(salesChannelHealth({ enabled: false, status: "ACTIVE", authorizationStatus: "AUTHORIZED" }).key).toBe("paused");
  });

  it("counts filters and escapes spreadsheet CSV", () => {
    expect(countActiveFilters({ provider: "IFOOD", status: "", branchId: null })).toBe(1);
    expect(buildSalesChannelCsv(["Nome"], [['Loja "Centro"']])).toContain('"Loja ""Centro"""');
  });
});
