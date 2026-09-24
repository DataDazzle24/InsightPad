import { z } from "zod";
import { asArray, asRecord, firstString, type JsonRecord } from "./domain.js";

const tokenSchema = z.object({
  accessToken: z.string().min(20),
  expiresIn: z.coerce.number().positive(),
  type: z.string().optional(),
});

export class IfoodHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string,
    readonly retryable: boolean,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "IfoodHttpError";
  }
}

type Token = { value: string; expiresAt: number };
export type RequestResult<T> = { data: T; status: number; requestId: string };
export type CatalogUpdateResult = RequestResult<unknown> & {
  confirmationState: "CONFIRMED" | "RECEIVED";
  operationId?: string;
};
type FetchLike = typeof fetch;

export type MerchantOpeningShift = {
  dayOfWeek: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  start: string;
  duration: number;
};

const openingShiftSchema = z.object({
  dayOfWeek: z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
  duration: z.number().int().min(15).max(1440),
}).strict();

const WEEK_SECONDS = 7 * 24 * 60 * 60;
const STORE_DAY_INDEX: Record<MerchantOpeningShift["dayOfWeek"], number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

function openingHoursDoNotOverlap(shifts: MerchantOpeningShift[]): boolean {
  const intervals = shifts.map((shift) => {
    const [hour = 0, minute = 0, second = 0] = shift.start.split(":").map(Number);
    const start = STORE_DAY_INDEX[shift.dayOfWeek] * 86_400 + hour * 3_600 + minute * 60 + second;
    return { start, end: start + shift.duration * 60 };
  });
  return intervals.every((current, index) => intervals.every((candidate, candidateIndex) => {
    if (index === candidateIndex) return true;
    return [-WEEK_SECONDS, 0, WEEK_SECONDS].every((offset) => {
      const start = candidate.start + offset;
      const end = candidate.end + offset;
      return current.end <= start || end <= current.start;
    });
  }));
}

const openingHoursSchema = z.array(openingShiftSchema).min(1).max(56).refine(openingHoursDoNotOverlap, {
  message: "Os horários de funcionamento não podem se sobrepor.",
});

const interruptionSchema = z.object({
  id: z.string().trim().min(8).max(160),
  description: z.string().trim().min(3).max(180),
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
}).strict().refine((value) => Date.parse(value.end) > Date.parse(value.start), {
  message: "O fim da pausa precisa ser posterior ao início.",
});

const groceryProductSchema = z.object({
  barcode: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(240),
  plu: z.string().trim().max(160).optional(),
  active: z.boolean().optional(),
  details: z.object({
    categorization: z.object({
      department: z.string().trim().max(120).optional(),
      category: z.string().trim().max(120).optional(),
      subCategory: z.string().trim().max(120).optional(),
    }).optional(),
    brand: z.string().trim().max(100).optional(),
    volume: z.string().trim().max(80).optional(),
    unit: z.string().trim().max(40).optional(),
    imageUrl: z.string().url().max(2000).refine((value) => new URL(value).protocol === "https:", {
      message: "A imagem do produto precisa usar HTTPS.",
    }).optional(),
    description: z.string().trim().max(1000).optional(),
    nearExpiration: z.boolean().optional(),
  }).optional(),
  prices: z.object({
    price: z.number().positive().finite(),
    promotionPrice: z.number().positive().finite().nullable().optional(),
  }).refine((value) => value.promotionPrice == null || value.promotionPrice <= value.price, {
    message: "O preço promocional não pode superar o preço normal.",
  }).optional(),
  scalePrices: z.array(z.object({
    price: z.number().positive().finite(),
    quantity: z.number().int().positive(),
  })).max(100).optional(),
  inventory: z.object({ stock: z.number().nonnegative().finite() }).optional(),
  multiple: z.object({
    originalEan: z.string().trim().min(1).max(160),
    quantity: z.number().positive().finite(),
  }).optional(),
}).strict();

export type GroceryProduct = z.infer<typeof groceryProductSchema>;

