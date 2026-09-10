import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export type JsonRecord = Record<string, unknown>;

const ifoodEventSchema = z.object({
  id: z.string().trim().min(1).max(200),
  code: z.string().trim().max(100).optional(),
  fullCode: z.string().trim().max(100).optional(),
  orderId: z.string().trim().max(160).optional(),
  merchantId: z.string().trim().max(160).optional(),
  createdAt: z.string().trim().max(80).optional(),
}).passthrough();

export type IfoodEvent = z.infer<typeof ifoodEventSchema>;

export type NormalizedOrder = {
  providerOrderId: string;
  displayCode: string;
  partnerStatus: string;
  customerName: string;
  orderType: string;
  paymentMethod: string;
  deliveryAddress: string;
  notes: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  receivedAt: string;
  eventId: string;
  items: Array<{
    external_item_id: string;
    name: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    observation: string;
  }>;
};

export function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => asRecord(current)[key], value);
}

export function firstString(value: unknown, ...paths: string[]): string {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);
  }
  return "";
}

export function parseIfoodEvents(value: unknown): IfoodEvent[] {
  const root = asRecord(value);
  const candidates = Array.isArray(value)
    ? value
    : Array.isArray(root.events)
      ? root.events
      : [value];
  return candidates.map((item) => ifoodEventSchema.parse(item));
}

export function eventMerchantId(event: IfoodEvent): string {
  return firstString(event, "merchantId", "merchant.id", "merchant.uuid");
}

export function eventOrderId(event: IfoodEvent): string {
  return firstString(event, "orderId", "order.id");
}

export function eventType(event: IfoodEvent): string {
  return firstString(event, "fullCode", "code") || "UNKNOWN";
}

export type OrderStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";

// Only explicit lifecycle events change an order. Cancellation requests,
// rejected requests and picking-completed events are NOT terminal order states.
const ORDER_EVENTS: Record<string, OrderStatus> = {
  PLC: "PENDING", PLACED: "PENDING",
  CFM: "ACCEPTED", CONFIRMED: "ACCEPTED",
  PRS: "ACCEPTED", PREPARATION_STARTED: "ACCEPTED",
  RTP: "ACCEPTED", READY_TO_PICKUP: "ACCEPTED",
  DSP: "ACCEPTED", DISPATCHED: "ACCEPTED",
  CON: "COMPLETED", CONCLUDED: "COMPLETED",
  CAN: "CANCELLED", CANCELLED: "CANCELLED",
};

export function eventStatus(event: IfoodEvent): OrderStatus | undefined {
  return ORDER_EVENTS[eventType(event).toUpperCase()];
}

export function assertOrderIdentity(order: unknown, orderId: string, merchantId: string): void {
  if (firstString(order, "id", "orderId") !== orderId ||
      !merchantId || firstString(order, "merchant.id", "merchantId") !== merchantId) {
    throw new Error("O pedido não corresponde à loja e ao identificador da conexão.");
  }
}

export function orderAlreadyApplied(action: string, status: string): boolean {
  const state = status.toUpperCase();
  // ACCEPT is a two-step command (confirm + start preparation). A confirmed
  // order still has to execute the second step after a retry or cold start.
  if (action === "ACCEPT") return ["PRS", "PREPARATION_STARTED", "RTP", "READY_TO_PICKUP", "DSP", "DISPATCHED", "CON", "CONCLUDED"].includes(state);
  if (action === "COMPLETE") return ["RTP", "READY_TO_PICKUP", "DSP", "DISPATCHED", "CON", "CONCLUDED"].includes(state);
  if (action === "REJECT" || action === "CANCEL") return ["CAN", "CANCELLED", "CANCELLATION_REQUESTED"].includes(state);
  return false;
}

export type IfoodDeliveryProvider = "IFOOD" | "MERCHANT" | "UNKNOWN";
export type IfoodCompletionAction = "DISPATCH" | "READY_TO_PICKUP";

export function isIfoodKeepalive(event: IfoodEvent): boolean {
  return eventType(event).toUpperCase() === "KEEPALIVE";
}

export function heartbeatMerchantIds(event: IfoodEvent): string[] {
  const root = asRecord(event);
  const merchantIds = [
    eventMerchantId(event),
    ...asArray(root.merchantIds)
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim()),
  ].filter((item) => item.length > 0);
  return [...new Set(merchantIds)].slice(0, 100);
}

export function shouldRetryIfoodOrderDetails(event: IfoodEvent, nowMs = Date.now()): boolean {
  if (eventStatus(event) !== "PENDING") return false;
  const occurredAt = Date.parse(event.createdAt ?? "");
  return Number.isNaN(occurredAt) || nowMs - occurredAt <= 10 * 60_000;
}

export function ifoodDeliveryProvider(order: unknown): IfoodDeliveryProvider {
  const deliveredBy = firstString(order, "delivery.deliveredBy").toUpperCase();
  if (deliveredBy === "IFOOD") return "IFOOD";
  if (deliveredBy === "MERCHANT") return "MERCHANT";
  return "UNKNOWN";
}

export function ifoodCompletionAction(orderType: string, order: unknown): IfoodCompletionAction {
  if (orderType.toUpperCase() !== "DELIVERY") return "READY_TO_PICKUP";
  const provider = ifoodDeliveryProvider(order);
  if (provider === "MERCHANT") return "DISPATCH";
  if (provider === "IFOOD") return "READY_TO_PICKUP";
  throw new Error("O pedido não informa quem realiza a entrega.");
}

