import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IfoodEvent } from "./domain.js";
import { IfoodHttpError, type IfoodClient } from "./ifood.js";

const sdk = vi.hoisted(() => ({
  systemSalesChannelOrderForActor: vi.fn(),
  systemSalesChannelConnectionForActor: vi.fn(),
  systemApplySalesChannelOrderEvent: vi.fn(),
  systemClaimSalesChannelWork: vi.fn(),
  systemIfoodConnectionByMerchant: vi.fn(),
  systemIfoodConnectionsByMerchants: vi.fn(),
  systemIfoodConnectionsForPolling: vi.fn(),
  systemIngestSalesChannelOrder: vi.fn(),
  systemPurgeExpiredSalesChannelPayloads: vi.fn(),
  systemQueueDueSalesChannelSyncJobs: vi.fn(),
  systemMarkSalesChannelWebhookActive: vi.fn(),
  systemRecordSalesChannelCommandResult: vi.fn(),
  systemRecordSalesChannelEventResult: vi.fn(),
  systemRecordSalesChannelMappingResult: vi.fn(),
  systemReconcileSalesChannelCommerce: vi.fn(),
  systemRecordSalesChannelSyncResult: vi.fn(),
  systemRegisterSalesChannelEvents: vi.fn(),
  systemSalesChannelMappingsForSync: vi.fn(),
  systemSalesChannelWorkQueue: vi.fn(),
  systemUpdateSalesChannelConnection: vi.fn(),
  systemUpsertSalesChannelFinancialEvents: vi.fn(),
}));

vi.mock("firebase-admin/app", () => ({ getApps: () => [{}], initializeApp: vi.fn(() => ({})) }));
vi.mock("firebase-admin/data-connect", () => ({ getDataConnect: vi.fn(() => ({})) }));
vi.mock("@insightpad/dataconnect-admin", () => ({ connectorConfig: {}, ...sdk }));

import { drainIfoodWork, pollIfoodEvents, registerWebhookEvents } from "./worker.js";

const selected = (rows: unknown[]) => ({ data: { _select: rows } });
const executed = (count: number) => ({ data: { _execute: count } });
const connection = (merchant: string, suffix: string) => ({
  connectionId: `connection-${suffix}`,
  tenantId: `tenant-${suffix}`,
  externalStoreId: merchant,
  integrationMode: "HYBRID",
  webhookStatus: "ACTIVE",
});
const event = (id: string, merchantId: string): IfoodEvent => ({ id, code: "PLACED", merchantId, orderId: `order-${id}` });
const mapping = (id: string, barcode: string) => ({
  mappingId: id,
  externalProductId: barcode,
  externalProductName: `Produto ${id}`,
  productName: `Produto ${id}`,
  internalCode: id,
  categoryName: "Mercearia",
  subcategoryName: "Testes",
  syncPrice: true,
  syncStock: true,
  priceCents: "1000",
  basePriceCents: "1000",
  stockQuantity: "5",
  needsFullPublication: true,
  version: 1,
  snapshotAt: "2026-09-21T10:00:00.000Z",
  remaining: "3",
});

beforeEach(() => {
  vi.clearAllMocks();
  sdk.systemRegisterSalesChannelEvents.mockImplementation(async (_dc, variables: { payloads: unknown[] }) => executed(variables.payloads.length));
  sdk.systemMarkSalesChannelWebhookActive.mockImplementation(async (_dc, variables: { connectionIds: unknown[] }) => executed(variables.connectionIds.length));
  sdk.systemUpdateSalesChannelConnection.mockResolvedValue(executed(1));
});

