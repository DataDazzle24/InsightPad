import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export type JsonRecord = Record<string, unknown>;

const ifoodEventSchema = z.object({
  id: z.string().trim().min(1).max(200),
  code: z.string().trim().min(1).max(100).optional(),
  fullCode: z.string().trim().min(1).max(100).optional(),
  orderId: z.string().trim().max(160).optional(),
  merchantId: z.string().trim().max(160).optional(),
  createdAt: z.string().trim().max(80).refine((value) => !Number.isNaN(Date.parse(value)), "Data de evento inválida.").optional(),
}).passthrough().refine((event) => Boolean(event.code || event.fullCode), "Evento iFood sem código.");

export type IfoodEvent = z.infer<typeof ifoodEventSchema>;

export type NormalizedOrder = {
  providerOrderId: string;
  displayCode: string;
  partnerStatus: string;
  customerName: string;
  orderType: string;
  paymentMethod: string;
  payments: Array<{
    method: string;
    payment_type: string;
    card_brand: string;
    wallet_name: string;
    currency: string;
    prepaid: boolean;
    amount_cents: number;
    change_for_cents: number | null;
    sequence: number;
  }>;
  adjustments: Array<{
    kind: "BENEFIT" | "ADDITIONAL_FEE";
    target: string;
    target_id: string;
    liable_party: string;
    description: string;
    amount_cents: number;
    sequence: number;
  }>;
  deliveryProvider: IfoodDeliveryProvider;
  deliveryAddress: string;
  notes: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  additionalFeeCents: number;
  prepaidCents: number;
  pendingPaymentCents: number;
  merchantDiscountCents: number;
  ifoodDiscountCents: number;
  paymentIntegrityStatus: "VALID" | "MISSING" | "AMOUNT_MISMATCH" | "CURRENCY_MISMATCH";
  totalCents: number;
  scheduledAt: string;
  preparationStartAt: string;
  snapshotHash: string;
  commerceSourceHash: string;
  receivedAt: string;
  eventId: string;
  items: Array<{
    external_item_id: string;
    external_product_id: string;
    ean: string;
    name: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    observation: string;
  }>;
};

