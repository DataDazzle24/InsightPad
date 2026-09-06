export type SalesChannelProvider = "IFOOD" | "ZE_DELIVERY" | "NINETYNINE_FOOD";

export const SALES_CHANNEL_PROVIDERS: Record<
  SalesChannelProvider,
  { label: string; shortLabel: string; mode: string; capabilities: string[] }
> = {
  IFOOD: {
    label: "iFood",
    shortLabel: "iFood",
    mode: "Eventos + confirmação",
    capabilities: ["Pedidos", "Aceite e recusa", "Catálogo", "Preço", "Estoque"],
  },
  ZE_DELIVERY: {
    label: "Zé Delivery",
    shortLabel: "Zé Delivery",
    mode: "Webhook + contingência",
    capabilities: ["Pedidos", "Aceite e recusa", "Catálogo", "Preço", "Estoque"],
  },
  NINETYNINE_FOOD: {
    label: "99Food",
    shortLabel: "99Food",
    mode: "Webhook",
    capabilities: ["Pedidos", "Aceite e recusa", "Catálogo", "Preço", "Estoque"],
  },
};

export function salesChannelProviderLabel(provider: string) {
  return SALES_CHANNEL_PROVIDERS[provider as SalesChannelProvider]?.label ?? provider;
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

function csvCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
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