export function decimalToCents(value: unknown): number {
  // API amounts use a decimal point, never locale thousands separators.
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error("O pedido possui valor monetário inválido.");
  const [whole = "0", fraction = ""] = text.split(".");
  const cents = BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2)) + (Number(fraction[2] ?? "0") >= 5 ? 1n : 0n);
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("O pedido possui valor monetário fora do limite.");
  return Number(cents);
}

function numeric(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function amount(value: unknown, ...paths: string[]): number {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (candidate !== undefined && candidate !== null && candidate !== "") return decimalToCents(candidate);
  }
  return 0;
}

function normalizeOrderType(value: string): string {
  const upper = value.toUpperCase();
  if (upper.includes("TAKEOUT") || upper.includes("PICKUP")) return "TAKEOUT";
  if (upper.includes("DINE")) return "DINE_IN";
  return "DELIVERY";
}

function optionDescriptions(items: unknown[]): string[] {
  return items.flatMap((raw) => {
    const item = asRecord(raw);
    const name = firstString(item, "name", "productName");
    const quantity = Math.max(0, numeric(item.quantity, 1));
    const own = name ? [`${quantity > 1 ? `${quantity}× ` : ""}${name}`] : [];
    return own.concat(optionDescriptions(asArray(item.options)));
  });
}

function flattenItems(items: unknown[]): NormalizedOrder["items"] {
  return items.flatMap((raw, index) => {
    const item = asRecord(raw);
    const quantity = Math.max(0, numeric(item.quantity, 1));
    const name = firstString(item, "name", "productName") || `Item ${index + 1}`;
    const unitCents = amount(item, "unitPrice", "unitValue", "price.value", "price");
    const hasTotal = ["totalPrice", "total", "totalValue"].some((key) => item[key] !== undefined && item[key] !== null);
    const totalCents = hasTotal ? amount(item, "totalPrice", "total", "totalValue") : Math.round(unitCents * quantity);
    const complements = optionDescriptions(asArray(item.options));
    const observation = [
      firstString(item, "observations", "observation"),
      complements.length ? `Complementos: ${complements.join(", ")}` : "",
    ].filter(Boolean).join(" · ");
    return quantity > 0 ? [{
      external_item_id: firstString(item, "externalCode", "id", "uniqueId"),
      name: name.slice(0, 240),
      quantity,
      unit_price_cents: unitCents,
      total_cents: totalCents,
      observation: observation.slice(0, 500),
    }] : [];
  });
}

function deliveryAddress(order: unknown): string {
  const address = asRecord(readPath(order, "delivery.deliveryAddress"));
  const city = asRecord(address.city);
  const parts = [
    firstString(address, "streetName"),
    firstString(address, "streetNumber"),
    firstString(address, "complement"),
    firstString(address, "neighborhood"),
    firstString(city, "name"),
    firstString(city, "state"),
    firstString(address, "postalCode"),
  ].filter(Boolean);
  return parts.join(", ").slice(0, 1000);
}

function benefitTotal(order: unknown): number {
  return asArray(readPath(order, "benefits")).reduce<number>((sum, item) => sum + amount(item, "value"), 0);
}

export function normalizeIfoodOrder(order: unknown, inboxEventId: string, sourceEvent?: IfoodEvent): NormalizedOrder {
  const providerOrderId = firstString(order, "id", "orderId") || (sourceEvent ? eventOrderId(sourceEvent) : "");
  if (!providerOrderId) throw new Error("O pedido recebido do iFood não possui identificador.");
  const items = flattenItems(asArray(readPath(order, "items")));
  if (!items.length) throw new Error("O pedido recebido do iFood não possui itens válidos.");
  const payments = asArray(readPath(order, "payments.methods"));
  const payment = payments[0];
  const partnerStatus = firstString(order, "orderStatus", "status") || (sourceEvent ? eventType(sourceEvent) : "PLACED");
  return {
    providerOrderId: providerOrderId.slice(0, 160),
    displayCode: (firstString(order, "displayId", "displayCode") || providerOrderId).slice(0, 80),
    partnerStatus: partnerStatus.slice(0, 80),
    customerName: firstString(order, "customer.name").slice(0, 160),
    orderType: normalizeOrderType(firstString(order, "orderType", "delivery.mode")),
    paymentMethod: firstString(payment, "method", "type", "card.brand").slice(0, 80),
    deliveryAddress: deliveryAddress(order),
    notes: firstString(order, "additionalInfo", "observations", "delivery.observations").slice(0, 1000),
    subtotalCents: amount(order, "total.subTotal", "total.subtotal"),
    deliveryFeeCents: amount(order, "total.deliveryFee"),
    discountCents: amount(order, "total.benefits") || benefitTotal(order),
    totalCents: amount(order, "total.orderAmount", "total.total", "orderAmount"),
    receivedAt: firstString(order, "createdAt") || sourceEvent?.createdAt || new Date().toISOString(),
    eventId: inboxEventId,
    items,
  };
}

export function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyIfoodSignature(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
  const supplied = signatureHeader.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex"));
}

export function retryDelaySeconds(attempt: number, retryAfterSeconds?: number): number {
  if (retryAfterSeconds && Number.isFinite(retryAfterSeconds)) return Math.min(900, Math.max(5, Math.ceil(retryAfterSeconds)));
  const exponential = Math.min(300, 5 * (2 ** Math.max(0, attempt - 1)));
  return Math.ceil(exponential + Math.random() * Math.min(15, exponential / 2));
}