describe("iFood worker batching and isolation", () => {
  it("persists webhook events by connection and marks health in batches", async () => {
    sdk.systemIfoodConnectionsByMerchants.mockResolvedValue(selected([
      connection("merchant-a", "a"),
      connection("merchant-b", "b"),
    ]));

    const stored = await registerWebhookEvents([
      event("event-a", "merchant-a"),
      event("event-b", "merchant-b"),
      event("event-unknown", "merchant-unknown"),
    ], "request-webhook");

    expect(stored).toBe(2);
    expect(sdk.systemIfoodConnectionsByMerchants).toHaveBeenCalledTimes(1);
    expect(sdk.systemRegisterSalesChannelEvents).toHaveBeenCalledTimes(2);
    expect(sdk.systemRegisterSalesChannelEvents.mock.calls.map((call) => call[1].connectionId).sort()).toEqual(["connection-a", "connection-b"]);
    expect(sdk.systemMarkSalesChannelWebhookActive).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      connectionIds: expect.arrayContaining(["connection-a", "connection-b"]),
      requestId: "request-webhook",
    }));
  });

  it("isolates a revoked merchant without blocking polling for other stores", async () => {
    sdk.systemIfoodConnectionsForPolling.mockResolvedValue(selected([
      connection("merchant-good", "good"),
      connection("merchant-revoked", "revoked"),
    ]));
    const pollEvents = vi.fn(async (merchantIds: string[]) => {
      if (merchantIds.length > 1 || merchantIds[0] === "merchant-revoked") {
        throw new IfoodHttpError("Não autorizado", 403, "request-403", false);
      }
      return { data: [event("event-good", "merchant-good")], status: 200, requestId: "request-good" };
    });
    const acknowledgeEvents = vi.fn(async () => ({ data: {}, status: 202, requestId: "request-ack" }));
    const client = { pollEvents, acknowledgeEvents } as unknown as IfoodClient;

    const result = await pollIfoodEvents(client);

    expect(result).toEqual({ received: 1, acknowledged: 1, unmapped: 0 });
    expect(pollEvents).toHaveBeenCalledTimes(3);
    expect(acknowledgeEvents).toHaveBeenCalledWith(["event-good"]);
    expect(sdk.systemRegisterSalesChannelEvents).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ connectionId: "connection-good" }));
    expect(sdk.systemUpdateSalesChannelConnection).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      connectionId: "connection-revoked",
      payload: expect.objectContaining({ status: "SUSPENDED", authorizationStatus: "REVOKED", success: false }),
    }));
  });

  it("acknowledges early Grocery events without reading an unavailable virtual bag", async () => {
    sdk.systemClaimSalesChannelWork.mockResolvedValue(executed(1));
    sdk.systemSalesChannelWorkQueue.mockResolvedValue(selected([{ data: {
      commands: [],
      jobs: [],
      events: [{ id: "event-inbox-placed", connectionId: "connection-1", providerEventId: "provider-placed", eventType: "PLACED", catalogProfile: "GROCERY", externalStoreId: "merchant-1", attempts: 0, payload: { id: "provider-placed", code: "PLACED", orderId: "order-1", merchantId: "merchant-1" } }],
    } }]));
    const getOrder = vi.fn();
    const getOrderVirtualBag = vi.fn();

    await expect(drainIfoodWork({ getOrder, getOrderVirtualBag } as unknown as IfoodClient, 1)).resolves.toBe(1);

    expect(getOrder).not.toHaveBeenCalled();
    expect(getOrderVirtualBag).not.toHaveBeenCalled();
    expect(sdk.systemIngestSalesChannelOrder).not.toHaveBeenCalled();
    expect(sdk.systemRecordSalesChannelEventResult).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      eventId: "event-inbox-placed",
      payload: expect.objectContaining({ success: true, acknowledged: true, classification: "IGNORED" }),
    }));
  });

  it("imports a Grocery order only at READY_FOR_INVOICE with its virtual bag", async () => {
    sdk.systemClaimSalesChannelWork.mockResolvedValue(executed(1));
    sdk.systemSalesChannelWorkQueue.mockResolvedValue(selected([{ data: {
      commands: [],
      jobs: [],
      events: [{ id: "event-inbox-rfi", connectionId: "connection-1", providerEventId: "provider-rfi", eventType: "RFI", catalogProfile: "GROCERY", externalStoreId: "merchant-1", attempts: 0, payload: { id: "provider-rfi", code: "RFI", orderId: "order-1", merchantId: "merchant-1", createdAt: "2026-09-23T10:00:00Z" } }],
    } }]));
    sdk.systemIngestSalesChannelOrder.mockResolvedValue(executed(1));
    sdk.systemApplySalesChannelOrderEvent.mockResolvedValue(executed(1));
    sdk.systemReconcileSalesChannelCommerce.mockResolvedValue(executed(1));
    sdk.systemRecordSalesChannelEventResult.mockResolvedValue(executed(1));
    const getOrder = vi.fn(async () => ({ data: { id: "order-1", orderStatus: "CONFIRMED", merchant: { id: "merchant-1" }, createdAt: "2026-09-23T10:00:00Z" }, status: 200, requestId: "request-order" }));
    const getOrderVirtualBag = vi.fn(async () => ({ data: {
      id: "order-1",
      shortCode: "G001",
      bag: { prices: { grossValue: { value: 1500 } }, items: [{ uniqueId: "bag-1", product: { externalCode: "sku-1", ean: "7890000000001", name: "Produto" }, quantity: 1, prices: { unitValue: { value: 1500 }, grossValue: { value: 1500 } } }] },
      payment: { methods: [{ name: "PIX", inPerson: false, amount: { value: 1500, currency: "BRL" } }] },
    }, status: 200, requestId: "request-bag" }));

    await expect(drainIfoodWork({ getOrder, getOrderVirtualBag } as unknown as IfoodClient, 1)).resolves.toBe(1);

    expect(getOrder).toHaveBeenCalledWith("order-1");
    expect(getOrderVirtualBag).toHaveBeenCalledWith("order-1");
    expect(sdk.systemIngestSalesChannelOrder).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      connectionId: "connection-1",
      payload: expect.objectContaining({ providerOrderId: "order-1", partnerStatus: "RFI", reconciledStatus: "PENDING" }),
    }));
    expect(sdk.systemApplySalesChannelOrderEvent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      providerOrderId: "order-1",
      payload: expect.objectContaining({ status: "PENDING", partnerStatus: "RFI" }),
    }));
  });

  it.each([
    { currentQuantity: 2, flag: "reconciliationNotApplied", expected: false },
    { currentQuantity: 1, flag: "reconciliationNotApplied", expected: true },
  ])("reconciles a lost Picking update without replaying it (quantity $currentQuantity)", async ({ currentQuantity, flag, expected }) => {
    sdk.systemClaimSalesChannelWork.mockResolvedValue(executed(1));
    sdk.systemSalesChannelWorkQueue.mockResolvedValue(selected([{ data: {
      events: [],
      jobs: [],
      commands: [{
        id: "reconcile-1",
        connectionId: "connection-1",
        providerOrderId: "order-1",
        catalogProfile: "GROCERY",
        externalStoreId: "merchant-1",
        action: "RECONCILE_ORDER",
        payload: { sourceCommandId: "source-1" },
        sourceAction: "UPDATE_ITEM",
        sourcePayload: { externalItemId: "bag-1", quantity: 2 },
        sourceOutcomeUnknown: true,
        attempts: 0,
      }],
    } }]));
    const getOrder = vi.fn(async () => ({ data: { id: "order-1", orderStatus: "SEPARATION_STARTED", merchant: { id: "merchant-1" }, createdAt: "2026-09-23T10:00:00Z" }, status: 200, requestId: "request-order" }));
    const getOrderVirtualBag = vi.fn(async () => ({ data: {
      id: "order-1",
      bag: { prices: { grossValue: { value: 1500 } }, items: [{ uniqueId: "bag-1", product: { externalCode: "sku-1", ean: "7890000000001", name: "Produto" }, quantity: currentQuantity, prices: { unitValue: { value: 750 }, grossValue: { value: 1500 } } }] },
      payment: { methods: [{ name: "PIX", inPerson: false, amount: { value: 1500, currency: "BRL" } }] },
    }, status: 200, requestId: "request-bag" }));

    await expect(drainIfoodWork({ getOrder, getOrderVirtualBag } as unknown as IfoodClient, 1)).resolves.toBe(1);

    expect(sdk.systemRecordSalesChannelCommandResult).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      commandId: "reconcile-1",
      payload: expect.objectContaining({ success: true, [flag]: expected }),
    }));
    expect(getOrder).toHaveBeenCalledTimes(1);
    expect(getOrderVirtualBag).toHaveBeenCalledTimes(1);
  });

  it("isolates a permanently invalid Grocery product without rejecting the valid batch", async () => {
    sdk.systemClaimSalesChannelWork.mockResolvedValue(executed(1));
    sdk.systemSalesChannelWorkQueue.mockResolvedValue(selected([{ data: {
      commands: [],
      events: [],
      jobs: [{ id: "job-1", connectionId: "connection-1", jobType: "FULL", catalogProfile: "GROCERY", processedItems: 0, attempts: 0, externalStoreId: "merchant-1" }],
    } }]));
    sdk.systemSalesChannelMappingsForSync.mockResolvedValue(selected([
      mapping("good-1", "7890000000001"),
      mapping("bad", "7890000000002"),
      mapping("good-2", "7890000000003"),
    ]));
    sdk.systemRecordSalesChannelMappingResult.mockResolvedValue(executed(1));
    sdk.systemRecordSalesChannelSyncResult.mockResolvedValue(executed(1));
    const ingestGroceryProducts = vi.fn(async (_merchant: string, products: Array<{ barcode: string }>) => {
      if (products.some((product) => product.barcode === "7890000000002")) {
        throw new IfoodHttpError("O iFood rejeitou um produto inválido.", 400, "request-invalid", false);
      }
      return { data: {}, status: 202, requestId: "request-ok" };
    });

    await expect(drainIfoodWork({ ingestGroceryProducts } as unknown as IfoodClient, 1)).resolves.toBe(1);

    const results = sdk.systemRecordSalesChannelMappingResult.mock.calls.map((call) => call[1] as { mappingId: string; payload: { success: boolean } });
    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ mappingId: "good-1", payload: expect.objectContaining({ success: true }) }),
      expect.objectContaining({ mappingId: "bad", payload: expect.objectContaining({ success: false }) }),
      expect.objectContaining({ mappingId: "good-2", payload: expect.objectContaining({ success: true }) }),
    ]));
    expect(sdk.systemRecordSalesChannelSyncResult).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      jobId: "job-1",
      payload: expect.objectContaining({ success: false, retryable: false, processedItems: 0, failedItems: 1 }),
    }));
  });
});
