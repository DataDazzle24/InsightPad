import { randomUUID } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import {
  connectorConfig,
  systemSalesChannelOrderForActor,
  systemApplySalesChannelOrderEvent,
  systemClaimSalesChannelWork,
  systemIfoodConnectionByMerchant,
  systemIfoodConnectionsForPolling,
  systemIngestSalesChannelOrder,
  systemPurgeExpiredSalesChannelPayloads,
  systemQueueDueSalesChannelSyncJobs,
  systemRecordSalesChannelCommandResult,
  systemRecordSalesChannelEventResult,
  systemRecordSalesChannelMappingResult,
  systemRecordSalesChannelSyncResult,
  systemRefreshSalesChannelOrderAfterPicking,
  systemRegisterSalesChannelEvent,
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
  isIfoodKeepalive,
  normalizeIfoodOrder,
  parseIfoodEvents,
  retryDelaySeconds,
  sha256,
  shouldRetryIfoodOrderDetails,
  type IfoodEvent,
  type JsonRecord,
} from "./domain.js";
import { cancellationCode, groceryProductFromSource, IfoodClient, IfoodHttpError, merchantId } from "./ifood.js";

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

export async function connectedHeartbeatMerchants(events: IfoodEvent[], requestId = ""): Promise<string[]> {
  const requested = [...new Set(events.flatMap(heartbeatMerchantIds))];
  const connected = new Set<string>();
  await mapConcurrent(requested, 5, async (merchant) => {
    const connection = await connectionForMerchant(merchant);
    if (!connection) return;
    // A signed KEEPALIVE that names an authorized merchant is positive proof
    // that the partner can reach this exact connection through the webhook.
    // Persist the health transition before acknowledging the merchant.
    await markWebhookActive(connection.connectionId, requestId);
    connected.add(merchant);
  });
  return requested.filter((merchant) => connected.has(merchant));
}

export async function registerEvent(connectionId: string, event: IfoodEvent, requestId = ""): Promise<void> {
  const serialized = JSON.stringify(event);
  const stored = await systemRegisterSalesChannelEvent(dc, {
    connectionId,
    payload: {
      eventId: event.id,
      eventType: eventType(event),
      requestId,
      payloadHash: sha256(serialized),
      payload: event,
      containsPersonalData: true,
    },
  });
  // Polling events are acknowledged only after durable storage (or an exact,
  // idempotent duplicate) is confirmed by PostgreSQL.
  if (executeCount(stored) !== 1) throw new Error("Evento iFood não foi confirmado no armazenamento seguro.");
}

export async function markWebhookActive(connectionId: string, requestId = ""): Promise<void> {
  await systemUpdateSalesChannelConnection(dc, {
    connectionId,
    payload: { webhookStatus: "ACTIVE", integrationMode: "HYBRID", requestId, success: true },
  });
}

export async function registerWebhookEvents(events: IfoodEvent[], requestId = ""): Promise<number> {
  const businessEvents = events.filter((event) => !isIfoodKeepalive(event));
  const activatedConnections = new Set<string>();
  await mapConcurrent(businessEvents, 5, async (event) => {
    const connection = await connectionForMerchant(eventMerchantId(event));
    if (!connection) throw new Error("Evento recebido para loja iFood ainda não vinculada.");
    await registerEvent(connection.connectionId, event, requestId);
    activatedConnections.add(connection.connectionId);
  });
  await Promise.all([...activatedConnections].map((connectionId) => markWebhookActive(connectionId, requestId)));
  return businessEvents.length;
}

