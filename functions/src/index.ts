import { logger } from "firebase-functions/logger";
import { onMutationExecuted } from "firebase-functions/dataconnect";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { parseIfoodEvents, verifyIfoodSignature } from "./domain.js";
import { IfoodClient } from "./ifood.js";
import { drainIfoodWork, pollIfoodEvents, purgeExpiredPayloads, queueDueIfoodSynchronizations, registerWebhookEvents } from "./worker.js";

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
  maxInstances: 20,
  concurrency: 20,
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
  maxInstances: 20,
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
  if (!contentType.startsWith("application/json")) {
    response.status(415).send("Unsupported Media Type");
    return;
  }
  const rawBody = request.rawBody;
  if (!rawBody?.length || rawBody.length > 262_144) {
    response.status(413).send("Payload Too Large");
    return;
  }
  const signature = request.get("x-ifood-signature") ?? "";
  if (!verifyIfoodSignature(rawBody, signature, clientSecret.value())) {
    logger.warn("Webhook iFood recusado por assinatura inválida.");
    response.status(401).send("Unauthorized");
    return;
  }
  try {
    const events = parseIfoodEvents(JSON.parse(rawBody.toString("utf8")));
    if (!events.length || events.length > 100) throw new Error("Quantidade de eventos inválida.");
    await registerWebhookEvents(events, request.get("x-request-id") ?? "");
    response.status(204).send();
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
