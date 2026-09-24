import { describe, expect, it, vi } from "vitest";
import { groceryProductFromSource, IfoodClient, IfoodHttpError } from "./ifood.js";

describe("cliente iFood", () => {
  it("pagina todas as lojas autorizadas sem truncar o onboarding", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ id: `merchant-${index + 1}` }));
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(firstPage), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "merchant-101" }]), { status: 200 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);

    await expect(client.merchants()).resolves.toHaveLength(101);
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://merchant-api.ifood.com.br/merchant/v1.0/merchants?page=1&size=100");
    expect(fetcher.mock.calls[2]?.[0]).toBe("https://merchant-api.ifood.com.br/merchant/v1.0/merchants?page=2&size=100");
  });

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

  it("interrompe respostas excessivas antes de mantê-las em memória", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200, headers: { "content-length": String(3 * 1024 * 1024), "x-request-id": "req-large" } }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.merchants()).rejects.toMatchObject<IfoodHttpError>({ status: 502, retryable: true, requestId: "req-large" });
  });

  it("converte UTF-8 inválido do parceiro em falha controlada", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(new Uint8Array([0xc3, 0x28]), { status: 200, headers: { "x-request-id": "req-encoding" } }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.merchants()).rejects.toMatchObject<IfoodHttpError>({ status: 502, retryable: true, requestId: "req-encoding" });
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

  it("atualiza preço e disponibilidade pelos contratos específicos do catálogo", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.updateCatalogItem("merchant-1", "item-1", { priceCents: 2590, available: false }))
      .resolves.toMatchObject({ confirmationState: "CONFIRMED" });
    expect(fetcher.mock.calls.slice(1).map((call) => [call[0], call[1]?.method, JSON.parse(String(call[1]?.body))])).toEqual([
      ["https://merchant-api.ifood.com.br/catalog/v2.0/merchants/merchant-1/items/price", "PATCH", { itemId: "item-1", price: { value: 25.9 } }],
      ["https://merchant-api.ifood.com.br/catalog/v2.0/merchants/merchant-1/items/status", "PATCH", { itemId: "item-1", status: "UNAVAILABLE" }],
    ]);
  });

  it("só confirma a publicação assíncrona depois de consultar o lote", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ batchId: "batch-1" }), { status: 202, headers: { "x-request-id": "req-received" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ batchStatus: "COMPLETED", results: [{ status: "SUCCESS" }] }), { status: 200, headers: { "x-request-id": "req-confirmed" } }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);

    await expect(client.updateCatalogItem("merchant-1", "item-1", { priceCents: 2590 })).resolves.toMatchObject({
      confirmationState: "CONFIRMED",
      operationId: "batch-1",
    });
    expect(fetcher.mock.calls[2]?.[0]).toBe("https://merchant-api.ifood.com.br/catalog/v2.0/merchants/merchant-1/batch/batch-1");
  });

  it("mantém um lote pendente como recebido para reconciliação posterior", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ batchStatus: "PROCESSING" }), { status: 200 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);

    await expect(client.catalogBatchConfirmation("merchant-1", "batch-pending")).resolves.toBe("RECEIVED");
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://merchant-api.ifood.com.br/catalog/v2.0/merchants/merchant-1/batch/batch-pending");
  });

  it("não mascara a recusa assíncrona de um item do catálogo", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ batchId: "batch-2" }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ batchStatus: "COMPLETED", failureCount: 1, results: [{ status: "FAILED" }] }), { status: 200, headers: { "x-request-id": "req-failed" } }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);

    await expect(client.updateCatalogItem("merchant-1", "item-1", { available: true }))
      .rejects.toMatchObject<IfoodHttpError>({ status: 422, retryable: false, requestId: "req-failed" });
  });

  it("monta e publica um produto Grocery sem jamais solicitar reset do catálogo", async () => {
    const product = groceryProductFromSource({
      barcode: "7890000000000", name: "Arroz integral", internalCode: "ARROZ-01", brand: "Marca", imageUrl: "https://cdn.example.com/arroz.jpg",
      categoryName: "Mercearia", subcategoryName: "Arroz", basePriceCents: "2590", promotionPriceCents: "2390",
      stockQuantity: "8.5", includeDetails: true, sendPrice: true, sendStock: true, activate: true,
    });
    expect(product).toEqual({
      barcode: "7890000000000", name: "Arroz integral", plu: "ARROZ-01", active: true,
      details: { categorization: { category: "Mercearia", subCategory: "Arroz" }, brand: "Marca", imageUrl: "https://cdn.example.com/arroz.jpg" },
      prices: { price: 25.9, promotionPrice: 23.9 }, inventory: { stock: 8.5 },
    });
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await client.ingestGroceryProducts("merchant-1", [product], "FULL");
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://merchant-api.ifood.com.br/item/v1.0/ingestion/merchant-1?reset=false");
    expect(fetcher.mock.calls[1]?.[1]?.method).toBe("POST");
  });

  it("usa os contratos oficiais de separação e alteração da sacola Grocery", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValue(new Response(null, { status: 204 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await client.startSeparation("order-1");
    await client.endSeparation("order-1");
    await client.addPickingItem("order-1", "7890000000000", 1.5);
    await client.replacePickingItem("order-1", "bag-item-1", "7890000000001", 2);
    await client.updatePickingItem("order-1", "bag-item-1", 1);
    await client.removePickingItem("order-1", "bag-item-1");
    expect(fetcher.mock.calls.slice(1).map((call) => [call[0], call[1]?.method, call[1]?.body ? JSON.parse(String(call[1].body)) : undefined])).toEqual([
      ["https://merchant-api.ifood.com.br/picking/v1.0/orders/order-1/startSeparation", "POST", undefined],
      ["https://merchant-api.ifood.com.br/picking/v1.0/orders/order-1/endSeparation", "POST", undefined],
      ["https://merchant-api.ifood.com.br/picking/v1.0/orders/order-1/items", "POST", { quantity: 1.5, ean: "7890000000000" }],
      ["https://merchant-api.ifood.com.br/picking/v1.0/orders/order-1/items/bag-item-1/replace", "POST", { quantity: 2, ean: "7890000000001" }],
      ["https://merchant-api.ifood.com.br/picking/v1.0/orders/order-1/items/bag-item-1", "PATCH", { quantity: 1 }],
      ["https://merchant-api.ifood.com.br/picking/v1.0/orders/order-1/items/bag-item-1", "DELETE", undefined],
    ]);
  });

  it("recusa preços e quantidades inválidos antes de chamar o parceiro", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await expect(client.updateCatalogItem("merchant-1", "item-1", { priceCents: 0 })).rejects.toThrow("preço positivo");
    await expect(client.updateCatalogItem("merchant-1", "item-1", { priceCents: 10.5 })).rejects.toThrow("preço positivo");
    expect(() => client.updatePickingItem("order-1", "item-1", 0)).toThrow("quantidade positiva");
    expect(() => groceryProductFromSource({ barcode: "7890000000000", name: "Produto", imageUrl: "http://inseguro.example.com/item.jpg", includeDetails: true, sendPrice: false, sendStock: false, activate: true })).toThrow("HTTPS");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("recusa horários sobrepostos, inclusive quando cruzam a meia-noite", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    expect(() => client.updateMerchantOpeningHours("merchant-1", [
      { dayOfWeek: "MONDAY", start: "18:00:00", duration: 480 },
      { dayOfWeek: "TUESDAY", start: "01:00:00", duration: 120 },
    ])).toThrow("não podem se sobrepor");
    await expect(client.updateMerchantOpeningHours("merchant-1", [
      { dayOfWeek: "MONDAY", start: "09:00:00", duration: 240 },
      { dayOfWeek: "MONDAY", start: "14:00:00", duration: 240 },
    ])).resolves.toMatchObject({ status: 204 });
  });

  it("envia promoção zero para remover um preço promocional anterior", () => {
    expect(groceryProductFromSource({ barcode: "7890000000000", name: "Produto", basePriceCents: "1990", includeDetails: false, sendPrice: true, sendStock: false, activate: false })).toMatchObject({ prices: { price: 19.9, promotionPrice: null } });
  });

  it("consulta eventos financeiros apenas pelo endpoint oficial e com paginação limitada", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "token-seguro-com-tamanho-valido", expiresIn: 21600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ financialEvents: [] }), { status: 200 }));
    const client = new IfoodClient("client-id", "client-secret", fetcher);
    await client.financialEvents("merchant-1", "2026-09-01", "2026-09-15", 2, 100);
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://merchant-api.ifood.com.br/financial/v3.0/merchants/merchant-1/financial-events?beginDate=2026-09-01&endDate=2026-09-15&page=2&size=100");
    expect(() => client.financialEvents("merchant-1", "15/09/2026", "2026-09-15", 1)).toThrow();
    expect(() => client.financialEvents("merchant-1", "2026-09-01", "2026-09-15", 1, 101)).toThrow();
  });
});
