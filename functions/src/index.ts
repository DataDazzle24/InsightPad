import { logger } from "firebase-functions/logger";
import { onMutationExecuted } from "firebase-functions/dataconnect";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { heartbeatMerchantIds, isIfoodKeepalive, parseIfoodEvents, verifyIfoodSignature, type IfoodEvent } from "./domain.js";
import { IfoodClient } from "./ifood.js";
import {
  connectedHeartbeatMerchants,
  cancellationReasonsForUser,
  drainIfoodWork,
  pollIfoodEvents,
  purgeExpiredPayloads,
  queueDueIfoodSynchronizations,
  registerWebhookEvents,
} from "./worker.js";

const clientId = defineSecret("IFOOD_CLIENT_ID");
const clientSecret = defineSecret("IFOOD_CLIENT_SECRET");
const serviceAccount = defineString("IFOOD_SERVICE_ACCOUNT", {
  default: "insightpad-ifood-adapter@insightpad-dd-dev.iam.gserviceaccount.com",
  description: "Conta de serviço exclusiva do adaptador iFood neste ambiente.",
});

setGlobalOptions({
  region: "southamerica-east1",
  serviceAccount,
  memory: "512MiB",
  timeoutSeconds: 120,
  maxInstances: 5,
  concurrency: 4,
  labels: { component: "ifood-adapter" },
});

let cachedClient: IfoodClient | undefined;
function client(): IfoodClient {
  cachedClient ??= new IfoodClient(clientId.value(), clientSecret.value());
  return cachedClient;
}

const secureWorkerOptions = {
  service: "insightpad",
  connector: "app",
  region: "southamerica-east1" as const,
  secrets: [clientId, clientSecret],
  retry: true,
  maxInstances: 5,
};

