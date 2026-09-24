import { randomUUID } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import {
  connectorConfig,
  systemSalesChannelOrderForActor,
  systemSalesChannelConnectionForActor,
  systemApplySalesChannelOrderEvent,
  systemClaimSalesChannelWork,
  systemIfoodConnectionByMerchant,
  systemIfoodConnectionsByMerchants,
  systemIfoodConnectionsForPolling,
  systemIngestSalesChannelOrder,
  systemPurgeExpiredSalesChannelPayloads,
  systemQueueDueSalesChannelSyncJobs,
  systemMarkSalesChannelWebhookActive,
  systemRecordSalesChannelCommandResult,
  systemRecordSalesChannelEventResult,
  systemRecordSalesChannelMappingResult,
  systemReconcileSalesChannelCommerce,
  systemRecordSalesChannelSyncResult,
  systemRegisterSalesChannelEvents,
  systemSalesChannelMappingsForSync,
  systemSalesChannelHealthMetrics,
  systemSalesChannelWorkQueue,
  systemUpdateSalesChannelConnection,
  systemUpsertSalesChannelFinancialEvents,
} from "@insightpad/dataconnect-admin";
import {
  asArray,
  asRecord,
  assertOrderIdentity,
  orderAlreadyApplied,
  eventMerchantId,
  eventOrderId,
  eventStatus,
  eventType,
  firstString,
  heartbeatMerchantIds,
  ifoodCompletionAction,
  isIfoodGroceryPreInvoiceEvent,
  isIfoodGroceryReadyForInvoiceEvent,
  isIfoodOrderEvent,
  isIfoodKeepalive,
  normalizeIfoodOrder,
  normalizeIfoodFinancialEvent,
  orderStatusFromCode,
  parseIfoodEvents,
  retryDelaySeconds,
  sha256,
  shouldRetryIfoodOrderDetails,
  type IfoodEvent,
  type JsonRecord,
} from "./domain.js";
import { cancellationCode, groceryProductFromSource, IfoodClient, IfoodHttpError, merchantCatalogProfile, merchantId, type MerchantOpeningShift } from "./ifood.js";

const app = getApps()[0] ?? initializeApp();
const dc = getDataConnect(connectorConfig, app);

type ConnectionLookup = {
  connectionId: string;
  tenantId: string;
  externalStoreId: string;
  integrationMode: string;
  webhookStatus: string;
};

type CommandWork = {
  id: string;
  connectionId: string;
  providerOrderId?: string;
  orderType?: string;
  deliveryProvider?: string;
  partnerStatus?: string;
  catalogProfile?: string;
  action: string;
  payload: unknown;
  sourceAction?: string;
  sourcePayload?: unknown;
  sourceOutcomeUnknown?: boolean;
  attempts: number;
  externalStoreId?: string;
};

type ReconciliationOutcome = "APPLIED" | "NOT_APPLIED" | "UNKNOWN";

type EventWork = {
  id: string;
  connectionId: string;
  providerEventId: string;
  eventType: string;
  catalogProfile?: string;
  externalStoreId?: string;
  requestId?: string;
  payload: unknown;
  attempts: number;
};

type JobWork = {
  id: string;
  connectionId: string;
  jobType: string;
  catalogProfile?: string;
  cursor?: string;
  checkpoint?: unknown;
  processedItems?: number;
  attempts: number;
  externalStoreId?: string;
  lastFinancialSyncAt?: string;
};

type WorkQueue = { commands: CommandWork[]; events: EventWork[]; jobs: JobWork[] };
export type SalesChannelHealthMetrics = {
  activeConnections: number;
  unhealthyConnections: number;
  eventErrors: number;
  eventBacklog: number;
  commandErrors: number;
  commandBacklog: number;
  syncErrors: number;
  syncBacklog: number;
  catalogReceiptsToVerify: number;
  commerceBlocked: number;
  financialPending: number;
  capturedAt: string;
};

type MappingWork = {
  mappingId: string;
  externalProductId: string;
  externalProductName?: string;
  productName: string;
  internalCode?: string;
  imageUrl?: string;
  brand?: string;
  size?: string;
  sizeType?: string;
  description?: string;
  categoryName?: string;
  subcategoryName?: string;
  syncPrice: boolean;
  syncStock: boolean;
  priceCents: string;
  basePriceCents: string;
  promotionPriceCents?: string;
  stockQuantity: string;
  lastSyncedAt?: string;
  publicationStatus?: string;
  partnerOperationId?: string;
  partnerConfirmationDueAt?: string;
  needsFullPublication: boolean;
  nextPromotionChangeAt?: string;
  version: number;
  snapshotAt: string;
  remaining: string;
};

type SafeError = {
  message: string;
  retryable: boolean;
  retryAfterSeconds: number;
  status?: number;
  requestId?: string;
};

function rows(result: unknown): unknown[] {
  const selected = (result as { data?: { _select?: unknown[] | null } })?.data?._select;
  return Array.isArray(selected) ? selected : [];
}

function box<T>(result: unknown): T | undefined {
  const first = rows(result)[0];
  const data = asRecord(first).data;
  return data === undefined ? undefined : data as T;
}

function executeCount(result: unknown): number {
  const value = (result as { data?: { _execute?: unknown } })?.data?._execute;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeError(error: unknown, attempt: number): SafeError {
  if (error instanceof IfoodHttpError) {
    const failure: SafeError = {
      message: error.message,
      retryable: error.retryable,
      retryAfterSeconds: retryDelaySeconds(attempt, error.retryAfterSeconds),
      status: error.status,
    };
    if (error.requestId) failure.requestId = error.requestId;
    return failure;
  }
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return { message: "Tempo limite excedido ao comunicar com o iFood.", retryable: true, retryAfterSeconds: retryDelaySeconds(attempt) };
  }
  if (error instanceof TypeError) {
    return { message: "Falha de rede ao comunicar com o iFood.", retryable: true, retryAfterSeconds: retryDelaySeconds(attempt) };
  }
  const original = error instanceof Error ? error.message : "";
  const safePrefixes = ["O pedido", "O item do pedido", "Evento iFood", "Comando sem", "Ação de pedido", "O iFood não retornou", "Informe o ID", "A loja informada", "A conexão não possui", "A loja iFood está", "O produto", "A sincronização", "A operação"];
  const message = safePrefixes.some((prefix) => original.startsWith(prefix)) ? original : "Falha interna no processamento seguro da integração.";
  return { message: message.slice(0, 900), retryable: false, retryAfterSeconds: retryDelaySeconds(attempt) };
}

