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
