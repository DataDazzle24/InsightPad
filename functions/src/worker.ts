import { randomUUID } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import {
  connectorConfig,
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
  systemRegisterSalesChannelEvent,
  systemSalesChannelMappingsForSync,
  systemSalesChannelWorkQueue,
  systemUpdateSalesChannelConnection,
} from "@insightpad/dataconnect-admin";
import {
  asRecord,
  eventMerchantId,
  eventOrderId,
  eventStatus,
  eventType,
  firstString,
  normalizeIfoodOrder,
  parseIfoodEvents,
  retryDelaySeconds,
  sha256,
  type IfoodEvent,
  type JsonRecord,
} from "./domain.js";
import { cancellationCode, IfoodClient, IfoodHttpError, merchantId } from "./ifood.js";

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
  requestId?: string;
  payload: unknown;
  attempts: number;
};

type JobWork = {
  id: string;
  connectionId: string;
  jobType: string;
  attempts: number;
  externalStoreId?: string;
};

type WorkQueue = { commands: CommandWork[]; events: EventWork[]; jobs: JobWork[] };

type MappingWork = {
  mappingId: string;
  externalProductId: string;
  syncPrice: boolean;
  syncStock: boolean;
  priceCents: string;
  stockQuantity: string;
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
  const safePrefixes = ["O pedido", "Evento iFood", "Comando sem", "Ação de pedido", "O iFood não retornou", "Informe o ID", "A loja informada", "A conexão não possui", "A loja iFood está"];
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

export async function connectionForMerchant(merchant: string): Promise<ConnectionLookup | undefined> {
  if (!merchant.trim()) return undefined;
  const result = await systemIfoodConnectionByMerchant(dc, { merchantId: merchant, requestKey: randomUUID() });
  const matches = rows(result) as ConnectionLookup[];
  if (matches.length > 1) throw new Error("A loja iFood está associada a mais de um ambiente.");
  return matches[0];
}

export async function registerEvent(connectionId: string, event: IfoodEvent, requestId = ""): Promise<void> {
  const serialized = JSON.stringify(event);
  await systemRegisterSalesChannelEvent(dc, {
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
}

export async function markWebhookActive(connectionId: string, requestId = ""): Promise<void> {
  await systemUpdateSalesChannelConnection(dc, {
    connectionId,
    payload: { webhookStatus: "ACTIVE", integrationMode: "HYBRID", requestId, success: true },
  });
}

export async function registerWebhookEvents(events: IfoodEvent[], requestId = ""): Promise<number> {
  const activatedConnections = new Set<string>();
  await mapConcurrent(events, 5, async (event) => {
    const connection = await connectionForMerchant(eventMerchantId(event));
    if (!connection) throw new Error("Evento recebido para loja iFood ainda não vinculada.");
    await registerEvent(connection.connectionId, event, requestId);
    activatedConnections.add(connection.connectionId);
  });
  await Promise.all([...activatedConnections].map((connectionId) => markWebhookActive(connectionId, requestId)));
  return events.length;
}

export async function pollIfoodEvents(client: IfoodClient): Promise<{ received: number; acknowledged: number; unmapped: number }> {
  const connections = rows(await systemIfoodConnectionsForPolling(dc, { requestKey: randomUUID() })) as ConnectionLookup[];
  if (!connections.length) return { received: 0, acknowledged: 0, unmapped: 0 };

  const response = await client.pollEvents();
  const events = parseIfoodEvents(response.data);
  const acknowledged: string[] = [];
  let unmapped = 0;
  await mapConcurrent(events, 5, async (event) => {
    const connection = await connectionForMerchant(eventMerchantId(event));
    if (!connection) {
      unmapped += 1;
      return;
    }
    await registerEvent(connection.connectionId, event, response.requestId);
    acknowledged.push(event.id);
  });
  if (acknowledged.length) await client.acknowledgeEvents(acknowledged);
  return { received: events.length, acknowledged: acknowledged.length, unmapped };
}

async function processEvent(client: IfoodClient, workerId: string, eventWork: EventWork): Promise<void> {
  try {
    const event = parseIfoodEvents(eventWork.payload)[0];
    if (!event) throw new Error("Evento iFood vazio.");
    const orderId = eventOrderId(event);
    if (orderId) {
      try {
        const orderResponse = await client.getOrder(orderId);
        const order = normalizeIfoodOrder(orderResponse.data, eventWork.id, event);
        await systemIngestSalesChannelOrder(dc, { connectionId: eventWork.connectionId, payload: order });
      } catch (error) {
        if (!(error instanceof IfoodHttpError && error.status === 404 && eventStatus(event) !== "PENDING")) throw error;
      }
      await systemApplySalesChannelOrderEvent(dc, {
        connectionId: eventWork.connectionId,
        providerOrderId: orderId,
        payload: {
          eventId: eventWork.id,
          status: eventStatus(event),
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

function orderAlreadyApplied(action: string, partnerStatus: string): boolean {
  const status = partnerStatus.toUpperCase();
  if (action === "ACCEPT") return ["PREPARATION", "READY", "DISPATCH", "CONCLUDED"].some((item) => status.includes(item));
  if (action === "COMPLETE") return ["READY", "DISPATCH", "CONCLUDED", "COMPLETED"].some((item) => status.includes(item));
  if (action === "REJECT" || action === "CANCEL") return status.includes("CANCEL");
  return false;
}

async function processCommand(client: IfoodClient, workerId: string, command: CommandWork): Promise<void> {
  try {
    if (!command.providerOrderId) throw new Error("Comando sem pedido externo associado.");
    const current = await client.getOrder(command.providerOrderId);
    const currentStatus = firstString(current.data, "orderStatus", "status") || command.partnerStatus || "";
    let response: { status: number; requestId: string } = current;
    let partnerStatus = currentStatus;
    if (!orderAlreadyApplied(command.action, currentStatus)) {
      if (command.action === "ACCEPT") {
        if (!currentStatus.toUpperCase().includes("CONFIRMED")) await client.confirmOrder(command.providerOrderId);
        response = await client.startPreparation(command.providerOrderId);
        partnerStatus = "PREPARATION_STARTED";
      } else if (command.action === "COMPLETE") {
        if ((command.orderType ?? "DELIVERY").toUpperCase() === "DELIVERY") {
          response = await client.dispatchOrder(command.providerOrderId);
          partnerStatus = "DISPATCHED";
        } else {
          response = await client.readyToPickup(command.providerOrderId);
          partnerStatus = "READY_TO_PICKUP";
        }
      } else if (command.action === "REJECT" || command.action === "CANCEL") {
        const payload = asRecord(command.payload);
        const requestedReason = firstString(payload, "reason");
        const requestedCode = firstString(payload, "cancellationCode");
        const reasons = await client.cancellationReasons(command.providerOrderId);
        const selected = reasons.find((item) => cancellationCode(item) === requestedCode)
          ?? reasons.find((item) => firstString(item, "description", "reason").toLowerCase().includes(requestedReason.toLowerCase()))
          ?? reasons[0];
        const code = selected ? cancellationCode(selected) : "";
        if (!code) throw new Error("O iFood não retornou um motivo de cancelamento elegível para este pedido.");
        response = await client.requestCancellation(command.providerOrderId, code, requestedReason || firstString(selected, "description", "reason"));
        partnerStatus = "CANCELLATION_REQUESTED";
      } else {
        throw new Error("Ação de pedido não suportada pelo adaptador iFood.");
      }
    }
    await systemRecordSalesChannelCommandResult(dc, {
      commandId: command.id,
      workerId,
      payload: { success: true, requestId: response.requestId, responseCode: response.status, partnerStatus },
    });
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
  await systemUpdateSalesChannelConnection(dc, {
    connectionId: job.connectionId,
    payload: {
      externalStoreId,
      status: "ACTIVE",
      authorizationStatus: "AUTHORIZED",
      integrationMode: "HYBRID",
      webhookStatus: "PENDING",
      tokenExpiresAt: token.expiresAt,
      requestId: verified.requestId,
      secretReference: "secret-manager://IFOOD_CLIENT_SECRET",
      success: true,
      capabilities: { order: true, catalog: true, events: true, merchant: true },
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
  const result = await systemSalesChannelMappingsForSync(dc, { jobId: job.id, requestKey: randomUUID() });
  const mappings = rows(result) as MappingWork[];
  let processed = 0;
  let failed = 0;
  let retryableFailure: SafeError | undefined;
  await mapConcurrent(mappings, 3, async (mapping) => {
    try {
      if (mapping.syncPrice) await client.updateItemPrice(job.externalStoreId!, mapping.externalProductId, Number(mapping.priceCents));
      if (mapping.syncStock) await client.updateItemStatus(job.externalStoreId!, mapping.externalProductId, Number(mapping.stockQuantity) > 0);
      processed += 1;
      await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: true } });
    } catch (error) {
      failed += 1;
      const failure = safeError(error, job.attempts + 1);
      if (failure.retryable) retryableFailure = failure;
      await systemRecordSalesChannelMappingResult(dc, { mappingId: mapping.mappingId, payload: { success: false, error: failure.message } });
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
      totalItems: mappings.length,
      processedItems: processed,
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
        payload: { status: "ERROR", authorizationStatus: "ERROR", success: false, requestId: failure.requestId, error: failure.message },
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
  for (let cycle = 0; cycle < maxCycles; cycle += 1) {
    await systemClaimSalesChannelWork(dc, { provider: "IFOOD", workerId, limit: 20 });
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
    if (count < 20) break;
  }
  return processed;
}

export async function queueDueIfoodSynchronizations(): Promise<void> {
  await systemQueueDueSalesChannelSyncJobs(dc, { requestKey: randomUUID() });
}

export async function purgeExpiredPayloads(): Promise<void> {
  await systemPurgeExpiredSalesChannelPayloads(dc, { requestKey: randomUUID() });
}