export type NormalizedFinancialEntry = {
  entry_key: string;
  name: string;
  description: string;
  product: string;
  trigger: string;
  reference_type: string;
  reference_id: string;
  classification: "PROVIDER_FEE" | "TRANSFER_CREDIT" | "TRANSFER_DEBIT" | "NON_TRANSFER" | "UNCLASSIFIED";
  amount_cents: number;
  billing_base_cents: number | null;
  has_transfer_impact: boolean;
  competence: string;
  occurred_at: string;
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

export function isIfoodOrderEvent(event: IfoodEvent): boolean {
  if (!eventOrderId(event)) return false;
  const code = eventType(event).toUpperCase();
  return Boolean(ORDER_EVENTS[code]) || code === "ORDER_PATCHED" || code === "ORDER_CANCELLATION_REQUEST" || isIfoodGroceryReadyForInvoiceEvent(event) || code.startsWith("HANDSHAKE_") || code.startsWith("SEPARATION_") || code.startsWith("DELIVERY_");
}

export function isIfoodGroceryReadyForInvoiceEvent(event: IfoodEvent): boolean {
  return ["RFI", "READY_FOR_INVOICE"].includes(eventType(event).toUpperCase());
}

export function isIfoodGroceryPreInvoiceEvent(event: IfoodEvent): boolean {
  return ["PLC", "PLACED", "CFM", "CONFIRMED"].includes(eventType(event).toUpperCase());
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
  return orderStatusFromCode(eventType(event));
}

export function orderStatusFromCode(code: string): OrderStatus | undefined {
  const normalized = code.trim().toUpperCase();
  if (ORDER_EVENTS[normalized]) return ORDER_EVENTS[normalized];
  if (["RFI", "READY_FOR_INVOICE"].includes(normalized)) return "PENDING";
  if (["PLACED", "PENDING"].includes(normalized)) return "PENDING";
  if (["CONFIRMED", "PREPARATION_STARTED", "SEPARATION_STARTED", "SEPARATION_ENDED", "READY_TO_PICKUP", "DISPATCHED"].includes(normalized)) return "ACCEPTED";
  if (["CONCLUDED", "COMPLETED", "DELIVERED"].includes(normalized)) return "COMPLETED";
  if (["CANCELLED", "ORDER_CANCELLED"].includes(normalized)) return "CANCELLED";
  if (["REJECTED", "ORDER_REJECTED"].includes(normalized)) return "REJECTED";
  return undefined;
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
  if (action === "ACCEPT") return ["SEPARATION_STARTED", "SEPARATION_ENDED", "PRS", "PREPARATION_STARTED", "RTP", "READY_TO_PICKUP", "DSP", "DISPATCHED", "CON", "CONCLUDED"].includes(state);
  if (action === "COMPLETE") return ["SEPARATION_ENDED", "RTP", "READY_TO_PICKUP", "DSP", "DISPATCHED", "CON", "CONCLUDED"].includes(state);
  if (action === "DISPATCH") return ["DSP", "DISPATCHED", "CON", "CONCLUDED"].includes(state);
  if (action === "REJECT" || action === "CANCEL") return ["CAN", "CANCELLED", "CANCELLATION_REQUESTED"].includes(state);
  return false;
}

export type IfoodDeliveryProvider = "IFOOD" | "MERCHANT" | "UNKNOWN";
export type IfoodCompletionAction = "READY_TO_PICKUP";

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
  // Preparation completion and dispatch are separate partner operations.
  // Every order first becomes ready; a store-delivery order is dispatched by
  // a second explicit action when its courier actually leaves the store.
  void orderType;
  void order;
  return "READY_TO_PICKUP";
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

export function signedDecimalToCents(value: unknown): number {
  const text = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) throw new Error("O evento financeiro possui valor monetário inválido.");
  const negative = text.startsWith("-");
  const cents = decimalToCents(negative ? text.slice(1) : text);
  return negative ? -cents : cents;
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

function integerCents(value: unknown, ...paths: string[]): number {
  for (const path of paths) {
    const candidate = readPath(value, path);
    if (candidate === undefined || candidate === null || candidate === "") continue;
    const parsed = typeof candidate === "number" ? candidate : Number(candidate);
    if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("O pedido possui valor em centavos inválido.");
    return parsed;
  }
  return 0;
}

function isGroceryVirtualBag(order: unknown): boolean {
  return Boolean(readPath(order, "bag") && typeof readPath(order, "bag") === "object");
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
      // Picking identifies a concrete bag item by uniqueId. Keep it ahead of
      // catalog identifiers so Grocery item modifiers cannot target a SKU by
      // mistake when the same product appears more than once in the order.
      external_item_id: firstString(item, "uniqueId", "id", "externalCode"),
      external_product_id: firstString(item, "externalCode", "product.externalCode", "product.id", "id"),
      ean: firstString(item, "ean", "barcode", "product.ean", "product.barcode").slice(0, 32),
      name: name.slice(0, 240),
      quantity,
      unit_price_cents: unitCents,
      total_cents: totalCents,
      observation: observation.slice(0, 500),
    }] : [];
  });
}

