import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  assertOrderIdentity,
  decimalToCents,
  eventStatus,
  heartbeatMerchantIds,
  ifoodCompletionAction,
  isIfoodGroceryPreInvoiceEvent,
  isIfoodGroceryReadyForInvoiceEvent,
  isIfoodOrderEvent,
  isIfoodKeepalive,
  normalizeIfoodFinancialEvent,
  normalizeIfoodOrder,
  orderAlreadyApplied,
  parseIfoodEvents,
  retryDelaySeconds,
  shouldRetryIfoodOrderDetails,
  verifyIfoodSignature,
} from "./domain.js";

describe("domínio iFood", () => {
  it("valida a assinatura HMAC sem comparar textos de tamanho variável", () => {
    const body = Buffer.from(JSON.stringify([{ id: "evt-1", code: "PLC", merchantId: "merchant-1" }]));
    const signature = createHmac("sha256", "secret").update(body).digest("hex");
    expect(verifyIfoodSignature(body, signature, "secret")).toBe(true);
    expect(verifyIfoodSignature(body, `sha256=${signature}`, "secret")).toBe(true);
    expect(verifyIfoodSignature(body, "invalid", "secret")).toBe(false);
  });

  it("normaliza eventos e impede regressão semântica no adaptador", () => {
    const events = parseIfoodEvents([{ id: "evt-1", fullCode: "CONFIRMED", orderId: "order-1", merchantId: "merchant-1" }]);
    expect(eventStatus(events[0]!)).toBe("ACCEPTED");
    expect(eventStatus({ id: "evt-2", fullCode: "CANCELLED" })).toBe("CANCELLED");
  });

  it("reconhece o gate READY_FOR_INVOICE do fluxo Grocery", () => {
    const placed = { id: "evt-placed", code: "PLC", orderId: "order-1" };
    const ready = { id: "evt-rfi", code: "RFI", orderId: "order-1" };
    expect(isIfoodGroceryPreInvoiceEvent(placed)).toBe(true);
    expect(isIfoodGroceryReadyForInvoiceEvent(ready)).toBe(true);
    expect(isIfoodOrderEvent(ready)).toBe(true);
    expect(eventStatus(ready)).toBe("PENDING");
  });

  it("ignora eventos parecidos que não representam mudança de estado", () => {
    expect(eventStatus({ id: "evt-1", fullCode: "CANCELLATION_REQUESTED" })).toBeUndefined();
    expect(eventStatus({ id: "evt-2", fullCode: "PICKING_COMPLETED" })).toBeUndefined();
    expect(eventStatus({ id: "evt-3", fullCode: "UNKNOWN_NEW_EVENT" })).toBeUndefined();
  });

  it("confirma a identidade exata do pedido e da loja", () => {
    const order = { id: "order-1", merchant: { id: "merchant-1" } };
    expect(() => assertOrderIdentity(order, "order-1", "merchant-1")).not.toThrow();
    expect(() => assertOrderIdentity(order, "order-2", "merchant-1")).toThrow("não corresponde");
    expect(() => assertOrderIdentity(order, "order-1", "merchant-2")).toThrow("não corresponde");
  });

  it("continua a preparação quando apenas a confirmação já foi aplicada", () => {
    expect(orderAlreadyApplied("ACCEPT", "CONFIRMED")).toBe(false);
    expect(orderAlreadyApplied("ACCEPT", "PREPARATION_STARTED")).toBe(true);
    expect(orderAlreadyApplied("ACCEPT", "SEPARATION_STARTED")).toBe(true);
    expect(orderAlreadyApplied("COMPLETE", "READY_TO_PICKUP")).toBe(true);
    expect(orderAlreadyApplied("COMPLETE", "SEPARATION_ENDED")).toBe(true);
    expect(orderAlreadyApplied("DISPATCH", "READY_TO_PICKUP")).toBe(false);
    expect(orderAlreadyApplied("DISPATCH", "DISPATCHED")).toBe(true);
    expect(orderAlreadyApplied("CANCEL", "CANCELLATION_REQUESTED")).toBe(true);
  });

  it("transforma valores do iFood em centavos e preserva itens", () => {
    const normalized = normalizeIfoodOrder({
      id: "order-1",
      displayId: "1234",
      orderType: "DELIVERY",
      createdAt: "2026-09-07T10:00:00Z",
      customer: { name: "Cliente" },
      total: { subTotal: 25.5, deliveryFee: 4, benefits: 2, orderAmount: 27.5 },
      items: [{ id: "item-1", uniqueId: "bag-item-1", externalCode: "sku-1", name: "Produto", quantity: 2, unitPrice: 12.75, totalPrice: 25.5 }],
    }, "00000000-0000-4000-8000-000000000001");
    expect(normalized.subtotalCents).toBe(2550);
    expect(normalized.totalCents).toBe(2750);
    expect(normalized.items[0]).toMatchObject({ external_item_id: "bag-item-1", quantity: 2, unit_price_cents: 1275, total_cents: 2550 });
  });

  it("preserva formas de pagamento, troco e responsáveis pelos descontos", () => {
    const normalized = normalizeIfoodOrder({
      id: "order-payments",
      createdAt: "2026-09-15T10:00:00Z",
      total: { subTotal: 40, deliveryFee: 5, benefits: 4, additionalFees: 1, orderAmount: 42 },
      payments: { methods: [
        { method: "CREDIT", type: "ONLINE", card: { brand: "VISA" }, prepaid: true, value: 30 },
        { method: "CASH", type: "OFFLINE", prepaid: false, value: 12, cash: { changeFor: 20 } },
      ] },
      benefits: [{ value: 4, target: "ITEM", sponsorshipValues: [{ name: "IFOOD", value: 3 }, { name: "MERCHANT", value: 1 }] }],
      additionalFees: [{ type: "SERVICE_FEE", value: 1, liabilities: [{ name: "CUSTOMER", percentage: 100 }] }],
      items: [{ id: "item-1", uniqueId: "bag-1", name: "Combo", quantity: 1, unitPrice: 40, totalPrice: 40 }],
    }, "00000000-0000-4000-8000-000000000002");
    expect(normalized.paymentMethod).toBe("CREDIT / VISA + CASH");
    expect(normalized.prepaidCents).toBe(3000);
    expect(normalized.pendingPaymentCents).toBe(1200);
    expect(normalized.payments[1]).toMatchObject({ method: "CASH", prepaid: false, change_for_cents: 2000 });
    expect(normalized.ifoodDiscountCents).toBe(300);
    expect(normalized.merchantDiscountCents).toBe(100);
    expect(normalized.additionalFeeCents).toBe(100);
    expect(normalized.paymentIntegrityStatus).toBe("VALID");
  });

  it("normaliza a sacola virtual Grocery sem converter centavos uma segunda vez", () => {
    const normalized = normalizeIfoodOrder({
      id: "grocery-order-1",
      shortCode: "G123",
      status: "CONFIRMED",
      createdAt: "2026-09-22T10:00:00Z",
      customer: { name: "Cliente Mercado" },
      bag: {
        prices: { grossValue: { value: 5000, currency: "BRL" } },
        items: [
          { uniqueId: "bag-weight", product: { externalCode: "sku-weight", ean: "789000000001" }, name: "Produto por peso", weight: { value: 500 }, prices: { salePriceKg: { value: 6000 }, grossValue: { value: 3000 } } },
          { uniqueId: "bag-unit", product: { externalCode: "sku-unit", ean: "789000000002", name: "Produto unitário" }, quantity: 2, prices: { unitValue: { value: 1000 }, grossValue: { value: 2000 } } },
        ],
      },
      payment: { methods: [{ name: "PIX", inPerson: false, amount: { value: 4400, currency: "BRL" } }] },
      benefit: { benefits: [{ name: "Campanha", benefitIdentifier: "campaign-1", sponsorships: [{ sponsor: "OWN", amount: { value: 500 } }, { sponsor: "PARTNER", amount: { value: 200 } }] }] },
      fees: [{ type: "SERVICE_FEE", description: "Taxa de serviço", values: [{ amount: { value: 100 }, liability: "CUSTOMER" }] }],
      operation: { preparation: { start: "2026-09-22T10:05:00Z" }, delivery: { destination: { streetName: "Rua Um", streetNumber: "10", district: "Centro", zipCode: "01001000" } } },
    }, "event-grocery-1");

    expect(normalized.displayCode).toBe("G123");
    expect(normalized.items[0]).toMatchObject({ external_item_id: "bag-weight", quantity: 0.5, unit_price_cents: 6000, total_cents: 3000 });
    expect(normalized.items[1]).toMatchObject({ external_product_id: "sku-unit", quantity: 2, unit_price_cents: 1000, total_cents: 2000 });
    expect(normalized.subtotalCents).toBe(5000);
    expect(normalized.totalCents).toBe(4400);
    expect(normalized.discountCents).toBe(700);
    expect(normalized.merchantDiscountCents).toBe(200);
    expect(normalized.ifoodDiscountCents).toBe(500);
    expect(normalized.additionalFeeCents).toBe(100);
    expect(normalized.paymentMethod).toBe("PIX");
    expect(normalized.paymentIntegrityStatus).toBe("VALID");
    expect(normalized.deliveryAddress).toContain("Rua Um");
  });

  it("reconstrói o total Grocery e sinaliza pagamento ausente", () => {
    const normalized = normalizeIfoodOrder({
      id: "grocery-order-without-payment",
      bag: { prices: { grossValue: { value: 2500 } }, items: [{ uniqueId: "bag-1", product: { externalCode: "sku-1" }, name: "Produto", quantity: 1, prices: { unitValue: { value: 2500 }, grossValue: { value: 2500 } } }] },
      benefit: { benefits: [{ sponsorships: [{ sponsor: "OWN", amount: { value: 300 } }] }] },
      fees: [{ type: "SERVICE_FEE", values: [{ amount: { value: 100 }, liability: "CUSTOMER" }] }],
    }, "event-grocery-missing-payment");

    expect(normalized.totalCents).toBe(2300);
    expect(normalized.paymentIntegrityStatus).toBe("MISSING");
    expect(normalized.payments).toEqual([{ method: "UNKNOWN", payment_type: "", card_brand: "", wallet_name: "", currency: "BRL", prepaid: false, amount_cents: 2300, change_for_cents: null, sequence: 1 }]);
  });

  it("marca pagamentos ausentes, divergentes ou em moeda incompatível", () => {
    const base = { id: "order-payment-integrity", total: { orderAmount: 10 }, items: [{ id: "item-1", name: "Produto", quantity: 1, unitPrice: 10, totalPrice: 10 }] };
    expect(normalizeIfoodOrder(base, "00000000-0000-4000-8000-000000000003").paymentIntegrityStatus).toBe("MISSING");
    expect(normalizeIfoodOrder({ ...base, payments: { methods: [{ method: "PIX", value: 9 }] } }, "00000000-0000-4000-8000-000000000004").paymentIntegrityStatus).toBe("AMOUNT_MISMATCH");
    expect(normalizeIfoodOrder({ ...base, payments: { methods: [{ method: "PIX", value: 10, currency: "USD" }] } }, "00000000-0000-4000-8000-000000000005").paymentIntegrityStatus).toBe("CURRENCY_MISMATCH");
  });

  it("separa mudanças operacionais de alterações que exigem corrigir venda e estoque", () => {
    const base = {
      id: "order-stable-hash",
      orderStatus: "CONFIRMED",
      createdAt: "2026-09-21T10:00:00Z",
      total: { subTotal: 10, orderAmount: 10 },
      payments: { methods: [{ method: "PIX", value: 10, prepaid: true }] },
      items: [{ id: "item-1", uniqueId: "bag-1", name: "Produto", quantity: 1, unitPrice: 10, totalPrice: 10 }],
    };
    const first = normalizeIfoodOrder(base, "event-1");
    const repeated = normalizeIfoodOrder(base, "event-2");
    const operational = normalizeIfoodOrder({ ...base, orderStatus: "DISPATCHED" }, "event-3");
    const commercial = normalizeIfoodOrder({ ...base, total: { subTotal: 11, orderAmount: 11 }, payments: { methods: [{ method: "PIX", value: 11, prepaid: true }] } }, "event-4");

    expect(repeated.snapshotHash).toBe(first.snapshotHash);
    expect(operational.snapshotHash).not.toBe(first.snapshotHash);
    expect(operational.commerceSourceHash).toBe(first.commerceSourceHash);
    expect(commercial.commerceSourceHash).not.toBe(first.commerceSourceHash);
  });

  it("normaliza eventos financeiros assinados em centavos sem arredondamento binário", () => {
    const normalized = normalizeIfoodFinancialEvent({
      id: "financial-1",
      name: "COMMISSION_FEE",
      description: "Comissão do pedido",
      product: "FOOD",
      trigger: "ORDER_COMPLETED",
      reference: { type: "ORDER", id: "order-1" },
      amount: { value: "-4.35" },
      billing: { baseValue: "29.00" },
      hasTransferImpact: true,
      competence: "2026-09",
      dateTime: "2026-09-15T12:00:00Z",
    }, "merchant-1");
    expect(normalized).toMatchObject({
      name: "COMMISSION_FEE",
      reference_id: "order-1",
      amount_cents: -435,
      billing_base_cents: 2900,
      has_transfer_impact: true,
      classification: "PROVIDER_FEE",
    });
    expect(normalized.entry_key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("converte decimais sem erros de ponto flutuante ou formato local", () => {
    expect(decimalToCents("1.005")).toBe(101);
    expect(decimalToCents(25.5)).toBe(2550);
    expect(() => decimalToCents("1.234,56")).toThrow("valor monetário inválido");
    expect(() => decimalToCents(-1)).toThrow("valor monetário inválido");
  });

  it("separa keepalive de eventos de negócio e normaliza as lojas consultadas", () => {
    const event = parseIfoodEvents({
      id: "evt-heartbeat",
      fullCode: "KEEPALIVE",
      merchantId: "merchant-1",
      merchantIds: ["merchant-1", " merchant-2 ", ""],
    })[0]!;
    expect(isIfoodKeepalive(event)).toBe(true);
    expect(heartbeatMerchantIds(event)).toEqual(["merchant-1", "merchant-2"]);
  });

  it("escolhe a conclusão conforme o responsável pela entrega", () => {
    expect(ifoodCompletionAction("TAKEOUT", {})).toBe("READY_TO_PICKUP");
    expect(ifoodCompletionAction("DELIVERY", { delivery: { deliveredBy: "IFOOD" } })).toBe("READY_TO_PICKUP");
    expect(ifoodCompletionAction("DELIVERY", { delivery: { deliveredBy: "MERCHANT" } })).toBe("READY_TO_PICKUP");
    expect(ifoodCompletionAction("DELIVERY", {})).toBe("READY_TO_PICKUP");
  });

  it("limita a repetição do detalhe do pedido a dez minutos", () => {
    const now = Date.parse("2026-09-08T10:10:00Z");
    expect(shouldRetryIfoodOrderDetails({ id: "evt-1", fullCode: "PLACED", createdAt: "2026-09-08T10:00:01Z" }, now)).toBe(true);
    expect(shouldRetryIfoodOrderDetails({ id: "evt-2", fullCode: "PLACED", createdAt: "2026-09-08T09:59:59Z" }, now)).toBe(false);
    expect(shouldRetryIfoodOrderDetails({ id: "evt-3", fullCode: "CANCELLED", createdAt: "2026-09-08T10:09:59Z" }, now)).toBe(false);
  });

  it("aplica espera exponencial limitada e respeita Retry-After", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(retryDelaySeconds(1)).toBe(5);
    expect(retryDelaySeconds(20)).toBe(300);
    expect(retryDelaySeconds(1, 2)).toBe(5);
    expect(retryDelaySeconds(1, 1200)).toBe(900);
    vi.restoreAllMocks();
  });
});
