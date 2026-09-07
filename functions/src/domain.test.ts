import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { eventStatus, normalizeIfoodOrder, parseIfoodEvents, retryDelaySeconds, verifyIfoodSignature } from "./domain.js";

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

  it("transforma valores do iFood em centavos e preserva itens", () => {
    const normalized = normalizeIfoodOrder({
      id: "order-1",
      displayId: "1234",
      orderType: "DELIVERY",
      createdAt: "2026-09-07T10:00:00Z",
      customer: { name: "Cliente" },
      total: { subTotal: 25.5, deliveryFee: 4, benefits: 2, orderAmount: 27.5 },
      items: [{ id: "item-1", name: "Produto", quantity: 2, unitPrice: 12.75, totalPrice: 25.5 }],
    }, "00000000-0000-4000-8000-000000000001");
    expect(normalized.subtotalCents).toBe(2550);
    expect(normalized.totalCents).toBe(2750);
    expect(normalized.items[0]).toMatchObject({ quantity: 2, unit_price_cents: 1275, total_cents: 2550 });
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