async function mapConcurrent<T>(items: T[], concurrency: number, handler: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      if (item !== undefined) await handler(item);
    }
  });
  await Promise.all(workers);
}

function chunks<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let offset = 0; offset < items.length; offset += size) {
    groups.push(items.slice(offset, offset + size));
  }
  return groups;
}

export async function connectionForMerchant(merchant: string): Promise<ConnectionLookup | undefined> {
  if (!merchant.trim()) return undefined;
  const result = await systemIfoodConnectionByMerchant(dc, { merchantId: merchant, requestKey: randomUUID() });
  const matches = rows(result) as ConnectionLookup[];
  if (matches.length > 1) throw new Error("A loja iFood está associada a mais de um ambiente.");
  return matches[0];
}

async function connectionsForMerchants(merchants: string[]): Promise<ConnectionLookup[]> {
  const unique = [...new Set(merchants.map((merchant) => merchant.trim()).filter(Boolean))];
  if (!unique.length) return [];
  const matches: ConnectionLookup[] = [];
  await mapConcurrent(chunks(unique, 100), 3, async (batch) => {
    matches.push(...rows(await systemIfoodConnectionsByMerchants(dc, { merchantIds: batch, requestKey: randomUUID() })) as ConnectionLookup[]);
  });
  const seen = new Set<string>();
  for (const match of matches) {
    if (seen.has(match.externalStoreId)) throw new Error("A loja iFood está associada a mais de um ambiente.");
    seen.add(match.externalStoreId);
  }
  return matches;
}

async function markWebhookConnections(connections: ConnectionLookup[], requestId: string): Promise<void> {
  await mapConcurrent(chunks(connections, 100), 3, async (batch) => {
    const updated = await systemMarkSalesChannelWebhookActive(dc, { connectionIds: batch.map((connection) => connection.connectionId), requestId });
    if (executeCount(updated) !== batch.length) throw new Error("A saúde do webhook não foi atualizada para todas as lojas conectadas.");
  });
}

export async function connectedHeartbeatMerchants(events: IfoodEvent[], requestId = ""): Promise<string[]> {
  const requested = [...new Set(events.flatMap(heartbeatMerchantIds))];
  const connections = await connectionsForMerchants(requested);
  if (connections.length) await markWebhookConnections(connections, requestId);
  const connected = new Set(connections.map((connection) => connection.externalStoreId));
  return requested.filter((merchant) => connected.has(merchant));
}

export async function registerEvents(connectionId: string, events: IfoodEvent[], requestId = "", source: "WEBHOOK" | "POLLING" = "WEBHOOK"): Promise<void> {
  if (!events.length || events.length > 100) throw new Error("Quantidade de eventos iFood inválida para persistência.");
  const payloads = events.map((event) => {
    const serialized = JSON.stringify(event);
    return {
      eventId: event.id,
      eventType: eventType(event),
      requestId,
      payloadHash: sha256(serialized),
      payload: event,
      containsPersonalData: true,
      source,
    };
  });
  const stored = await systemRegisterSalesChannelEvents(dc, {
    connectionId,
    payloads,
  });
  if (executeCount(stored) !== events.length) throw new Error("Eventos iFood não foram confirmados integralmente no armazenamento seguro.");
}

export async function registerEvent(connectionId: string, event: IfoodEvent, requestId = "", source: "WEBHOOK" | "POLLING" = "WEBHOOK"): Promise<void> {
  await registerEvents(connectionId, [event], requestId, source);
}

export async function markWebhookActive(connectionId: string, requestId = ""): Promise<void> {
  await systemUpdateSalesChannelConnection(dc, {
    connectionId,
    payload: { webhookStatus: "ACTIVE", integrationMode: "HYBRID", requestId, success: true },
  });
}

export async function registerWebhookEvents(events: IfoodEvent[], requestId = ""): Promise<number> {
  const businessEvents = events.filter((event) => !isIfoodKeepalive(event));
  const connections = await connectionsForMerchants(businessEvents.map(eventMerchantId));
  const byMerchant = new Map(connections.map((connection) => [connection.externalStoreId, connection]));
  const grouped = new Map<string, { connection: ConnectionLookup; events: IfoodEvent[] }>();
  let stored = 0;
  for (const event of businessEvents) {
    const connection = byMerchant.get(eventMerchantId(event));
    if (!connection) continue;
    const group = grouped.get(connection.connectionId) ?? { connection, events: [] };
    group.events.push(event);
    grouped.set(connection.connectionId, group);
  }
  await mapConcurrent([...grouped.values()], 5, async (group) => {
    await registerEvents(group.connection.connectionId, group.events, requestId, "WEBHOOK");
    stored += group.events.length;
  });
  if (grouped.size) await markWebhookConnections([...grouped.values()].map((group) => group.connection), requestId);
  return stored;
}