export type GroceryProductSource = {
  barcode: string;
  name: string;
  internalCode?: string | undefined;
  imageUrl?: string | undefined;
  brand?: string | undefined;
  size?: string | undefined;
  sizeType?: string | undefined;
  description?: string | undefined;
  categoryName?: string | undefined;
  subcategoryName?: string | undefined;
  basePriceCents?: string | undefined;
  promotionPriceCents?: string | undefined;
  stockQuantity?: string | undefined;
  includeDetails: boolean;
  sendPrice: boolean;
  sendStock: boolean;
  activate: boolean;
};

function optionalText(value: string | undefined, limit: number): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, limit) : undefined;
}

function cents(value: string | undefined, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`O produto precisa de um ${label} positivo e válido para sincronizar.`);
  return parsed / 100;
}

export function groceryProductFromSource(source: GroceryProductSource): GroceryProduct {
  const category = optionalText(source.categoryName, 120);
  const subCategory = optionalText(source.subcategoryName, 120);
  const categorization = category || subCategory ? { ...(category ? { category } : {}), ...(subCategory ? { subCategory } : {}) } : undefined;
  const brand = optionalText(source.brand, 100);
  const unit = optionalText(source.sizeType, 40);
  const size = optionalText(source.size, 40);
  const volume = size && unit ? `${size.replace(",", ".")}${unit.toLowerCase()}` : undefined;
  const description = optionalText(source.description, 1000);
  const imageUrl = optionalText(source.imageUrl, 2000);
  const details = source.includeDetails && (categorization || brand || volume || unit || imageUrl || description)
    ? { ...(categorization ? { categorization } : {}), ...(brand ? { brand } : {}), ...(volume ? { volume } : {}), ...(unit ? { unit } : {}), ...(imageUrl ? { imageUrl } : {}), ...(description ? { description } : {}) }
    : undefined;
  const price = source.sendPrice ? cents(source.basePriceCents, "preço") : undefined;
  const promotion = source.sendPrice
    ? (Number(source.promotionPriceCents) > 0 ? cents(source.promotionPriceCents, "preço promocional") : null)
    : undefined;
  if (price !== undefined && promotion != null && promotion > price) throw new Error("O produto possui preço promocional superior ao preço normal.");
  const stock = Number(source.stockQuantity ?? 0);
  if (source.sendStock && (!Number.isFinite(stock) || stock < 0)) throw new Error("O produto precisa de um estoque válido para sincronizar.");
  return groceryProductSchema.parse({
    barcode: source.barcode,
    name: source.name,
    ...(optionalText(source.internalCode, 160) ? { plu: optionalText(source.internalCode, 160) } : {}),
    ...(source.activate ? { active: true } : {}),
    ...(details ? { details } : {}),
    ...(price === undefined ? {} : { prices: { price, ...(promotion === undefined ? {} : { promotionPrice: promotion }) } }),
    ...(source.sendStock ? { inventory: { stock: Math.round(stock * 1000) / 1000 } } : {}),
  });
}

const BASE_URL = "https://merchant-api.ifood.com.br";
const REQUEST_TIMEOUT_MS = 12_000;

function uniqueIdentifiers(values: string[], limit: number, label: string): string[] {
  const identifiers = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (!identifiers.length) throw new Error(`A requisição ao iFood exige ao menos um identificador de ${label}.`);
  if (identifiers.length > limit) throw new Error(`A requisição ao iFood excede o limite de ${limit} identificadores de ${label}.`);
  return identifiers;
}

