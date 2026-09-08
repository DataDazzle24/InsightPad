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

export function eventStatus(event: IfoodEvent): "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED" {
  const code = eventType(event).toUpperCase();
  if (code.includes("CANCEL")) return "CANCELLED";
  if (code.includes("REJECT")) return "REJECTED";
  if (code.includes("CONCLUDED") || code.includes("COMPLETED")) return "COMPLETED";
  if (code.includes("CONFIRMED") || code.includes("PREPARATION") || code.includes("READY") || code.includes("DISPATCH")) return "ACCEPTED";
  return "PENDING";
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

function decimalToCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value * 100));
  if (typeof value !== "string") return 0;
  const normalized = value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
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
    const totalCents = amount(item, "totalPrice", "total", "totalValue") || Math.round(unitCents * quantity);
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