export async function pollIfoodEvents(client: IfoodClient): Promise<{ received: number; acknowledged: number; unmapped: number }> {
  const connections = rows(await systemIfoodConnectionsForPolling(dc, { requestKey: randomUUID() })) as ConnectionLookup[];
  const merchantIds = [...new Set(connections.map((connection) => connection.externalStoreId.trim()).filter(Boolean))];
  if (!merchantIds.length) return { received: 0, acknowledged: 0, unmapped: 0 };

  let received = 0;
  let acknowledgedCount = 0;
  let unmapped = 0;

  const byMerchant = new Map(connections.map((connection) => [connection.externalStoreId, connection]));
  const processResponse = async (response: Awaited<ReturnType<IfoodClient["pollEvents"]>>, polledMerchants: string[]) => {
    const events = parseIfoodEvents(response.data);
    const acknowledged: string[] = [];
    const grouped = new Map<string, { connection: ConnectionLookup; events: IfoodEvent[] }>();
    received += events.length;

    for (const event of events) {
      if (isIfoodKeepalive(event)) {
        acknowledged.push(event.id);
        continue;
      }
      const connection = byMerchant.get(eventMerchantId(event));
      if (!connection) {
        unmapped += 1;
        acknowledged.push(event.id);
        continue;
      }
      const group = grouped.get(connection.connectionId) ?? { connection, events: [] };
      group.events.push(event);
      grouped.set(connection.connectionId, group);
      acknowledged.push(event.id);
    }
    await mapConcurrent([...grouped.values()], 5, async (group) => registerEvents(group.connection.connectionId, group.events, response.requestId, "POLLING"));

    const uniqueAcknowledged = [...new Set(acknowledged)];
    for (const batch of chunks(uniqueAcknowledged, 100)) await client.acknowledgeEvents(batch);
    acknowledgedCount += uniqueAcknowledged.length;
    await mapConcurrent(polledMerchants, 5, async (merchant) => {
      const connection = byMerchant.get(merchant);
      if (connection) await systemUpdateSalesChannelConnection(dc, { connectionId: connection.connectionId, payload: { polled: true, success: true, requestId: response.requestId } });
    });
  };

  for (const merchantBatch of chunks(merchantIds, 100)) {
    try {
      await processResponse(await client.pollEvents(merchantBatch), merchantBatch);
    } catch (error) {
      if (!(error instanceof IfoodHttpError && error.status === 403)) throw error;
      if (merchantBatch.length === 1) {
        const connection = byMerchant.get(merchantBatch[0]!);
        if (connection) await systemUpdateSalesChannelConnection(dc, { connectionId: connection.connectionId, payload: { status: "SUSPENDED", authorizationStatus: "REVOKED", success: false, requestId: error.requestId, error: "A autorização desta loja foi revogada no iFood." } });
        continue;
      }
      for (const merchant of merchantBatch) {
        try {
          await processResponse(await client.pollEvents([merchant]), [merchant]);
        } catch (merchantError) {
          if (!(merchantError instanceof IfoodHttpError && merchantError.status === 403)) throw merchantError;
          const connection = byMerchant.get(merchant);
          if (connection) {
            await systemUpdateSalesChannelConnection(dc, { connectionId: connection.connectionId, payload: { status: "SUSPENDED", authorizationStatus: "REVOKED", success: false, requestId: merchantError.requestId, error: "A autorização desta loja foi revogada no iFood." } });
          }
        }
      }
    }
  }

  return { received, acknowledged: acknowledgedCount, unmapped };
}

export async function salesChannelHealthSnapshot(): Promise<SalesChannelHealthMetrics | undefined> {
  return box<SalesChannelHealthMetrics>(await systemSalesChannelHealthMetrics(dc, { requestKey: randomUUID() }));
}

async function getOrderSnapshot(client: IfoodClient, orderId: string, grocery: boolean) {
  if (!grocery) return client.getOrder(orderId);
  const [standard, virtualBag] = await Promise.all([client.getOrder(orderId), client.getOrderVirtualBag(orderId)]);
  const data: JsonRecord = { ...standard.data, ...virtualBag.data };
  for (const key of ["delivery", "orderType", "schedule", "createdAt"] as const) {
    if (standard.data[key] !== undefined) data[key] = standard.data[key];
  }
  const canonicalId = firstString(standard.data, "id", "orderId");
  const canonicalStatus = firstString(standard.data, "orderStatus", "status");
  if (canonicalId) data.id = canonicalId;
  if (canonicalStatus) data.orderStatus = canonicalStatus;
  if (standard.data.merchant !== undefined) data.merchant = standard.data.merchant;
  if (standard.data.merchantId !== undefined) data.merchantId = standard.data.merchantId;
  return { ...virtualBag, data };
}

function reconciliationOutcome(command: CommandWork, currentStatus: string, snapshot: ReturnType<typeof normalizeIfoodOrder>): ReconciliationOutcome {
  const action = (command.sourceAction ?? "").toUpperCase();
  if (!action) return firstString(asRecord(command.payload), "sourceCommandId") ? "UNKNOWN" : "APPLIED";
  if (!["ADD_ITEM", "REPLACE_ITEM", "UPDATE_ITEM", "REMOVE_ITEM"].includes(action)) {
    return orderAlreadyApplied(action, currentStatus) ? "APPLIED" : "NOT_APPLIED";
  }
  const source = asRecord(command.sourcePayload);
  const externalItemId = firstString(source, "externalItemId");
  const ean = firstString(source, "ean");
  const quantity = Number(source.quantity);
  const byId = externalItemId ? snapshot.items.find((item) => item.external_item_id === externalItemId) : undefined;
  const byEan = ean ? snapshot.items.filter((item) => item.ean === ean) : [];
  const sameQuantity = (value: number) => Number.isFinite(quantity) && Math.abs(value - quantity) < 0.0005;

  if (action === "REMOVE_ITEM") return externalItemId ? (byId ? "NOT_APPLIED" : "APPLIED") : "UNKNOWN";
  if (action === "UPDATE_ITEM") return externalItemId && Number.isFinite(quantity)
    ? (byId && sameQuantity(byId.quantity) ? "APPLIED" : "NOT_APPLIED")
    : "UNKNOWN";
  if (action === "REPLACE_ITEM") {
    if (!externalItemId || !ean || !Number.isFinite(quantity)) return "UNKNOWN";
    return ((byId?.ean === ean && sameQuantity(byId.quantity)) || byEan.some((item) => sameQuantity(item.quantity))) ? "APPLIED" : "NOT_APPLIED";
  }
  if (!ean || !Number.isFinite(quantity)) return "UNKNOWN";
  return byEan.some((item) => sameQuantity(item.quantity)) ? "APPLIED" : "NOT_APPLIED";
}

