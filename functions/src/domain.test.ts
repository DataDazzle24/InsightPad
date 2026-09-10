import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  assertOrderIdentity,
  decimalToCents,
  eventStatus,
  heartbeatMerchantIds,
  ifoodCompletionAction,
  isIfoodKeepalive,
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
    expect(orderAlreadyApplied("COMPLETE", "READY_TO_PICKUP")).toBe(true);
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
    expect(ifoodCompletionAction("DELIVERY", { delivery: { deliveredBy: "MERCHANT" } })).toBe("DISPATCH");
    expect(() => ifoodCompletionAction("DELIVERY", {})).toThrow("não informa quem realiza a entrega");
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