export async function pollIfoodEvents(client: IfoodClient): Promise<{ received: number; acknowledged: number; unmapped: number }> {
  const connections = rows(await systemIfoodConnectionsForPolling(dc, { requestKey: randomUUID() })) as ConnectionLookup[];
  const merchantIds = [...new Set(connections.map((connection) => connection.externalStoreId.trim()).filter(Boolean))];
  if (!merchantIds.length) return { received: 0, acknowledged: 0, unmapped: 0 };

  let received = 0;
  let acknowledgedCount = 0;
  let unmapped = 0;

  for (const merchantBatch of chunks(merchantIds, 100)) {
    const response = await client.pollEvents(merchantBatch);
    const events = parseIfoodEvents(response.data);
    const acknowledged: string[] = [];
    received += events.length;

    await mapConcurrent(events, 5, async (event) => {
      if (isIfoodKeepalive(event)) {
        acknowledged.push(event.id);
        return;
      }
      const connection = await connectionForMerchant(eventMerchantId(event));
      if (!connection) {
        unmapped += 1;
        return;
      }
      await registerEvent(connection.connectionId, event, response.requestId);
      acknowledged.push(event.id);
    });

    const uniqueAcknowledged = [...new Set(acknowledged)];
    for (const batch of chunks(uniqueAcknowledged, 100)) await client.acknowledgeEvents(batch);
    acknowledgedCount += uniqueAcknowledged.length;
  }

  return { received, acknowledged: acknowledgedCount, unmapped };
}

