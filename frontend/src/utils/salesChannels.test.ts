import { describe, expect, it } from "vitest";
import { buildSalesChannelCsv, countActiveFilters, isSalesChannelOperational, salesChannelActionLabel, salesChannelHealth, salesChannelJobLabel, salesChannelProviderLabel, salesChannelStatusLabel, storeHoursHaveOverlap } from "./salesChannels";

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
    expect(buildSalesChannelCsv(["Nome"], [[" =HYPERLINK(\"https://example.com\")"]])).toContain("' =HYPERLINK");
  });

  it("translates operational codes into language for store users", () => {
    expect(salesChannelStatusLabel("AWAITING_PARTNER")).toBe("Aguardando iFood");
    expect(salesChannelActionLabel("UPDATE_ITEM")).toBe("Alterar quantidade");
    expect(salesChannelJobLabel("FULL")).toBe("Produtos, preços e estoque");
  });

  it("detects overlapping store hours across midnight and week boundaries", () => {
    expect(storeHoursHaveOverlap([
      { dayOfWeek: "MONDAY", start: "18:00", duration: 480 },
      { dayOfWeek: "TUESDAY", start: "01:00", duration: 120 },
    ])).toBe(true);
    expect(storeHoursHaveOverlap([
      { dayOfWeek: "SATURDAY", start: "22:00", duration: 240 },
      { dayOfWeek: "SUNDAY", start: "03:00", duration: 120 },
    ])).toBe(false);
  });
});
