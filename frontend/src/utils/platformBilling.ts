export type BillingStatus =
  | "OPEN"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export function parseMoneyToCents(value: string): number {
  const raw = value.replace(/[^\d,.-]/g, "").trim();
  if (!raw) return 0;
  const decimal = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const parsed = Number(decimal);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function formatMoneyFromCents(value: number | string): string {
  const cents = Number(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(cents) ? cents / 100 : 0);
}

export function invoiceRemainingCents(invoice: {
  totalCents: number | string;
  paidCents: number | string;
}): number {
  return Math.max(0, Number(invoice.totalCents) - Number(invoice.paidCents));
}

export function effectiveBillingStatus(
  invoice: {
    status: string;
    dueDate: string;
    totalCents: number | string;
    paidCents: number | string;
  },
  today = new Date().toISOString().slice(0, 10),
): BillingStatus {
  if (invoice.status === "VOID") return "VOID";
  const remaining = invoiceRemainingCents(invoice);
  if (remaining === 0) return "PAID";
  if (invoice.dueDate < today) return "OVERDUE";
  return Number(invoice.paidCents) > 0 ? "PARTIALLY_PAID" : "OPEN";
}

export const billingStatusLabel: Record<BillingStatus, string> = {
  OPEN: "Em aberto",
  PARTIALLY_PAID: "Parcial",
  PAID: "Pago",
  OVERDUE: "Em atraso",
  VOID: "Cancelado",
};

export function datePtBr(value?: string): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}