async function drainTriggeredWork(): Promise<void> {
  try {
    const count = await drainIfoodWork(client());
    logger.info("Fila iFood processada.", { processed: count });
  } catch (error) {
    logger.error("A fila iFood não pôde ser processada.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    throw new Error("Falha transitória ao processar a fila iFood.");
  }
}

export const onIfoodAuthorizationRequested = onMutationExecuted(
  { ...secureWorkerOptions, operation: "RequestSalesChannelAuthorization" },
  drainTriggeredWork,
);

export const onIfoodSyncRequested = onMutationExecuted(
  { ...secureWorkerOptions, operation: "RequestSalesChannelSync" },
  drainTriggeredWork,
);

export const onIfoodOrderActionQueued = onMutationExecuted(
  { ...secureWorkerOptions, operation: "QueueSalesChannelOrderAction" },
  drainTriggeredWork,
);

export const onIfoodOrderActionRetried = onMutationExecuted(
  { ...secureWorkerOptions, operation: "RetrySalesChannelCommand" },
  drainTriggeredWork,
);

export const onIfoodEventRegistered = onMutationExecuted(
  { ...secureWorkerOptions, operation: "SystemRegisterSalesChannelEvent" },
  drainTriggeredWork,
);

export const ifoodWebhook = onRequest({
  secrets: [clientId, clientSecret],
  invoker: "public",
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 30,
  concurrency: 40,
}, async (request, response) => {
  response.set("Cache-Control", "no-store");
  response.set("X-Content-Type-Options", "nosniff");
  if (request.method !== "POST") {
    response.set("Allow", "POST").status(405).send("Method Not Allowed");
    return;
  }
  const contentType = request.get("content-type")?.toLowerCase() ?? "";
  if (contentType.split(";")[0]?.trim() !== "application/json") {
    response.status(415).send("Unsupported Media Type");
    return;
  }
  const rawBody = request.rawBody;
  if (!rawBody?.length || rawBody.length > 262_144) {
    response.status(413).send("Payload Too Large");
    return;
  }
  const signature = request.get("x-ifood-signature") ?? "";
  const webhookSecret = clientSecret.value();

  if (!verifyIfoodSignature(rawBody, signature, webhookSecret)) {
    const normalizedSignature = signature.trim();
    const signatureWithoutPrefix = normalizedSignature.replace(/^sha256=/i, "");
    const signatureFormat = !normalizedSignature
      ? "MISSING"
      : /^[a-f0-9]{64}$/i.test(signatureWithoutPrefix)
        ? /^sha256=/i.test(normalizedSignature)
          ? "SHA256_PREFIXED_HEX_64"
          : "HEX_64"
        : /^[a-z0-9+/]{43}=$/i.test(normalizedSignature)
          ? "BASE64_44"
          : "UNEXPECTED";

    logger.warn("Webhook iFood recusado por assinatura inválida.", {
      signatureFormat,
      signatureLength: normalizedSignature.length,
      bodyLength: rawBody.length,
    });
    response.status(401).send("Unauthorized");
    return;
  }
  let events: IfoodEvent[];
  try {
    events = parseIfoodEvents(JSON.parse(rawBody.toString("utf8")));
    if (!events.length || events.length > 100) throw new Error("Quantidade de eventos inválida.");
  } catch {
    response.status(400).send("Bad Request");
    return;
  }
  try {
    const keepaliveEvents = events.filter(isIfoodKeepalive);
    const businessEvents = events.filter((event) => !isIfoodKeepalive(event));
    await registerWebhookEvents(businessEvents, request.get("x-request-id") ?? "");

    const requestedMerchantIds = [...new Set(keepaliveEvents.flatMap(heartbeatMerchantIds))];
    if (requestedMerchantIds.length) {
      const merchantIds = await connectedHeartbeatMerchants(keepaliveEvents);
      response.status(202).json({ merchantIds });
      return;
    }
    response.status(202).send();
  } catch (error) {
    logger.error("Webhook iFood válido não pôde ser persistido.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    response.status(503).send("Service Unavailable");
  }
});

export const reconcileIfood = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "America/Sao_Paulo",
  secrets: [clientId, clientSecret],
  timeoutSeconds: 180,
  maxInstances: 1,
}, async () => {
  try {
    const polling = await pollIfoodEvents(client());
    await queueDueIfoodSynchronizations();
    const processed = await drainIfoodWork(client(), 5);
    logger.info("Reconciliação iFood concluída.", { ...polling, processed });
  } catch (error) {
    logger.error("A reconciliação iFood falhou.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    throw new Error("Falha transitória na reconciliação iFood.");
  }
});

export const purgeIfoodPayloads = onSchedule({
  schedule: "every day 03:30",
  timeZone: "America/Sao_Paulo",
  timeoutSeconds: 120,
  maxInstances: 1,
}, async () => {
  try {
    await purgeExpiredPayloads();
    logger.info("Política de retenção dos payloads iFood aplicada.");
  } catch (error) {
    logger.error("A política de retenção iFood falhou.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    throw new Error("Falha transitória ao aplicar a retenção iFood.");
  }
});
export const ifoodCancellationReasons = onCall({
  secrets: [clientId, clientSecret],
  timeoutSeconds: 45,
  maxInstances: 5,
  concurrency: 4,
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Entre novamente para consultar o pedido.");
  const orderId: unknown = request.data?.orderId;
  if (typeof orderId !== "string" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(orderId)) {
    throw new HttpsError("invalid-argument", "Pedido inválido.");
  }
  try {
    return { reasons: await cancellationReasonsForUser(client(), request.auth.uid, orderId) };
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_ACCESS_DENIED") throw new HttpsError("permission-denied", "Pedido indisponível para esta ação.");
    logger.warn("Falha ao consultar motivos de cancelamento iFood.", { errorType: error instanceof Error ? error.name : "UnknownError" });
    throw new HttpsError("unavailable", "Não foi possível consultar os motivos no iFood. Tente novamente.");
  }
});