async function processEvent(client: IfoodClient, workerId: string, eventWork: EventWork): Promise<void> {
  try {
    const event = parseIfoodEvents(eventWork.payload)[0];
    if (!event) throw new Error("Evento iFood vazio.");
    const orderId = eventOrderId(event);
    const status = eventStatus(event);
    const eventCode = eventType(event).toUpperCase();
    const attentionType = eventCode === "ORDER_CANCELLATION_REQUEST"
      ? "CANCELLATION_REQUEST"
      : eventCode.startsWith("HANDSHAKE_") && !/(RESOLVED|SETTLED|CLOSED|EXPIRED)$/.test(eventCode)
        ? "HANDSHAKE"
        : undefined;
    const clearAttention = eventCode.startsWith("HANDSHAKE_") && /(RESOLVED|SETTLED|CLOSED|EXPIRED)$/.test(eventCode);
    const rawDeadline = firstString(event, "metadata.expiresAt", "metadata.deadline", "expiresAt", "deadline");
    const attentionDeadlineAt = rawDeadline && !Number.isNaN(Date.parse(rawDeadline)) ? new Date(rawDeadline).toISOString() : "";
    const attentionData = attentionType ? {
      eventType: eventCode,
      disputeId: firstString(event, "metadata.disputeId", "disputeId", "metadata.id").slice(0, 160),
      reason: firstString(event, "metadata.reason", "reason").slice(0, 300),
    } : undefined;
    let classification = "UNSUPPORTED";
    if (orderId && isIfoodOrderEvent(event)) {
      // Grocery orders are intentionally imported only when the virtual bag is
      // ready for invoicing. Earlier lifecycle events do not guarantee that
      // the Picking payload is available and must not poison the inbox retry.
      if (eventWork.catalogProfile === "GROCERY" && isIfoodGroceryPreInvoiceEvent(event)) {
        await systemRecordSalesChannelEventResult(dc, {
          eventId: eventWork.id,
          workerId,
          payload: { success: true, acknowledged: true, classification: "IGNORED" },
        });
        return;
      }
      classification = "PROCESSED";
      try {
        const orderResponse = await getOrderSnapshot(client, orderId, eventWork.catalogProfile === "GROCERY");
        assertOrderIdentity(orderResponse.data, orderId, eventWork.externalStoreId ?? "");
        const order = normalizeIfoodOrder(orderResponse.data, eventWork.id, event);
        const importAtReadyForInvoice = eventWork.catalogProfile === "GROCERY" && isIfoodGroceryReadyForInvoiceEvent(event);
        await systemIngestSalesChannelOrder(dc, {
          connectionId: eventWork.connectionId,
          payload: {
            ...order,
            ...(importAtReadyForInvoice ? { partnerStatus: eventCode } : {}),
            workerId,
            merchantId: eventWork.externalStoreId,
            reconciledStatus: importAtReadyForInvoice ? "PENDING" : orderStatusFromCode(order.partnerStatus),
            ...(attentionType ? { attentionType, attentionDeadlineAt, attentionData } : {}),
            ...(clearAttention ? { clearAttention: true } : {}),
          },
        });
      } catch (error) {
        if (!(error instanceof IfoodHttpError && error.status === 404)) throw error;
        if (eventStatus(event) === "PENDING") {
          if (shouldRetryIfoodOrderDetails(event)) {
            throw new IfoodHttpError(
              "O pedido ainda não está disponível no iFood; uma nova tentativa será feita.",
              404,
              error.requestId,
              true,
              retryDelaySeconds(eventWork.attempts + 1),
            );
          }
          throw error;
        }
      }
      if (status) {
        await systemApplySalesChannelOrderEvent(dc, {
          connectionId: eventWork.connectionId,
          providerOrderId: orderId,
          payload: {
            eventId: eventWork.id,
            status,
            workerId,
            merchantId: eventWork.externalStoreId,
            partnerStatus: eventType(event),
            reason: firstString(event, "metadata.reason", "reason"),
            occurredAt: event.createdAt ?? new Date().toISOString(),
          },
        });
      }
      await systemReconcileSalesChannelCommerce(dc, {
        connectionId: eventWork.connectionId,
        providerOrderId: orderId,
        payload: { eventId: eventWork.id, workerId, merchantId: eventWork.externalStoreId },
      });
    }
    await systemRecordSalesChannelEventResult(dc, {
      eventId: eventWork.id,
      workerId,
      payload: { success: true, acknowledged: true, classification },
    });
  } catch (error) {
    const failure = safeError(error, eventWork.attempts + 1);
    await systemRecordSalesChannelEventResult(dc, {
      eventId: eventWork.id,
      workerId,
      payload: { success: false, acknowledged: false, retryable: failure.retryable, error: failure.message },
    });
  }
}

