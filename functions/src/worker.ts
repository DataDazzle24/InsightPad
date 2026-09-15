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
  systemSalesChannelWorkQueue,
  systemUpdateSalesChannelConnection,
} from "@insightpad/dataconnect-admin";
import {
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
  isIfoodOrderEvent,
  isIfoodKeepalive,
  normalizeIfoodOrder,
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
  partnerStatus?: string;
  catalogProfile?: string;
  action: string;
  payload: unknown;
  attempts: number;
  externalStoreId?: string;
};

type EventWork = {
  id: string;
  connectionId: string;
  providerEventId: string;
  eventType: string;
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
  processedItems?: number;
  attempts: number;
  externalStoreId?: string;
};

type WorkQueue = { commands: CommandWork[]; events: EventWork[]; jobs: JobWork[] };

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

async function processEvent(client: IfoodClient, workerId: string, eventWork: EventWork): Promise<void> {
  try {
    const event = parseIfoodEvents(eventWork.payload)[0];
    if (!event) throw new Error("Evento iFood vazio.");
    const orderId = eventOrderId(event);
    const status = eventStatus(event);
    if (orderId && isIfoodOrderEvent(event)) {
      try {
        const orderResponse = await client.getOrder(orderId);
        assertOrderIdentity(orderResponse.data, orderId, eventWork.externalStoreId ?? "");
        const order = normalizeIfoodOrder(orderResponse.data, eventWork.id, event);
        await systemIngestSalesChannelOrder(dc, {
          connectionId: eventWork.connectionId,
          payload: { ...order, workerId, merchantId: eventWork.externalStoreId, reconciledStatus: orderStatusFromCode(order.partnerStatus) },
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
      payload: { success: true, acknowledged: true },
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
      const response = catalogProfile === "GROCERY"
        ? await client.ingestGroceryProducts(merchantId, [{ barcode, name, active: false }], "PATCH")
        : await client.updateCatalogItem(merchantId, barcode, { available: false });
      await systemRecordSalesChannelCommandResult(dc, {
        commandId: command.id,
        workerId,
        payload: { success: true, requestId: response.requestId, responseCode: response.status, awaitingPartner: false },
      });
      return;
    }
    if (!command.providerOrderId) throw new Error("Comando sem pedido externo associado.");
    const current = await client.getOrder(command.providerOrderId);
    assertOrderIdentity(current.data, command.providerOrderId, command.externalStoreId ?? "");
    const currentStatus = firstString(current.data, "orderStatus", "status") || command.partnerStatus || "";
    const payload = asRecord(command.payload);
    const grocery = command.catalogProfile === "GROCERY";
    if (command.action === "RECONCILE_ORDER") {
      const snapshot = normalizeIfoodOrder(current.data, command.id);
      await systemIngestSalesChannelOrder(dc, {
        connectionId: command.connectionId,
        payload: { ...snapshot, eventId: "", commandId: command.id, workerId, merchantId: command.externalStoreId, reconciledStatus: orderStatusFromCode(currentStatus) },
      });
      await systemRecordSalesChannelCommandResult(dc, {
        commandId: command.id,
        workerId,
        payload: { success: true, requestId: current.requestId, responseCode: current.status, partnerStatus: currentStatus, awaitingPartner: false },
      });
      await systemReconcileSalesChannelCommerce(dc, {
        connectionId: command.connectionId,
        providerOrderId: command.providerOrderId,
        payload: { commandId: command.id, workerId, merchantId: command.externalStoreId },
      });
      return;
    }
    let response: { status: number; requestId: string } = current;
    let partnerStatus: string | undefined;
    let awaitingPartner = true;
    let pickingSnapshot: ReturnType<typeof normalizeIfoodOrder> | undefined;
    if (["ADD_ITEM", "REPLACE_ITEM", "UPDATE_ITEM", "REMOVE_ITEM"].includes(command.action)) {
      if (!grocery) throw new Error("A operação de separação de itens só é válida para pedidos Mercado.");
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
        const refreshed = await client.getOrderVirtualBag(command.providerOrderId);
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
        response = await client.endSeparation(command.providerOrderId);
        partnerStatus = "SEPARATION_ENDED";
        awaitingPartner = false;
        const refreshed = await client.getOrder(command.providerOrderId);
        assertOrderIdentity(refreshed.data, command.providerOrderId, command.externalStoreId ?? "");
        pickingSnapshot = normalizeIfoodOrder(refreshed.data, command.id);
      } else if (command.action === "ACCEPT") {
        if (!currentStatus.toUpperCase().includes("CONFIRMED")) await client.confirmOrder(command.providerOrderId);
        response = await client.startPreparation(command.providerOrderId);
        partnerStatus = "PREPARATION_STARTED";
      } else if (command.action === "COMPLETE") {
        const completionAction = ifoodCompletionAction(command.orderType ?? "", current.data);
        if (completionAction === "DISPATCH") {
          response = await client.dispatchOrder(command.providerOrderId);
          partnerStatus = "DISPATCHED";
        } else {
          response = await client.readyToPickup(command.providerOrderId);
          partnerStatus = "READY_TO_PICKUP";
        }
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
    } else partnerStatus = currentStatus;
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
        merchant: true,
        events: true,
        order: true,
        catalog: {
          profile,
          verified: profile !== "UNVERIFIED",
          initialPublication: groceryCatalog ? "REQUIRES_ITEM_API_APPROVAL" : false,
          price: restaurantCatalog || groceryCatalog,
          availability: restaurantCatalog || groceryCatalog,
          inventoryQuantity: groceryCatalog,
        },
        grocerySeparation: groceryCatalog ? "REQUIRES_PICKING_APPROVAL" : false,
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
  const recordSuccess = async (mapping: MappingWork) => {
    processed += 1;
    await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: true, jobId: job.id, workerId, expectedVersion: mapping.version, snapshotAt: mapping.snapshotAt, effectivePromotionCents: mapping.promotionPriceCents, nextPromotionChangeAt: mapping.nextPromotionChangeAt } });
  };
  const recordFailure = async (mapping: MappingWork, error: unknown) => {
    failed += 1;
    const failure = safeError(error, job.attempts + 1);
    if (failure.retryable) retryableFailure = failure;
    await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: false, error: failure.message, jobId: job.id, workerId, expectedVersion: mapping.version } });
  };

  if (job.catalogProfile === "GROCERY") {
    const groups = [
      { method: "FULL" as const, values: mappings.filter((mapping) => mapping.needsFullPublication) },
      { method: "PATCH" as const, values: mappings.filter((mapping) => !mapping.needsFullPublication) },
    ];
    for (const group of groups) {
      if (!group.values.length) continue;
      try {
        const products = group.values.map((mapping) => groceryProductFromSource({
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
        await client.ingestGroceryProducts(job.externalStoreId, products, group.method);
        await mapConcurrent(group.values, 8, recordSuccess);
      } catch (error) {
        await mapConcurrent(group.values, 8, (mapping) => recordFailure(mapping, error));
      }
    }
  } else await mapConcurrent(mappings, 3, async (mapping) => {
    try {
      await client.updateCatalogItem(job.externalStoreId!, mapping.externalProductId, {
        ...(mapping.syncPrice && job.jobType !== "STOCK" ? { priceCents: Number(mapping.priceCents) } : {}),
        ...(mapping.syncStock && job.jobType !== "PRICE" ? { available: Number(mapping.stockQuantity) > 0 } : {}),
      });
      await recordSuccess(mapping);
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

async function processJob(client: IfoodClient, workerId: string, job: JobWork): Promise<void> {
  try {
    if (job.jobType === "AUTHORIZATION") await authorizeConnection(client, workerId, job);
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
  return merchants.slice(0, 500).flatMap((merchant) => {
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
