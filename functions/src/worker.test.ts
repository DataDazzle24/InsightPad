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
}));

vi.mock("firebase-admin/app", () => ({ getApps: () => [{}], initializeApp: vi.fn(() => ({})) }));
vi.mock("firebase-admin/data-connect", () => ({ getDataConnect: vi.fn(() => ({})) }));
vi.mock("@insightpad/dataconnect-admin", () => ({ connectorConfig: {}, ...sdk }));

import { pollIfoodEvents, registerWebhookEvents } from "./worker.js";

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
});