async function processCommand(client: IfoodClient, workerId: string, command: CommandWork): Promise<void> {
  let mutationWithUnknownOutcome = false;
  try {
    if (command.action === "DEACTIVATE_PRODUCT") {
      const catalogProfile = command.catalogProfile ?? "";
      if (!command.externalStoreId || !["GROCERY", "RESTAURANT"].includes(catalogProfile)) throw new Error("A operação de catálogo não corresponde a uma loja iFood autorizada.");
      const merchantId = command.externalStoreId;
      const payload = asRecord(command.payload);
      const barcode = firstString(payload, "barcode");
      const name = firstString(payload, "name");
      let response: { status: number; requestId: string };
      try {
        response = catalogProfile === "GROCERY"
          ? await client.ingestGroceryProducts(merchantId, [{ barcode, name, active: false }], "PATCH")
          : await client.updateCatalogItem(merchantId, barcode, { available: false });
      } catch (error) {
        // Removing an already absent partner item reaches the intended final
        // state and must not leave the whole connection stuck forever.
        if (!(error instanceof IfoodHttpError && error.status === 404)) throw error;
        response = { status: 404, requestId: error.requestId };
      }
      await systemRecordSalesChannelCommandResult(dc, {
        commandId: command.id,
        workerId,
        payload: { success: true, requestId: response.requestId, responseCode: response.status, awaitingPartner: false },
      });
      return;
    }
    if (!command.providerOrderId) throw new Error("Comando sem pedido externo associado.");
    const grocery = command.catalogProfile === "GROCERY";
    if (command.action === "RECONCILE_ORDER") {
      const reconciled = await getOrderSnapshot(client, command.providerOrderId, grocery);
      assertOrderIdentity(reconciled.data, command.providerOrderId, command.externalStoreId ?? "");
      const currentStatus = firstString(reconciled.data, "orderStatus", "status") || command.partnerStatus || "";
      const snapshot = normalizeIfoodOrder(reconciled.data, command.id);
      const outcome = reconciliationOutcome(command, currentStatus, snapshot);
      await systemIngestSalesChannelOrder(dc, {
        connectionId: command.connectionId,
        payload: { ...snapshot, eventId: "", commandId: command.id, workerId, merchantId: command.externalStoreId, reconciledStatus: orderStatusFromCode(currentStatus) },
      });
      await systemRecordSalesChannelCommandResult(dc, {
        commandId: command.id,
        workerId,
        payload: {
          success: true,
          requestId: reconciled.requestId,
          responseCode: reconciled.status,
          partnerStatus: currentStatus,
          awaitingPartner: false,
          reconciliationNotApplied: outcome === "NOT_APPLIED",
          reconciliationUnresolved: outcome === "UNKNOWN",
          ...(outcome === "NOT_APPLIED" ? { error: "A consulta confirmou que a alteração anterior não foi aplicada pelo iFood. Revise o pedido antes de enviá-la novamente." } : {}),
          ...(outcome === "UNKNOWN" ? { error: "O estado atual foi atualizado, mas não foi possível comprovar automaticamente o resultado da alteração anterior." } : {}),
        },
      });
      await systemReconcileSalesChannelCommerce(dc, {
        connectionId: command.connectionId,
        providerOrderId: command.providerOrderId,
        payload: { commandId: command.id, workerId, merchantId: command.externalStoreId },
      });
      return;
    }
    const current = await client.getOrder(command.providerOrderId);
    assertOrderIdentity(current.data, command.providerOrderId, command.externalStoreId ?? "");
    const currentStatus = firstString(current.data, "orderStatus", "status") || command.partnerStatus || "";
    const payload = asRecord(command.payload);
    let response: { status: number; requestId: string } = current;
    let partnerStatus: string | undefined;
    let awaitingPartner = true;
    let pickingSnapshot: ReturnType<typeof normalizeIfoodOrder> | undefined;
    if (["ADD_ITEM", "REPLACE_ITEM", "UPDATE_ITEM", "REMOVE_ITEM"].includes(command.action)) {
      if (!grocery) throw new Error("A operação de separação de itens só é válida para pedidos Mercado.");
      if (currentStatus.toUpperCase() !== "SEPARATION_STARTED") throw new Error("A separação precisa estar iniciada e ainda aberta no iFood para alterar itens.");
      const uniqueId = firstString(payload, "externalItemId");
      const ean = firstString(payload, "ean");
      const quantity = Number(payload.quantity);
      mutationWithUnknownOutcome = true;
      if (command.action === "ADD_ITEM") response = await client.addPickingItem(command.providerOrderId, ean, quantity);
      else if (command.action === "REPLACE_ITEM") response = await client.replacePickingItem(command.providerOrderId, uniqueId, ean, quantity);
      else if (command.action === "UPDATE_ITEM") response = await client.updatePickingItem(command.providerOrderId, uniqueId, quantity);
      else response = await client.removePickingItem(command.providerOrderId, uniqueId);
      mutationWithUnknownOutcome = false;
      awaitingPartner = false;
      try {
        const refreshed = await getOrderSnapshot(client, command.providerOrderId, true);
        assertOrderIdentity(refreshed.data, command.providerOrderId, command.externalStoreId ?? "");
        pickingSnapshot = normalizeIfoodOrder(refreshed.data, command.id);
      } catch {
        try {
          const refreshed = await client.getOrder(command.providerOrderId);
          assertOrderIdentity(refreshed.data, command.providerOrderId, command.externalStoreId ?? "");
          pickingSnapshot = normalizeIfoodOrder(refreshed.data, command.id);
        } catch {
          // The Picking action is already confirmed by HTTP 204. A temporary
          // read failure must not replay a mutation that may not be idempotent.
        }
      }
    } else if (!orderAlreadyApplied(command.action, currentStatus)) {
      partnerStatus = currentStatus;
      if (command.action === "ACCEPT" && grocery) {
        if (!currentStatus.toUpperCase().includes("CONFIRMED")) await client.confirmOrder(command.providerOrderId);
        response = await client.startSeparation(command.providerOrderId);
        partnerStatus = "SEPARATION_STARTED";
        awaitingPartner = false;
      } else if (command.action === "COMPLETE" && grocery) {
        if (currentStatus.toUpperCase() !== "SEPARATION_STARTED") throw new Error("A separação precisa estar iniciada no iFood antes de ser concluída.");
        mutationWithUnknownOutcome = true;
        response = await client.endSeparation(command.providerOrderId);
        mutationWithUnknownOutcome = false;
        partnerStatus = "SEPARATION_ENDED";
        awaitingPartner = false;
        const refreshed = await getOrderSnapshot(client, command.providerOrderId, true);
        assertOrderIdentity(refreshed.data, command.providerOrderId, command.externalStoreId ?? "");
        pickingSnapshot = normalizeIfoodOrder(refreshed.data, command.id);
      } else if (command.action === "ACCEPT") {
        if (!currentStatus.toUpperCase().includes("CONFIRMED")) await client.confirmOrder(command.providerOrderId);
        response = await client.startPreparation(command.providerOrderId);
        partnerStatus = "PREPARATION_STARTED";
      } else if (command.action === "COMPLETE") {
        ifoodCompletionAction(command.orderType ?? "", current.data);
        response = await client.readyToPickup(command.providerOrderId);
        partnerStatus = "READY_TO_PICKUP";
      } else if (command.action === "DISPATCH") {
        if ((command.deliveryProvider ?? "").toUpperCase() !== "MERCHANT") throw new Error("A expedição manual só é válida quando a entrega é realizada pela loja.");
        response = await client.dispatchOrder(command.providerOrderId);
        partnerStatus = "DISPATCHED";
      } else if (command.action === "REJECT" || command.action === "CANCEL") {
        const requestedReason = firstString(payload, "reason");
        const requestedCode = firstString(payload, "cancellationCode");
        const reasons = await client.cancellationReasons(command.providerOrderId);
        const selected = requestedCode
          ? reasons.find((item) => cancellationCode(item) === requestedCode)
          : reasons.find((item) => firstString(item, "description", "reason").toLowerCase() === requestedReason.toLowerCase());
        const code = selected ? cancellationCode(selected) : "";
        if (!code) throw new Error("O pedido exige um motivo de cancelamento elegível no iFood. Confira os motivos no parceiro; nenhum motivo foi escolhido automaticamente.");
        response = await client.requestCancellation(command.providerOrderId, code, requestedReason || firstString(selected, "description", "reason"));
        partnerStatus = "CANCELLATION_REQUESTED";
      } else {
        throw new Error("Ação de pedido não suportada pelo adaptador iFood.");
      }
    } else {
      partnerStatus = currentStatus;
      if (grocery && ((command.action === "ACCEPT" && ["SEPARATION_STARTED", "SEPARATION_ENDED"].includes(currentStatus.toUpperCase()))
        || (command.action === "COMPLETE" && currentStatus.toUpperCase() === "SEPARATION_ENDED"))) awaitingPartner = false;
    }
    if (pickingSnapshot) {
      await systemIngestSalesChannelOrder(dc, {
        connectionId: command.connectionId,
        payload: { ...pickingSnapshot, eventId: "", commandId: command.id, workerId, merchantId: command.externalStoreId, reconciledStatus: orderStatusFromCode(pickingSnapshot.partnerStatus) },
      });
    }
    await systemRecordSalesChannelCommandResult(dc, {
      commandId: command.id,
      workerId,
      payload: { success: true, requestId: response.requestId, responseCode: response.status, ...(partnerStatus ? { partnerStatus } : {}), awaitingPartner },
    });
    await systemReconcileSalesChannelCommerce(dc, {
      connectionId: command.connectionId,
      providerOrderId: command.providerOrderId,
      payload: { commandId: command.id, workerId, merchantId: command.externalStoreId },
    });
  } catch (error) {
    const failure = safeError(error, command.attempts + 1);
    const unknownOutcome = mutationWithUnknownOutcome && failure.retryable;
    await systemRecordSalesChannelCommandResult(dc, {
      commandId: command.id,
      workerId,
      payload: {
        success: false,
        retryable: unknownOutcome ? false : failure.retryable,
        outcomeUnknown: unknownOutcome,
        retryAfterSeconds: failure.retryAfterSeconds,
        requestId: failure.requestId,
        responseCode: failure.status,
        error: failure.message,
      },
    });
  }
}

