import { describe, expect, it, vi } from "vitest";
import { IfoodClient, IfoodHttpError } from "./ifood.js";

describe("cliente iFood", () => {
  it("reutiliza token válido e nunca envia o segredo nas APIs de negócio", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "merchant-1" }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "merchant-1" }]), { status: 200 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await client.merchants();
    await client.merchants();
    expect(fetcher).toHaveBeenCalledTimes(3);
    const firstBusinessRequest = fetcher.mock.calls[1]!;
    expect((firstBusinessRequest[1]?.headers as Record<string, string>).authorization).toBe("Bearer token-seguro-com-tamanho-valido");
    expect(JSON.stringify(firstBusinessRequest)).not.toContain("client-secret");
  });

  it("filtra o polling por loja e envia o acknowledgment como lista direta", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "evt-1", merchantId: "merchant-1" }]), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);

    await client.pollEvents(["merchant-1", " merchant-1 "]);
    await client.acknowledgeEvents(["evt-1"]);

    const pollingRequest = fetcher.mock.calls[1]!;
    expect((pollingRequest[1]?.headers as Record<string, string>)["x-polling-merchants"]).toBe("merchant-1");

    const acknowledgmentRequest = fetcher.mock.calls[2]!;
    expect(JSON.parse(String(acknowledgmentRequest[1]?.body))).toEqual([{ id: "evt-1" }]);
  });

  it("invalida o cache e obtém novo token depois de HTTP 401", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-antigo-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-novo-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "merchant-1" }]), { status: 200 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    expect(await client.merchants()).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("recusa respostas de negócio inválidas sem expor o conteúdo", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("<html>erro intermediário</html>", { status: 200, headers: { "x-request-id": "req-1" } }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.merchants()).rejects.toMatchObject<IfoodHttpError>({ status: 502, retryable: true, requestId: "req-1" });
  });

  it("recusa polling com envelope inesperado", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: "não é uma lista" }), { status: 200 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.pollEvents(["merchant-1"])).rejects.toMatchObject<IfoodHttpError>({ status: 502, retryable: true });
  });

  it("recusa listas inválidas de lojas e motivos de cancelamento", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ merchants: "inválido" }), { status: 200, headers: { "x-request-id": "req-merchant" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ reasons: "inválido" }), { status: 200, headers: { "x-request-id": "req-reasons" } }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.merchants()).rejects.toMatchObject<IfoodHttpError>({ status: 502, retryable: true, requestId: "req-merchant" });
    await expect(client.cancellationReasons("order-1")).rejects.toMatchObject<IfoodHttpError>({ status: 502, retryable: true, requestId: "req-reasons" });
  });

  it("mantém requisições autenticadas exclusivamente na origem oficial", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.request("https://example.com/order/v1.0/orders/1")).rejects.toThrow("Caminho inválido");
    await expect(client.request("/order/v1.0/../token")).rejects.toThrow("Caminho inválido");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("recusa preços zerados ou não inteiros antes de chamar o parceiro", () => {
    const fetcher = vi.fn<typeof fetch>();
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    expect(() => client.updateItemPrice("merchant-1", "item-1", 0)).toThrow("preço positivo");
    expect(() => client.updateItemPrice("merchant-1", "item-1", 10.5)).toThrow("preço positivo");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
