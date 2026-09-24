export const SALES_CHANNEL_PROVIDERS = {
  IFOOD: {
    label: "iFood",
    shortLabel: "iFood",
    mode: "Eventos + confirmação",
    capabilities: ["Pedidos", "Aceite e recusa", "Catálogo", "Preço", "Estoque"],
  },
} as const;
export type SalesChannelProvider = keyof typeof SALES_CHANNEL_PROVIDERS;

export function salesChannelProviderLabel(provider: string) {
  const legacyLabels: Record<string, string> = { ZE_DELIVERY: "Zé Delivery", NINETYNINE_FOOD: "99Food" };
  return SALES_CHANNEL_PROVIDERS[provider as SalesChannelProvider]?.label ?? legacyLabels[provider] ?? provider;
}

export function isSalesChannelOperational(connection: {
  active?: boolean;
  enabled: boolean;
  status: string;
  authorizationStatus: string;
}) {
  return connection.active !== false && connection.enabled && connection.status === "ACTIVE" && connection.authorizationStatus === "AUTHORIZED";
}

export function salesChannelHealth(connection: {
  enabled: boolean;
  status: string;
  authorizationStatus: string;
  consecutiveFailures?: number;
}) {
  if (!connection.enabled) return { key: "paused", label: "Pausada" };
  if (connection.status === "ERROR" || connection.status === "SUSPENDED" || (connection.consecutiveFailures ?? 0) > 0) {
    return { key: "error", label: "Atenção necessária" };
  }
  if (connection.authorizationStatus === "AUTHORIZED" && connection.status === "ACTIVE") {
    return { key: "active", label: "Operacional" };
  }
  if (["EXPIRED", "REVOKED", "ERROR"].includes(connection.authorizationStatus)) {
    return { key: "error", label: "Reconexão necessária" };
  }
  return { key: "pending", label: "Em preparação" };
}

export function countActiveFilters(values: Record<string, unknown>) {
  return Object.values(values).filter((value) => value !== "" && value !== null && value !== undefined).length;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa", AUTHORIZED: "Autorizada", NOT_CONNECTED: "Não conectada", PENDING: "Pendente",
  PENDING_APPROVAL: "Aguardando validação", REVOKED: "Revogada", EXPIRED: "Expirada", SUSPENDED: "Suspensa",
  QUEUED: "Na fila", RETRY: "Nova tentativa agendada", PROCESSING: "Processando", AWAITING_PARTNER: "Aguardando iFood",
  RECONCILING: "Conferindo com o iFood", RECONCILIATION_REQUIRED: "Conferência necessária", CONFIRMED: "Confirmado",
  COMPLETED: "Concluído", PARTNER_PENDING: "Recebido pelo iFood", ACKNOWLEDGED: "Confirmado pelo iFood",
  PROCESSED: "Processado", IGNORED: "Ignorado com segurança", UNSUPPORTED: "Evento ainda não utilizado", ERROR: "Com erro",
};

const ACTION_LABELS: Record<string, string> = {
  ACCEPT: "Aceitar pedido", REJECT: "Recusar pedido", COMPLETE: "Concluir preparo", DISPATCH: "Confirmar saída",
  CANCEL: "Solicitar cancelamento", ADD_ITEM: "Adicionar item", REPLACE_ITEM: "Substituir item",
  UPDATE_ITEM: "Alterar quantidade", REMOVE_ITEM: "Remover item", RECONCILE_ORDER: "Conferir pedido",
  DEACTIVATE_PRODUCT: "Desativar produto",
};

const JOB_LABELS: Record<string, string> = {
  AUTHORIZATION: "Validação da conexão", CATALOG: "Catálogo", PRICE: "Preços", STOCK: "Estoque",
  FULL: "Produtos, preços e estoque", FINANCIAL: "Conciliação financeira",
};

export const salesChannelStatusLabel = (value: string) => STATUS_LABELS[value] ?? value;
export const salesChannelActionLabel = (value: string) => ACTION_LABELS[value] ?? value;
export const salesChannelJobLabel = (value: string) => JOB_LABELS[value] ?? value;

const STORE_DAY_INDEX: Record<string, number> = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
const WEEK_MINUTES = 7 * 24 * 60;

export function storeHoursHaveOverlap(shifts: Array<{ dayOfWeek: string; start: string; duration: number }>) {
  const intervals = shifts.flatMap((shift) => {
    const day = STORE_DAY_INDEX[shift.dayOfWeek];
    const [hour, minute] = shift.start.split(":").map(Number);
    if (day === undefined || !Number.isInteger(hour) || !Number.isInteger(minute)) return [];
    const start = day * 1440 + hour! * 60 + minute!;
    return [{ start, end: start + shift.duration }];
  });
  return intervals.some((current, index) => intervals.some((candidate, candidateIndex) => index !== candidateIndex && [-WEEK_MINUTES, 0, WEEK_MINUTES].some((offset) => {
    const start = candidate.start + offset;
    const end = candidate.end + offset;
    return current.start < end && start < current.end;
  })));
}

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  const text = safe.replaceAll('"', '""');
  return `"${text}"`;
}

export function buildSalesChannelCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n")}`;
}

export function downloadSalesChannelCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