async function authorizeConnection(client: IfoodClient, workerId: string, job: JobWork): Promise<void> {
  const merchants = await client.merchants();
  const selected = job.externalStoreId
    ? merchants.find((item) => merchantId(item) === job.externalStoreId)
    : merchants.length === 1 ? merchants[0] : undefined;
  if (!selected) {
    if (!job.externalStoreId && merchants.length > 1) throw new Error("Informe o ID oficial da loja iFood antes de autorizar a conexão.");
    throw new Error("A loja informada não está autorizada nas credenciais deste aplicativo iFood.");
  }
  const externalStoreId = merchantId(selected);
  if (!externalStoreId) throw new Error("O iFood não retornou o identificador da loja autorizada.");
  const verified = await client.merchant(externalStoreId);
  const profile = merchantCatalogProfile({ ...selected, ...verified.data });
  const status = await client.merchantStatus(externalStoreId);
  const token = await client.tokenMetadata();
  const restaurantCatalog = profile === "RESTAURANT";
  const groceryCatalog = profile === "GROCERY";
  const verifiedAt = new Date().toISOString();
  const pendingCapability = { state: "PENDING", reason: "Será validado na primeira operação real deste módulo." };
  const notApplicableCapability = { state: "NOT_APPLICABLE", reason: "Este recurso não se aplica ao tipo desta loja." };
  const merchantSnapshot = {
    id: externalStoreId,
    name: firstString(verified.data, "name", "tradingName", "corporateName") || firstString(selected, "name"),
    type: firstString(verified.data, "type", "merchantType", "category") || firstString(selected, "type", "merchantType", "category"),
    status: firstString(status.data, "state", "status", "operation") || "UNKNOWN",
  };
  await systemUpdateSalesChannelConnection(dc, {
    connectionId: job.connectionId,
    payload: {
      externalStoreId,
      expectedExternalStoreId: job.externalStoreId ?? "",
      jobId: job.id, workerId,
      status: profile === "UNVERIFIED" ? "PENDING_APPROVAL" : "ACTIVE",
      authorizationStatus: "AUTHORIZED",
      integrationMode: "HYBRID",
      webhookStatus: "PENDING",
      tokenExpiresAt: token.expiresAt,
      requestId: verified.requestId,
      catalogProfile: profile,
      merchantSnapshot,
      secretReference: "secret-manager://IFOOD_CLIENT_SECRET",
      success: true,
      capabilities: {
        merchant: { state: "VERIFIED", verifiedAt, source: "MERCHANT_API" },
        storeOperations: { state: "VERIFIED", verifiedAt, source: "MERCHANT_STATUS" },
        events: pendingCapability,
        order: pendingCapability,
        catalog: {
          state: profile === "UNVERIFIED" ? "BLOCKED" : "PENDING",
          profile,
          verified: profile !== "UNVERIFIED",
          initialPublication: groceryCatalog ? pendingCapability : notApplicableCapability,
          price: restaurantCatalog || groceryCatalog ? pendingCapability : notApplicableCapability,
          availability: restaurantCatalog || groceryCatalog ? pendingCapability : notApplicableCapability,
          inventoryQuantity: groceryCatalog ? pendingCapability : notApplicableCapability,
        },
        grocerySeparation: groceryCatalog ? pendingCapability : notApplicableCapability,
        financial: pendingCapability,
      },
    },
  });
  await systemRecordSalesChannelSyncResult(dc, {
    jobId: job.id,
    workerId,
    payload: { success: profile !== "UNVERIFIED", retryable: false, error: profile === "UNVERIFIED" ? "O iFood não retornou um tipo de loja compatível com Restaurante ou Mercado." : undefined, totalItems: 1, processedItems: profile === "UNVERIFIED" ? 0 : 1, failedItems: profile === "UNVERIFIED" ? 1 : 0 },
  });
}