async function processEvent(client: IfoodClient, workerId: string, eventWork: EventWork): Promise<void> {
  try {
    const event = parseIfoodEvents(eventWork.payload)[0];
    if (!event) throw new Error("Evento iFood vazio.");
    const orderId = eventOrderId(event);
    const status = eventStatus(event);
    if (orderId && status) {
      try {
        const orderResponse = await client.getOrder(orderId);
        assertOrderIdentity(orderResponse.data, orderId, eventWork.externalStoreId ?? "");
        const order = normalizeIfoodOrder(orderResponse.data, eventWork.id, event);
        await systemIngestSalesChannelOrder(dc, { connectionId: eventWork.connectionId, payload: { ...order, workerId, merchantId: eventWork.externalStoreId } });
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
  try {
    if (command.action === "DEACTIVATE_PRODUCT") {
      if (command.catalogProfile !== "GROCERY" || !command.externalStoreId) throw new Error("A operação de catálogo não corresponde a uma loja Mercado autorizada.");
      const payload = asRecord(command.payload);
      const barcode = firstString(payload, "barcode");
      const name = firstString(payload, "name");
      const response = await client.ingestGroceryProducts(command.externalStoreId, [{ barcode, name, active: false }], "PATCH");
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
    let response: { status: number; requestId: string } = current;
    let partnerStatus: string | undefined;
    let awaitingPartner = true;
    let pickingSnapshot: ReturnType<typeof normalizeIfoodOrder> | undefined;
    if (["ADD_ITEM", "REPLACE_ITEM", "UPDATE_ITEM", "REMOVE_ITEM"].includes(command.action)) {
      if (!grocery) throw new Error("A operação de separação de itens só é válida para pedidos Mercado.");
      const uniqueId = firstString(payload, "externalItemId");
      const ean = firstString(payload, "ean");
      const quantity = Number(payload.quantity);
      if (command.action === "ADD_ITEM") response = await client.addPickingItem(command.providerOrderId, ean, quantity);
      else if (command.action === "REPLACE_ITEM") response = await client.replacePickingItem(command.providerOrderId, uniqueId, ean, quantity);
      else if (command.action === "UPDATE_ITEM") response = await client.updatePickingItem(command.providerOrderId, uniqueId, quantity);
      else response = await client.removePickingItem(command.providerOrderId, uniqueId);
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
    await systemRecordSalesChannelCommandResult(dc, {
      commandId: command.id,
      workerId,
      payload: { success: true, requestId: response.requestId, responseCode: response.status, ...(partnerStatus ? { partnerStatus } : {}), awaitingPartner },
    });
    if (pickingSnapshot) {
      try {
        await systemRefreshSalesChannelOrderAfterPicking(dc, {
          commandId: command.id,
          payload: { ...pickingSnapshot, merchantId: command.externalStoreId },
        });
      } catch {
        // A later partner event will reconcile the order. The confirmed
        // Picking mutation is never retried solely because this read model
        // refresh failed.
      }
    }
  } catch (error) {
    const failure = safeError(error, command.attempts + 1);
    await systemRecordSalesChannelCommandResult(dc, {
      commandId: command.id,
      workerId,
      payload: {
        success: false,
        retryable: failure.retryable,
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
  const token = await client.tokenMetadata();
  const restaurantCatalog = job.catalogProfile === "RESTAURANT";
  const groceryCatalog = job.catalogProfile === "GROCERY";
  await systemUpdateSalesChannelConnection(dc, {
    connectionId: job.connectionId,
    payload: {
      externalStoreId,
      expectedExternalStoreId: job.externalStoreId ?? "",
      jobId: job.id, workerId,
      status: "ACTIVE",
      authorizationStatus: "AUTHORIZED",
      integrationMode: "HYBRID",
      webhookStatus: "PENDING",
      tokenExpiresAt: token.expiresAt,
      requestId: verified.requestId,
      secretReference: "secret-manager://IFOOD_CLIENT_SECRET",
      success: true,
      capabilities: {
        merchant: true,
        events: true,
        order: true,
        catalog: {
          profile: job.catalogProfile ?? "UNVERIFIED",
          initialPublication: groceryCatalog,
          price: restaurantCatalog || groceryCatalog,
          availability: restaurantCatalog || groceryCatalog,
          inventoryQuantity: groceryCatalog,
        },
        grocerySeparation: groceryCatalog,
      },
    },
  });
  await systemRecordSalesChannelSyncResult(dc, {
    jobId: job.id,
    workerId,
    payload: { success: true, totalItems: 1, processedItems: 1, failedItems: 0 },
  });
}

async function synchronizeMappings(client: IfoodClient, workerId: string, job: JobWork): Promise<void> {
  if (!job.externalStoreId) throw new Error("A conexão não possui ID oficial da loja iFood.");
  if (!['RESTAURANT', 'GROCERY'].includes(job.catalogProfile ?? "")) throw new Error("A conexão precisa ter o tipo de catálogo confirmado em Configurar antes de enviar produtos.");
  const result = await systemSalesChannelMappingsForSync(dc, { jobId: job.id, workerId, requestKey: randomUUID() });
  const fetched = rows(result) as MappingWork[];
  const mappings = fetched.slice(0, 6);
  const hasMore = fetched.length > mappings.length;
  let processed = 0;
  let failed = 0;
  let retryableFailure: SafeError | undefined;
  await mapConcurrent(mappings, 3, async (mapping) => {
    try {
      if (job.catalogProfile === "RESTAURANT") {
        await client.updateCatalogItem(job.externalStoreId!, mapping.externalProductId, {
          ...(mapping.syncPrice && job.jobType !== "STOCK" ? { priceCents: Number(mapping.priceCents) } : {}),
          ...(mapping.syncStock && job.jobType !== "PRICE" ? { available: Number(mapping.stockQuantity) > 0 } : {}),
        });
      } else {
        const initialPublication = !mapping.lastSyncedAt || job.jobType === "CATALOG";
        const product = groceryProductFromSource({
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
          includeDetails: initialPublication || job.jobType === "FULL",
          sendPrice: initialPublication || (mapping.syncPrice && job.jobType !== "STOCK"),
          sendStock: initialPublication || (mapping.syncStock && job.jobType !== "PRICE"),
          activate: initialPublication,
        });
        await client.ingestGroceryProducts(job.externalStoreId!, [product], initialPublication ? "FULL" : "PATCH");
      }
      processed += 1;
      await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: true, jobId: job.id, workerId, expectedVersion: mapping.version, snapshotAt: mapping.snapshotAt } });
    } catch (error) {
      failed += 1;
      const failure = safeError(error, job.attempts + 1);
      if (failure.retryable) retryableFailure = failure;
      await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: false, error: failure.message, jobId: job.id, workerId, expectedVersion: mapping.version } });
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
