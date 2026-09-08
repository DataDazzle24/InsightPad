import { describe, expect, it, vi } from "vitest";
import { IfoodClient } from "./ifood.js";

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
});