async function synchronizeMappings(client: IfoodClient, workerId: string, job: JobWork): Promise<void> {
  if (!job.externalStoreId) throw new Error("A conexão não possui ID oficial da loja iFood.");
  if (!['RESTAURANT', 'GROCERY'].includes(job.catalogProfile ?? "")) throw new Error("A conexão precisa ter o tipo de catálogo confirmado em Configurar antes de enviar produtos.");
  const result = await systemSalesChannelMappingsForSync(dc, { jobId: job.id, workerId, requestKey: randomUUID() });
  const fetched = rows(result) as MappingWork[];
  const mappings = fetched.slice(0, job.catalogProfile === "GROCERY" ? 100 : 6);
  const hasMore = fetched.length > mappings.length;
  let processed = 0;
  let failed = 0;
  let retryableFailure: SafeError | undefined;
  const recordSuccess = async (mapping: MappingWork, confirmationState: "CONFIRMED" | "RECEIVED", partnerOperationId = "") => {
    processed += 1;
    await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: true, confirmationState, partnerOperationId, jobId: job.id, workerId, expectedVersion: mapping.version, snapshotAt: mapping.snapshotAt, effectivePromotionCents: mapping.promotionPriceCents, nextPromotionChangeAt: mapping.nextPromotionChangeAt } });
  };
  const recordFailure = async (mapping: MappingWork, error: unknown) => {
    failed += 1;
    const failure = safeError(error, job.attempts + 1);
    if (failure.retryable) retryableFailure = failure;
    await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: false, error: failure.message, jobId: job.id, workerId, expectedVersion: mapping.version } });
  };

  if (job.jobType === "CATALOG_CONFIRMATION") {
    await mapConcurrent(mappings, 3, async (mapping) => {
      try {
        if (!mapping.partnerOperationId) throw new Error("A sincronização não possui identificador do lote do iFood.");
        const confirmationState = await client.catalogBatchConfirmation(job.externalStoreId!, mapping.partnerOperationId);
        await recordSuccess(mapping, confirmationState, mapping.partnerOperationId);
      } catch (error) {
        await recordFailure(mapping, error);
      }
    });
    const success = failed === 0;
    await systemRecordSalesChannelSyncResult(dc, {
      jobId: job.id,
      workerId,
      payload: {
        success,
        retryable: !success && Boolean(retryableFailure),
        retryAfterSeconds: retryableFailure?.retryAfterSeconds,
        error: success ? undefined : `${failed} lote(s) de catálogo não puderam ser confirmados no iFood.`,
        continuation: success && hasMore,
        cursor: success && hasMore ? mappings.at(-1)?.mappingId : job.cursor,
        totalItems: (job.processedItems ?? 0) + Number(mappings[0]?.remaining ?? 0),
        processedItems: (job.processedItems ?? 0) + (success ? processed : 0),
        failedItems: failed,
      },
    });
    return;
  }

  if (job.catalogProfile === "GROCERY") {
    const groups = [
      { method: "FULL" as const, values: mappings.filter((mapping) => mapping.needsFullPublication) },
      { method: "PATCH" as const, values: mappings.filter((mapping) => !mapping.needsFullPublication) },
    ];
    for (const group of groups) {
      if (!group.values.length) continue;
      const synchronizeBatch = async (values: MappingWork[]): Promise<void> => {
        try {
          const products = values.map((mapping) => groceryProductFromSource({
          barcode: mapping.externalProductId,
          name: mapping.externalProductName || mapping.productName,
          internalCode: mapping.internalCode,
          imageUrl: mapping.imageUrl,
          brand: mapping.brand,
          size: mapping.size,
          sizeType: mapping.sizeType,
          description: mapping.description,
          categoryName: mapping.categoryName,
          subcategoryName: mapping.subcategoryName,
          basePriceCents: mapping.basePriceCents,
          promotionPriceCents: mapping.promotionPriceCents,
          stockQuantity: mapping.stockQuantity,
          includeDetails: group.method === "FULL" || job.jobType === "FULL",
          sendPrice: group.method === "FULL" || (mapping.syncPrice && job.jobType !== "STOCK"),
          sendStock: group.method === "FULL" || (mapping.syncStock && job.jobType !== "PRICE"),
          activate: group.method === "FULL",
        }));
          const response = await client.ingestGroceryProducts(job.externalStoreId!, products, group.method);
          const operationId = firstString(asRecord(response.data), "batchId", "id") || response.requestId;
          await mapConcurrent(values, 8, (mapping) => recordSuccess(mapping, response.status === 202 ? "RECEIVED" : "CONFIRMED", operationId));
        } catch (error) {
          const failure = safeError(error, job.attempts + 1);
          if (failure.retryable || values.length === 1) {
            await mapConcurrent(values, 8, (mapping) => recordFailure(mapping, error));
            return;
          }
          const middle = Math.ceil(values.length / 2);
          await synchronizeBatch(values.slice(0, middle));
          await synchronizeBatch(values.slice(middle));
        }
      };
      await synchronizeBatch(group.values);
    }
  } else await mapConcurrent(mappings, 3, async (mapping) => {
    try {
      const response = await client.updateCatalogItem(job.externalStoreId!, mapping.externalProductId, {
        ...(mapping.syncPrice && job.jobType !== "STOCK" ? { priceCents: Number(mapping.priceCents) } : {}),
        ...(mapping.syncStock && job.jobType !== "PRICE" ? { available: Number(mapping.stockQuantity) > 0 } : {}),
      });
      await recordSuccess(mapping, response.confirmationState, response.operationId || response.requestId);
    } catch (error) {
      await recordFailure(mapping, error);
    }
  });
  const success = failed === 0;
  await systemRecordSalesChannelSyncResult(dc, {
    jobId: job.id,
    workerId,
    payload: {
      success,
      retryable: !success && Boolean(retryableFailure),
      retryAfterSeconds: retryableFailure?.retryAfterSeconds,
      error: success ? undefined : `${failed} produto(s) não foram sincronizados com o iFood.`,
      continuation: success && hasMore,
      cursor: success && hasMore ? mappings.at(-1)?.mappingId : job.cursor,
      totalItems: (job.processedItems ?? 0) + Number(mappings[0]?.remaining ?? 0),
      processedItems: (job.processedItems ?? 0) + (success ? processed : 0),
      failedItems: failed,
    },
  });
}

function utcDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function synchronizeFinancialEvents(client: IfoodClient, workerId: string, job: JobWork): Promise<void> {
  if (!job.externalStoreId) throw new Error("A conexão não possui ID oficial da loja iFood.");
  const now = new Date();
  const checkpoint = asRecord(job.checkpoint);
  const previous = job.lastFinancialSyncAt ? new Date(job.lastFinancialSyncAt) : new Date(now.getTime() - 7 * 86_400_000);
  const safePrevious = Number.isNaN(previous.getTime()) ? new Date(now.getTime() - 7 * 86_400_000) : previous;
  // Re-read one day to absorb delayed events. The database entry key makes the
  // overlap free of duplicates while reducing API and Cloud Function cost.
  const calculatedBegin = new Date(Math.max(now.getTime() - 31 * 86_400_000, safePrevious.getTime() - 86_400_000));
  const beginText = firstString(checkpoint, "beginDate") || utcDate(calculatedBegin);
  const endText = firstString(checkpoint, "endDate") || utcDate(now);
  let page = Math.max(1, Math.floor(Number(checkpoint.page) || 1));
  let processedThisRun = 0;
  let requestId = "";
  let hasNext = false;
  for (let pageCount = 0; pageCount < 5; pageCount += 1) {
    const response = await client.financialEvents(job.externalStoreId, beginText, endText, page, 100);
    requestId = response.requestId || requestId;
    const containers = Array.isArray(response.data) ? response.data.map(asRecord) : [asRecord(response.data)];
    const rawEvents = containers.flatMap((container) => asArray(container.financialEvents));
    const directEvents = rawEvents.length ? rawEvents : (Array.isArray(response.data) && response.data.every((item) => firstString(item, "name")) ? response.data : []);
    const entries = directEvents.map((event) => normalizeIfoodFinancialEvent(event, job.externalStoreId!));
    const unique = [...new Map(entries.map((entry) => [entry.entry_key, entry])).values()];
    await systemUpsertSalesChannelFinancialEvents(dc, { connectionId: job.connectionId, jobId: job.id, workerId, payloads: unique });
    processedThisRun += unique.length;
    hasNext = containers.some((container) => container.hasNextPage === true);
    if (!hasNext) break;
    page += 1;
  }
  const processedTotal = (job.processedItems ?? 0) + processedThisRun;
  await systemRecordSalesChannelSyncResult(dc, {
    jobId: job.id,
    workerId,
    payload: { success: true, requestId, continuation: hasNext, ...(hasNext ? { checkpoint: { beginDate: beginText, endDate: endText, page } } : {}), totalItems: processedTotal, processedItems: processedTotal, failedItems: 0 },
  });
}