export class IfoodClient {
  private token: Token | undefined;
  private tokenPromise: Promise<Token> | undefined;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly fetcher: FetchLike = fetch,
  ) {
    if (!clientId.trim() || !clientSecret.trim()) throw new Error("Credenciais iFood ausentes no Secret Manager.");
  }

  async tokenMetadata(): Promise<{ expiresAt: string }> {
    const token = await this.getToken();
    return { expiresAt: new Date(token.expiresAt).toISOString() };
  }

  async merchants(): Promise<JsonRecord[]> {
    const pageSize = 100;
    const result = new Map<string, JsonRecord>();
    for (let page = 1; page <= 50; page += 1) {
      const response = await this.request<unknown>(`/merchant/v1.0/merchants?page=${page}&size=${pageSize}`);
      const root = asRecord(response.data);
      const merchants = Array.isArray(response.data) ? response.data : root.merchants;
      if (!Array.isArray(merchants)) {
        throw new IfoodHttpError("O iFood retornou lojas em formato inválido.", 502, response.requestId, true);
      }
      const rows = merchants.map(asRecord);
      for (const merchant of rows) {
        const id = merchantId(merchant);
        if (id) result.set(id, merchant);
      }
      if (rows.length < pageSize) return [...result.values()];
    }
    throw new IfoodHttpError("O iFood retornou mais de 5.000 lojas. Refine o credenciamento do aplicativo antes de continuar.", 502, "", false);
  }

  async merchant(merchantId: string): Promise<RequestResult<JsonRecord>> {
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}`);
  }

  merchantStatus(merchantId: string): Promise<RequestResult<unknown>> {
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/status`);
  }

  merchantOpeningHours(merchantId: string): Promise<RequestResult<unknown>> {
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/opening-hours`);
  }

  merchantInterruptions(merchantId: string): Promise<RequestResult<unknown>> {
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/interruptions`);
  }

  updateMerchantOpeningHours(merchantId: string, shifts: MerchantOpeningShift[]): Promise<RequestResult<unknown>> {
    const parsed = openingHoursSchema.parse(shifts);
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/opening-hours`, {
      method: "PUT",
      body: { storeId: merchantId, shifts: parsed },
    });
  }

  createMerchantInterruption(merchantId: string, input: { id: string; description: string; start: string; end: string }): Promise<RequestResult<unknown>> {
    const payload = interruptionSchema.parse(input);
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/interruptions`, { method: "POST", body: payload });
  }

  deleteMerchantInterruption(merchantId: string, interruptionId: string): Promise<RequestResult<unknown>> {
    const id = z.string().trim().min(8).max(160).parse(interruptionId);
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/interruptions/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async pollEvents(merchantIds: string[]): Promise<RequestResult<unknown[]>> {
    const ids = uniqueIdentifiers(merchantIds, 100, "lojas");
    const result = await this.request<unknown>("/events/v1.0/events:polling", {
      headers: { "x-polling-merchants": ids.join(",") },
    });
    const root = asRecord(result.data);
    if (result.status === 204) return { ...result, data: [] };
    const data = Array.isArray(result.data) ? result.data : root.events;
    if (!Array.isArray(data)) throw new IfoodHttpError("O iFood retornou eventos em formato inválido.", 502, result.requestId, true);
    return { ...result, data };
  }

  acknowledgeEvents(eventIds: string[]): Promise<RequestResult<unknown>> {
    const ids = uniqueIdentifiers(eventIds, 100, "eventos");
    return this.request("/events/v1.0/events/acknowledgment", {
      method: "POST",
      body: ids.map((id) => ({ id })),
    });
  }

  getOrder(orderId: string): Promise<RequestResult<JsonRecord>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}`);
  }

  getOrderVirtualBag(orderId: string): Promise<RequestResult<JsonRecord>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}/virtual-bag`);
  }

  confirmOrder(orderId: string): Promise<RequestResult<unknown>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}/confirm`, { method: "POST" });
  }

  startPreparation(orderId: string): Promise<RequestResult<unknown>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}/startPreparation`, { method: "POST" });
  }

  readyToPickup(orderId: string): Promise<RequestResult<unknown>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}/readyToPickup`, { method: "POST" });
  }

  dispatchOrder(orderId: string): Promise<RequestResult<unknown>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}/dispatch`, { method: "POST" });
  }

  cancellationReasons(orderId: string): Promise<JsonRecord[]> {
    return this.request<unknown>(`/order/v1.0/orders/${encodeURIComponent(orderId)}/cancellationReasons`)
      .then(({ data, requestId }) => {
        const root = asRecord(data);
        const reasons = Array.isArray(data) ? data : root.reasons;
        if (!Array.isArray(reasons)) {
          throw new IfoodHttpError("O iFood retornou motivos de cancelamento em formato inválido.", 502, requestId, true);
        }
        return reasons.map(asRecord);
      });
  }

  requestCancellation(orderId: string, cancellationCode: string, reason: string): Promise<RequestResult<unknown>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}/requestCancellation`, {
      method: "POST",
      body: { cancellationCode, reason: reason.slice(0, 500) },
    });
  }

  financialEvents(merchantId: string, beginDate: string, endDate: string, page: number, size = 100): Promise<RequestResult<unknown>> {
    const id = z.string().trim().min(1).max(160).parse(merchantId);
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
    const from = date.parse(beginDate);
    const to = date.parse(endDate);
    const pageNumber = z.number().int().min(1).max(10_000).parse(page);
    const pageSize = z.number().int().min(1).max(100).parse(size);
    return this.request(`/financial/v3.0/merchants/${encodeURIComponent(id)}/financial-events?beginDate=${from}&endDate=${to}&page=${pageNumber}&size=${pageSize}`);
  }

  async updateCatalogItem(merchantId: string, itemId: string, changes: { priceCents?: number; available?: boolean }): Promise<CatalogUpdateResult> {
    if (changes.priceCents !== undefined && (!Number.isSafeInteger(changes.priceCents) || changes.priceCents <= 0)) {
      throw new Error("O produto precisa de um preço positivo e válido para sincronizar.");
    }
    if (changes.priceCents === undefined && changes.available === undefined) {
      throw new Error("O produto não possui alterações de catálogo para sincronizar.");
    }
    const results: RequestResult<unknown>[] = [];
    if (changes.priceCents !== undefined) {
      results.push(await this.request(`/catalog/v2.0/merchants/${encodeURIComponent(merchantId)}/items/price`, {
        method: "PATCH",
        body: { itemId, price: { value: changes.priceCents / 100 } },
      }));
    }
    if (changes.available !== undefined) {
      results.push(await this.request(`/catalog/v2.0/merchants/${encodeURIComponent(merchantId)}/items/status`, {
        method: "PATCH",
        body: { itemId, status: changes.available ? "AVAILABLE" : "UNAVAILABLE" },
      }));
    }
    let confirmationState: CatalogUpdateResult["confirmationState"] = "CONFIRMED";
    let operationId: string | undefined;
    for (const result of results) {
      const batchId = firstString(asRecord(result.data), "batchId", "id");
      if (batchId) {
        operationId = batchId;
        const confirmed = await this.waitForCatalogBatch(merchantId, batchId);
        if (!confirmed) confirmationState = "RECEIVED";
      } else if (result.status === 202) confirmationState = "RECEIVED";
    }
    const last = results.at(-1)!;
    return { ...last, confirmationState, ...(operationId ? { operationId } : {}) };
  }

  async catalogBatch(merchantId: string, batchId: string): Promise<RequestResult<unknown>> {
    const merchant = z.string().trim().min(1).max(160).parse(merchantId);
    const batch = z.string().trim().min(1).max(180).parse(batchId);
    return this.request(`/catalog/v2.0/merchants/${encodeURIComponent(merchant)}/batch/${encodeURIComponent(batch)}`);
  }

  async catalogBatchConfirmation(merchantId: string, batchId: string): Promise<"CONFIRMED" | "RECEIVED"> {
    const response = await this.catalogBatch(merchantId, batchId);
    const data = asRecord(response.data);
    const status = firstString(data, "batchStatus", "status").toUpperCase();
    if (["ERROR", "FAILED", "FAILURE", "CANCELLED"].includes(status)) {
      throw new IfoodHttpError("O iFood recusou o lote de atualização do catálogo.", 422, response.requestId, false);
    }
    if (["COMPLETED", "FINISHED"].includes(status)) {
      const results = asArray(data.results).map(asRecord);
      const failed = results.some((item) => ["ERROR", "FAILED", "FAILURE"].includes(firstString(item, "result", "status").toUpperCase()));
      const failureCount = Number(data.failureCount ?? data.failedCount ?? 0);
      if (failed || (Number.isFinite(failureCount) && failureCount > 0)) {
        throw new IfoodHttpError("O iFood recusou um ou mais itens do lote de catálogo.", 422, response.requestId, false);
      }
      return "CONFIRMED";
    }
    return "RECEIVED";
  }

  private async waitForCatalogBatch(merchantId: string, batchId: string): Promise<boolean> {
    const waits = [0, 500, 1_000, 2_000, 3_000];
    for (const wait of waits) {
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      if (await this.catalogBatchConfirmation(merchantId, batchId) === "CONFIRMED") return true;
    }
    return false;
  }

  ingestGroceryProducts(merchantId: string, products: GroceryProduct[], mode: "FULL" | "PATCH"): Promise<RequestResult<unknown>> {
    if (!Array.isArray(products) || products.length < 1 || products.length > 100) {
      throw new Error("A sincronização de Mercado precisa conter entre 1 e 100 produtos.");
    }
    const payload = products.map((product) => groceryProductSchema.parse(product));
    const path = `/item/v1.0/ingestion/${encodeURIComponent(merchantId)}${mode === "FULL" ? "?reset=false" : ""}`;
    return this.request(path, { method: mode === "FULL" ? "POST" : "PATCH", body: payload });
  }

  startSeparation(orderId: string): Promise<RequestResult<unknown>> {
    return this.request(`/picking/v1.0/orders/${encodeURIComponent(orderId)}/startSeparation`, { method: "POST" });
  }

  endSeparation(orderId: string): Promise<RequestResult<unknown>> {
    return this.request(`/picking/v1.0/orders/${encodeURIComponent(orderId)}/endSeparation`, { method: "POST" });
  }

  addPickingItem(orderId: string, ean: string, quantity: number): Promise<RequestResult<unknown>> {
    return this.pickingItemRequest(`/picking/v1.0/orders/${encodeURIComponent(orderId)}/items`, "POST", ean, quantity);
  }

  replacePickingItem(orderId: string, uniqueId: string, ean: string, quantity: number): Promise<RequestResult<unknown>> {
    return this.pickingItemRequest(`/picking/v1.0/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(uniqueId)}/replace`, "POST", ean, quantity);
  }

  updatePickingItem(orderId: string, uniqueId: string, quantity: number): Promise<RequestResult<unknown>> {
    return this.pickingItemRequest(`/picking/v1.0/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(uniqueId)}`, "PATCH", undefined, quantity);
  }

  removePickingItem(orderId: string, uniqueId: string): Promise<RequestResult<unknown>> {
    if (!uniqueId.trim()) throw new Error("O item do pedido não possui identificador de separação.");
    return this.request(`/picking/v1.0/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(uniqueId)}`, { method: "DELETE" });
  }

  private pickingItemRequest(path: string, method: "POST" | "PATCH", ean: string | undefined, quantity: number): Promise<RequestResult<unknown>> {
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10_000 || Math.round(quantity * 1000) !== quantity * 1000) {
      throw new Error("O item do pedido precisa de uma quantidade positiva com até três casas decimais.");
    }
    const barcode = ean?.trim();
    if (ean !== undefined && (!barcode || barcode.length > 160)) throw new Error("O item do pedido precisa de um EAN ou código de balança válido.");
    return this.request(path, { method, body: { quantity, ...(barcode ? { ean: barcode } : {}) } });
  }

  async request<T>(
    path: string,
    options: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
    repeatAfterAuth = true,
  ): Promise<RequestResult<T>> {
    // Keep tokens on the official origin; callers cannot supply arbitrary URLs.
    if (!/^\/[a-z]+\/v\d+\.\d+\//.test(path) || path.includes("\\") || path.split("/").some((segment) => [".", ".."].includes(decodeURIComponent(segment)))) {
      throw new Error("Caminho inválido para a API iFood.");
    }
    const token = await this.getToken();
    const request: RequestInit = {
      method: options.method ?? "GET",
      headers: {
        ...options.headers,
        accept: "application/json",
        authorization: `Bearer ${token.value}`,
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    };
    if (options.body !== undefined) request.body = JSON.stringify(options.body);
    const response = await this.fetcher(`${BASE_URL}${path}`, request);
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("traceid") ?? "";
    if (response.status === 401 && repeatAfterAuth) {
      if (this.token?.value === token.value) this.token = undefined;
      return this.request<T>(path, options, false);
    }
    if (!response.ok) throw httpError(response, requestId);
    const text = await readLimitedResponse(response, 2 * 1024 * 1024);
    try {
      return { data: (text ? JSON.parse(text) : {}) as T, status: response.status, requestId };
    } catch {
      throw new IfoodHttpError("O iFood retornou uma resposta inválida.", 502, requestId, true);
    }
  }

  private async getToken(): Promise<Token> {
    if (this.token && this.token.expiresAt - Date.now() > 60_000) return this.token;
    this.tokenPromise ??= this.issueToken().finally(() => { this.tokenPromise = undefined; });
    this.token = await this.tokenPromise;
    return this.token;
  }

  private async issueToken(): Promise<Token> {
    const form = new URLSearchParams({
      grantType: "client_credentials",
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    const response = await this.fetcher(`${BASE_URL}/authentication/v1.0/oauth/token`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("traceid") ?? "";
    if (!response.ok) throw httpError(response, requestId);
    const rawText = await readLimitedResponse(response, 64 * 1024);
    let raw: unknown = null;
    try { raw = rawText ? JSON.parse(rawText) : null; } catch { raw = null; }
    const parsed = tokenSchema.safeParse(raw);
    if (!parsed.success) throw new IfoodHttpError("O iFood retornou uma autenticação inválida.", 502, requestId, true);
    const payload = parsed.data;
    return { value: payload.accessToken, expiresAt: Date.now() + payload.expiresIn * 1000 };
  }
}

async function readLimitedResponse(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new IfoodHttpError("O iFood retornou uma resposta maior que o limite seguro.", 502, response.headers.get("x-request-id") ?? "", true);
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new IfoodHttpError("O iFood retornou uma resposta maior que o limite seguro.", 502, response.headers.get("x-request-id") ?? "", true);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new IfoodHttpError("O iFood retornou uma resposta com codificação inválida.", 502, response.headers.get("x-request-id") ?? "", true);
  }
}

function httpError(response: Response, requestId: string): IfoodHttpError {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? (/^\d+$/.test(retryAfter) ? Number(retryAfter) : Math.max(0, Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000))) : undefined;
  const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
  return new IfoodHttpError(`O iFood respondeu com HTTP ${response.status}.`, response.status, requestId, retryable, retryAfterSeconds);
}

export function merchantId(merchant: JsonRecord): string {
  return firstString(merchant, "id", "merchantId", "uuid");
}

export function merchantCatalogProfile(merchant: JsonRecord): "RESTAURANT" | "GROCERY" | "UNVERIFIED" {
  const type = firstString(merchant, "type", "merchantType", "category").toUpperCase();
  if (type === "RESTAURANT" || type === "FOOD") return "RESTAURANT";
  if (["GROCERY", "MARKET", "PHARMACY", "PETSHOP", "BEVERAGES", "SHOP"].some((value) => type.includes(value))) return "GROCERY";
  return "UNVERIFIED";
}

export function cancellationCode(reason: JsonRecord): string {
  return firstString(reason, "cancellationCode", "cancelCodeId", "code", "id");
}