function flattenGroceryItems(items: unknown[]): NormalizedOrder["items"] {
  return items.flatMap((raw, index) => {
    const item = asRecord(raw);
    if (item.unavailable === true) return [];
    const weightGrams = numeric(readPath(item, "weight.value"));
    const quantity = weightGrams > 0 ? weightGrams / 1000 : Math.max(0, numeric(item.quantity, 1));
    if (quantity <= 0) return [];
    const name = firstString(item, "product.name", "name") || `Item ${index + 1}`;
    const totalCents = integerCents(item, "prices.grossValue.value", "price.value");
    const unitCents = integerCents(item, weightGrams > 0 ? "prices.salePriceKg.value" : "prices.unitValue.value");
    return [{
      external_item_id: firstString(item, "uniqueId", "id"),
      external_product_id: firstString(item, "product.externalCode", "product.plu", "product.id"),
      ean: firstString(item, "product.ean", "product.barcode", "ean", "barcode").slice(0, 32),
      name: name.slice(0, 240),
      quantity,
      unit_price_cents: unitCents || Math.round(totalCents / quantity),
      total_cents: totalCents || Math.round(unitCents * quantity),
      observation: firstString(item, "note", "observation").slice(0, 500),
    }];
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

function groceryDeliveryAddress(order: unknown): string {
  const address = asRecord(readPath(order, "operation.delivery.destination"));
  const parts = [
    firstString(address, "streetName", "street"), firstString(address, "streetNumber", "number"),
    firstString(address, "complement"), firstString(address, "district", "neighborhood"),
    firstString(address, "city"), firstString(address, "state"), firstString(address, "zipCode", "postalCode"),
  ].filter(Boolean);
  return parts.join(", ").slice(0, 1000);
}

function benefitTotal(order: unknown): number {
  return asArray(readPath(order, "benefits")).reduce<number>((sum, item) => sum + amount(item, "value"), 0);
}

function normalizePayments(order: unknown, totalCents: number): NormalizedOrder["payments"] {
  const methods = asArray(readPath(order, "payments.methods"));
  const normalized = methods.flatMap((raw, index) => {
    const payment = asRecord(raw);
    const value = amount(payment, "value");
    if (value <= 0) return [];
    return [{
      method: (firstString(payment, "method") || "UNKNOWN").toUpperCase().slice(0, 80),
      payment_type: firstString(payment, "type").toUpperCase().slice(0, 40),
      card_brand: firstString(payment, "card.brand").toUpperCase().slice(0, 80),
      wallet_name: firstString(payment, "wallet.name").slice(0, 80),
      currency: (firstString(payment, "currency") || "BRL").toUpperCase().slice(0, 8),
      prepaid: readPath(payment, "prepaid") === true,
      amount_cents: value,
      change_for_cents: readPath(payment, "cash.changeFor") == null ? null : amount(payment, "cash.changeFor"),
      sequence: index + 1,
    }];
  });
  // Old and partially populated orders may omit methods. Preserve accounting
  // integrity with one explicitly unknown method instead of losing payment.
  return normalized.length || totalCents <= 0 ? normalized : [{
    method: "UNKNOWN", payment_type: "", card_brand: "", wallet_name: "", currency: "BRL",
    prepaid: false, amount_cents: totalCents, change_for_cents: null, sequence: 1,
  }];
}

function normalizeGroceryPayments(order: unknown, totalCents: number): NormalizedOrder["payments"] {
  const methods = asArray(readPath(order, "payment.methods"));
  const normalized = methods.flatMap((raw, index) => {
    const payment = asRecord(raw);
    const value = integerCents(payment, "amount.value");
    if (value <= 0) return [];
    const inPerson = readPath(payment, "inPerson") === true;
    return [{
      method: (firstString(payment, "name", "method") || "UNKNOWN").toUpperCase().slice(0, 80),
      payment_type: (inPerson ? "OFFLINE" : "ONLINE").slice(0, 40),
      card_brand: firstString(payment, "card.brand").toUpperCase().slice(0, 80),
      wallet_name: firstString(payment, "wallet.provider", "wallet.name").slice(0, 80),
      currency: (firstString(payment, "amount.currency", "currency") || "BRL").toUpperCase().slice(0, 8),
      prepaid: !inPerson,
      amount_cents: value,
      change_for_cents: readPath(payment, "cash.changeFor.value") == null ? null : integerCents(payment, "cash.changeFor.value"),
      sequence: index + 1,
    }];
  });
  return normalized.length || totalCents <= 0 ? normalized : [{
    method: "UNKNOWN", payment_type: "", card_brand: "", wallet_name: "", currency: "BRL",
    prepaid: false, amount_cents: totalCents, change_for_cents: null, sequence: 1,
  }];
}

function normalizeAdjustments(order: unknown): NormalizedOrder["adjustments"] {
  const benefits = asArray(readPath(order, "benefits")).flatMap((rawBenefit, benefitIndex) => {
    const benefit = asRecord(rawBenefit);
    const sponsors = asArray(benefit.sponsorshipValues);
    const rows = sponsors.flatMap((rawSponsor, sponsorIndex) => {
      const sponsor = asRecord(rawSponsor);
      const value = amount(sponsor, "value");
      return value > 0 ? [{
        kind: "BENEFIT" as const,
        target: firstString(benefit, "target").toUpperCase().slice(0, 60),
        target_id: firstString(benefit, "targetId").slice(0, 160),
        liable_party: (firstString(sponsor, "name") || "UNKNOWN").toUpperCase().slice(0, 80),
        description: firstString(sponsor, "description", "name").slice(0, 300),
        amount_cents: value,
        sequence: benefitIndex * 100 + sponsorIndex + 1,
      }] : [];
    });
    const fullValue = amount(benefit, "value");
    return rows.length || fullValue <= 0 ? rows : [{
      kind: "BENEFIT" as const,
      target: firstString(benefit, "target").toUpperCase().slice(0, 60),
      target_id: firstString(benefit, "targetId").slice(0, 160),
      liable_party: "UNKNOWN",
      description: firstString(benefit, "campaign.name").slice(0, 300),
      amount_cents: fullValue,
      sequence: benefitIndex * 100 + 1,
    }];
  });
  const fees = asArray(readPath(order, "additionalFees")).flatMap((rawFee, feeIndex) => {
    const fee = asRecord(rawFee);
    const value = amount(fee, "value");
    if (value <= 0) return [];
    const liabilities = asArray(fee.liabilities).map(asRecord).filter((item) => numeric(item.percentage) > 0);
    if (!liabilities.length) return [{
      kind: "ADDITIONAL_FEE" as const,
      target: firstString(fee, "type").toUpperCase().slice(0, 60), target_id: "", liable_party: "UNKNOWN",
      description: firstString(fee, "fullDescription", "description", "type").slice(0, 300), amount_cents: value,
      sequence: 10_000 + feeIndex * 100 + 1,
    }];
    let allocated = 0;
    return liabilities.map((liability, liabilityIndex) => {
      const share = liabilityIndex === liabilities.length - 1
        ? value - allocated
        : Math.max(0, Math.round(value * numeric(liability.percentage) / 100));
      allocated += share;
      return {
        kind: "ADDITIONAL_FEE" as const,
        target: firstString(fee, "type").toUpperCase().slice(0, 60), target_id: "",
        liable_party: (firstString(liability, "name") || "UNKNOWN").toUpperCase().slice(0, 80),
        description: firstString(fee, "fullDescription", "description", "type").slice(0, 300),
        amount_cents: share, sequence: 10_000 + feeIndex * 100 + liabilityIndex + 1,
      };
    }).filter((item) => item.amount_cents > 0);
  });
  return [...benefits, ...fees];
}

function normalizeGroceryAdjustments(order: unknown): NormalizedOrder["adjustments"] {
  const benefits = asArray(readPath(order, "benefit.benefits")).flatMap((rawBenefit, benefitIndex) => {
    const benefit = asRecord(rawBenefit);
    return asArray(benefit.sponsorships).flatMap((rawSponsor, sponsorIndex) => {
      const sponsor = asRecord(rawSponsor);
      const value = integerCents(sponsor, "amount.value");
      if (value <= 0) return [];
      const rawLiability = firstString(sponsor, "sponsor", "name", "type").toUpperCase();
      const liableParty = rawLiability === "OWN"
        ? "IFOOD"
        : rawLiability === "PARTNER"
          ? "MERCHANT"
          : rawLiability || "UNKNOWN";
      return [{
        kind: "BENEFIT" as const,
        target: firstString(benefit, "target").toUpperCase().slice(0, 60),
        target_id: firstString(benefit, "targetId", "id").slice(0, 160),
        liable_party: liableParty.slice(0, 80),
        description: firstString(benefit, "description", "name", "benefitIdentifier").slice(0, 300),
        amount_cents: value,
        sequence: benefitIndex * 100 + sponsorIndex + 1,
      }];
    });
  });
  const fees = asArray(readPath(order, "fees")).flatMap((rawFee, feeIndex) => {
    const fee = asRecord(rawFee);
    const values = asArray(fee.values);
    const candidates = values.length ? values : [fee];
    return candidates.flatMap((rawValue, valueIndex) => {
      const value = asRecord(rawValue);
      const cents = integerCents(value, "amount.value", "value");
      return cents > 0 ? [{
        kind: "ADDITIONAL_FEE" as const,
        target: firstString(fee, "type", "name").toUpperCase().slice(0, 60),
        target_id: "",
        liable_party: (firstString(value, "liability", "sponsor") || "CUSTOMER").toUpperCase().slice(0, 80),
        description: firstString(fee, "description", "name", "type").slice(0, 300),
        amount_cents: cents,
        sequence: 10_000 + feeIndex * 100 + valueIndex + 1,
      }] : [];
    });
  });
  return [...benefits, ...fees];
}

function isoTimestamp(value: unknown, ...paths: string[]): string {
  const text = firstString(value, ...paths);
  const parsed = Date.parse(text);
  return text && !Number.isNaN(parsed) ? new Date(parsed).toISOString() : "";
}

export function normalizeIfoodOrder(order: unknown, inboxEventId: string, sourceEvent?: IfoodEvent): NormalizedOrder {
  const providerOrderId = firstString(order, "id", "orderId") || (sourceEvent ? eventOrderId(sourceEvent) : "");
  if (!providerOrderId) throw new Error("O pedido recebido do iFood não possui identificador.");
  const grocery = isGroceryVirtualBag(order);
  const items = grocery ? flattenGroceryItems(asArray(readPath(order, "bag.items"))) : flattenItems(asArray(readPath(order, "items")));
  if (!items.length) throw new Error("O pedido recebido do iFood não possui itens válidos.");
  const rawPaymentMethods = asArray(readPath(order, grocery ? "payment.methods" : "payments.methods"));
  const paymentsBeforeTotal = grocery ? normalizeGroceryPayments(order, 0) : [];
  const adjustments = grocery ? normalizeGroceryAdjustments(order) : normalizeAdjustments(order);
  const grocerySubtotalCents = grocery ? integerCents(order, "bag.prices.grossValue.value") : 0;
  const groceryDeliveryFeeCents = grocery ? integerCents(order, "operation.delivery.prices.grossValue.value") : 0;
  const groceryDiscountCents = grocery ? adjustments.filter((item) => item.kind === "BENEFIT").reduce((sum, item) => sum + item.amount_cents, 0) : 0;
  const groceryAdditionalFeeCents = grocery ? adjustments.filter((item) => item.kind === "ADDITIONAL_FEE").reduce((sum, item) => sum + item.amount_cents, 0) : 0;
  const totalCents = grocery
    ? paymentsBeforeTotal.reduce((sum, payment) => sum + payment.amount_cents, 0) || integerCents(order, "payment.total.value", "prices.orderAmount.value") || Math.max(0, grocerySubtotalCents + groceryDeliveryFeeCents + groceryAdditionalFeeCents - groceryDiscountCents)
    : amount(order, "total.orderAmount", "total.total", "orderAmount");
  const payments = grocery ? (paymentsBeforeTotal.length ? paymentsBeforeTotal : normalizeGroceryPayments(order, totalCents)) : normalizePayments(order, totalCents);
  const paymentSummary = [...new Set(payments.map((payment) => [payment.method, payment.card_brand, payment.wallet_name].filter(Boolean).join(" / ")))].join(" + ");
  const merchantDiscountCents = adjustments.filter((item) => item.kind === "BENEFIT" && ["MERCHANT", "STORE", "RESTAURANT"].some((name) => item.liable_party.includes(name))).reduce((sum, item) => sum + item.amount_cents, 0);
  const ifoodDiscountCents = adjustments.filter((item) => item.kind === "BENEFIT" && ["IFOOD", "EXTERNAL", "CHAIN"].some((name) => item.liable_party.includes(name))).reduce((sum, item) => sum + item.amount_cents, 0);
  const paymentTotalCents = payments.reduce((sum, payment) => sum + payment.amount_cents, 0);
  const paymentIntegrityStatus: NormalizedOrder["paymentIntegrityStatus"] = rawPaymentMethods.length === 0 && totalCents > 0
    ? "MISSING"
    : payments.some((payment) => payment.currency !== "BRL")
      ? "CURRENCY_MISMATCH"
      : Math.abs(paymentTotalCents - totalCents) > 1
        ? "AMOUNT_MISMATCH"
        : "VALID";
  const partnerStatus = firstString(order, "orderStatus", "status") || (sourceEvent ? eventType(sourceEvent) : "PLACED");
  const normalized = {
    providerOrderId: providerOrderId.slice(0, 160),
    displayCode: (firstString(order, "displayId", "displayCode", "shortCode") || providerOrderId).slice(0, 80),
    partnerStatus: partnerStatus.slice(0, 80),
    customerName: firstString(order, "customer.name", "customer.firstName").slice(0, 160),
    orderType: normalizeOrderType(firstString(order, "orderType", "delivery.mode", "operation.type", "operation.delivery.type")),
    paymentMethod: paymentSummary.slice(0, 80),
    payments,
    adjustments,
    deliveryProvider: ifoodDeliveryProvider(order),
    deliveryAddress: grocery ? groceryDeliveryAddress(order) : deliveryAddress(order),
    notes: firstString(order, "additionalInfo", "observations", "delivery.observations", "operation.delivery.observations").slice(0, 1000),
    subtotalCents: grocery ? grocerySubtotalCents : amount(order, "total.subTotal", "total.subtotal"),
    deliveryFeeCents: grocery ? groceryDeliveryFeeCents : amount(order, "total.deliveryFee"),
    discountCents: grocery ? groceryDiscountCents : amount(order, "total.benefits") || benefitTotal(order),
    additionalFeeCents: grocery ? groceryAdditionalFeeCents : amount(order, "total.additionalFees") || adjustments.filter((item) => item.kind === "ADDITIONAL_FEE").reduce((sum, item) => sum + item.amount_cents, 0),
    prepaidCents: grocery ? payments.filter((payment) => payment.prepaid).reduce((sum, payment) => sum + payment.amount_cents, 0) : amount(order, "payments.prepaid") || payments.filter((payment) => payment.prepaid).reduce((sum, payment) => sum + payment.amount_cents, 0),
    pendingPaymentCents: grocery ? payments.filter((payment) => !payment.prepaid).reduce((sum, payment) => sum + payment.amount_cents, 0) : amount(order, "payments.pending") || payments.filter((payment) => !payment.prepaid).reduce((sum, payment) => sum + payment.amount_cents, 0),
    merchantDiscountCents,
    ifoodDiscountCents,
    paymentIntegrityStatus,
    totalCents,
    scheduledAt: isoTimestamp(order, "schedule.deliveryDateTimeStart", "schedule.deliveryDateTime", "scheduledAt"),
    preparationStartAt: isoTimestamp(order, "schedule.preparationStartDateTime", "preparationStartAt", "operation.preparation.start"),
    receivedAt: isoTimestamp(order, "createdAt") || sourceEvent?.createdAt || new Date().toISOString(),
    eventId: inboxEventId,
    items,
  };
  const orderSnapshot = { ...normalized, receivedAt: undefined, eventId: undefined };
  const canonical = <T>(values: T[]) => [...values].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const commerceSnapshot = {
    providerOrderId: normalized.providerOrderId,
    items: canonical(items),
    payments: canonical(payments),
    adjustments: canonical(adjustments),
    subtotalCents: normalized.subtotalCents,
    deliveryFeeCents: normalized.deliveryFeeCents,
    discountCents: normalized.discountCents,
    additionalFeeCents: normalized.additionalFeeCents,
    merchantDiscountCents,
    ifoodDiscountCents,
    paymentIntegrityStatus,
    totalCents,
  };
  return {
    ...normalized,
    snapshotHash: sha256(JSON.stringify(orderSnapshot)),
    commerceSourceHash: sha256(JSON.stringify(commerceSnapshot)),
  };
}

export function normalizeIfoodFinancialEvent(value: unknown, merchantId: string): NormalizedFinancialEntry {
  const event = asRecord(value);
  const referenceId = firstString(event, "reference.id").slice(0, 160);
  const occurredAt = isoTimestamp(event, "dateTime", "occurredAt");
  const name = (firstString(event, "name") || "UNKNOWN").toUpperCase().slice(0, 100);
  if (!occurredAt) throw new Error("O evento financeiro do iFood não possui data válida.");
  const amountValue = readPath(event, "amount.value");
  if (amountValue === undefined || amountValue === null || amountValue === "") throw new Error("O evento financeiro do iFood não possui valor.");
  const amountCents = signedDecimalToCents(amountValue);
  const baseValue = readPath(event, "billing.baseValue");
  const hasTransferImpact = readPath(event, "hasTransferImpact") === true;
  const explicitFeeNames = new Set([
    "COMMISSION_FEE", "DELIVERY_FEE", "PAYMENT_FEE", "SERVICE_FEE", "PLATFORM_FEE",
    "ANTICIPATION_FEE", "CANCELLATION_FEE", "LOGISTICS_FEE", "MARKETING_FEE",
  ]);
  const classification: NormalizedFinancialEntry["classification"] = !hasTransferImpact
    ? "NON_TRANSFER"
    : amountCents >= 0
      ? "TRANSFER_CREDIT"
      : explicitFeeNames.has(name)
        ? "PROVIDER_FEE"
        : name && name !== "UNKNOWN"
          ? "TRANSFER_DEBIT"
          : "UNCLASSIFIED";
  const normalized = {
    name,
    description: firstString(event, "description").slice(0, 300),
    product: firstString(event, "product").toUpperCase().slice(0, 80),
    trigger: firstString(event, "trigger").toUpperCase().slice(0, 100),
    reference_type: firstString(event, "reference.type").toUpperCase().slice(0, 60),
    reference_id: referenceId,
    classification,
    amount_cents: amountCents,
    billing_base_cents: baseValue === undefined || baseValue === null || baseValue === "" ? null : signedDecimalToCents(baseValue),
    has_transfer_impact: hasTransferImpact,
    competence: firstString(event, "competence").slice(0, 7),
    occurred_at: occurredAt,
  };
  const providerId = firstString(event, "id", "financialEventId", "transactionId");
  const stableIdentity = providerId || [normalized.reference_type,normalized.reference_id,normalized.name,normalized.product,normalized.trigger,normalized.occurred_at,normalized.competence].join(":");
  return { ...normalized, entry_key: sha256(`${merchantId}:${stableIdentity}`) };
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