async function processJob(client: IfoodClient, workerId: string, job: JobWork): Promise<void> {
  try {
    if (job.jobType === "AUTHORIZATION") await authorizeConnection(client, workerId, job);
    else if (job.jobType === "FINANCIAL") await synchronizeFinancialEvents(client, workerId, job);
    else await synchronizeMappings(client, workerId, job);
  } catch (error) {
    const failure = safeError(error, job.attempts + 1);
    if (job.jobType === "AUTHORIZATION") {
      await systemUpdateSalesChannelConnection(dc, {
        connectionId: job.connectionId,
        payload: { expectedExternalStoreId: job.externalStoreId ?? "", jobId: job.id, workerId, status: "ERROR", authorizationStatus: "ERROR", success: false, requestId: failure.requestId, error: failure.message },
      });
    }
    await systemRecordSalesChannelSyncResult(dc, {
      jobId: job.id,
      workerId,
      payload: {
        success: false,
        retryable: failure.retryable,
        retryAfterSeconds: failure.retryAfterSeconds,
        error: failure.message,
        totalItems: 0,
        processedItems: 0,
        failedItems: 1,
      },
    });
  }
}

export async function drainIfoodWork(client: IfoodClient, maxCycles = 3): Promise<number> {
  const workerId = `ifood-${randomUUID()}`;
  let processed = 0;
  const deadline = Date.now() + 80_000;
  for (let cycle = 0; cycle < maxCycles && Date.now() < deadline; cycle += 1) {
    await systemClaimSalesChannelWork(dc, { provider: "IFOOD", workerId, limit: 4 });
    const queue = box<WorkQueue>(await systemSalesChannelWorkQueue(dc, { workerId, requestKey: randomUUID() }))
      ?? { commands: [], events: [], jobs: [] };
    const count = queue.commands.length + queue.events.length + queue.jobs.length;
    if (!count) break;
    processed += count;
    await Promise.all([
      mapConcurrent(queue.commands, 4, (item) => processCommand(client, workerId, item)),
      mapConcurrent(queue.events, 4, (item) => processEvent(client, workerId, item)),
      mapConcurrent(queue.jobs, 2, (item) => processJob(client, workerId, item)),
    ]);
    if (count < 4) break;
  }
  return processed;
}

export async function queueDueIfoodSynchronizations(): Promise<void> {
  await systemQueueDueSalesChannelSyncJobs(dc, { requestKey: randomUUID() });
}

export async function purgeExpiredPayloads(): Promise<void> {
  await systemPurgeExpiredSalesChannelPayloads(dc, { requestKey: randomUUID() });
}
export async function cancellationReasonsForUser(client: IfoodClient, userId: string, orderId: string): Promise<Array<{ code: string; label: string }>> {
  const selected = rows(await systemSalesChannelOrderForActor(dc, { userId, orderId }))[0];
  if (!selected) throw new Error("ORDER_ACCESS_DENIED");
  const target = asRecord(selected);
  const providerOrderId = firstString(target, "orderId");
  const merchant = firstString(target, "merchantId");
  const order = await client.getOrder(providerOrderId);
  assertOrderIdentity(order.data, providerOrderId, merchant);
  const reasons = await client.cancellationReasons(providerOrderId);
  const unique = new Map<string, string>();
  for (const reason of reasons.slice(0, 100)) {
    const code = cancellationCode(reason).slice(0, 80);
    const label = firstString(reason, "description", "reason").slice(0, 500);
    if (code && label && !unique.has(code)) unique.set(code, label);
  }
  return [...unique].map(([code, label]) => ({ code, label }));
}

async function connectionForActor(userId: string, connectionId: string, manage = false): Promise<JsonRecord> {
  const selected = rows(await systemSalesChannelConnectionForActor(dc, { userId, connectionId }))[0];
  if (!selected) throw new Error("CONNECTION_ACCESS_DENIED");
  const connection = asRecord(selected);
  if (!(manage ? connection.canManage : connection.canAccess)) throw new Error("CONNECTION_ACCESS_DENIED");
  return connection;
}

export async function availableMerchantsForUser(client: IfoodClient, userId: string, connectionId: string): Promise<Array<{ id: string; name: string; type: string; catalogProfile: string }>> {
  await connectionForActor(userId, connectionId, true);
  const merchants = await client.merchants();
  return merchants.flatMap((merchant) => {
    const id = merchantId(merchant);
    if (!id) return [];
    return [{
      id,
      name: firstString(merchant, "name", "tradingName", "corporateName") || `Loja ${id.slice(0, 8)}`,
      type: firstString(merchant, "type", "merchantType", "category") || "Não informado",
      catalogProfile: merchantCatalogProfile(merchant),
    }];
  });
}

export async function merchantOperationForUser(client: IfoodClient, userId: string, connectionId: string, action: string, payload: unknown): Promise<unknown> {
  const connection = await connectionForActor(userId, connectionId, action !== "READ");
  const merchant = firstString(connection, "merchantId");
  if (!merchant || connection.authorizationStatus !== "AUTHORIZED" || connection.status !== "ACTIVE") throw new Error("CONNECTION_NOT_READY");
  if (action === "READ") {
    const [status, openingHours, interruptions] = await Promise.all([
      client.merchantStatus(merchant),
      client.merchantOpeningHours(merchant),
      client.merchantInterruptions(merchant),
    ]);
    return { status: status.data, openingHours: openingHours.data, interruptions: interruptions.data };
  }
  const input = asRecord(payload);
  if (action === "SAVE_HOURS") {
    const shifts = Array.isArray(input.shifts) ? input.shifts as MerchantOpeningShift[] : [];
    return (await client.updateMerchantOpeningHours(merchant, shifts)).data;
  }
  if (action === "CREATE_INTERRUPTION") {
    return (await client.createMerchantInterruption(merchant, {
      id: randomUUID(),
      description: firstString(input, "description"),
      start: firstString(input, "start"),
      end: firstString(input, "end"),
    })).data;
  }
  if (action === "DELETE_INTERRUPTION") return (await client.deleteMerchantInterruption(merchant, firstString(input, "id"))).data;
  throw new Error("MERCHANT_ACTION_INVALID");
}
