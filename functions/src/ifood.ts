import { z } from "zod";
import { asRecord, firstString, type JsonRecord } from "./domain.js";

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
type RequestResult<T> = { data: T; status: number; requestId: string };
type FetchLike = typeof fetch;

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
    const response = await this.request<unknown>("/merchant/v1.0/merchants");
    const root = asRecord(response.data);
    const merchants = Array.isArray(response.data) ? response.data : root.merchants;
    if (!Array.isArray(merchants)) {
      throw new IfoodHttpError("O iFood retornou lojas em formato inválido.", 502, response.requestId, true);
    }
    return merchants.map(asRecord);
  }

  async merchant(merchantId: string): Promise<RequestResult<JsonRecord>> {
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}`);
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

  updateItemPrice(merchantId: string, externalProductId: string, priceCents: number): Promise<RequestResult<unknown>> {
    if (!Number.isSafeInteger(priceCents) || priceCents <= 0) throw new Error("O produto precisa de um preço positivo e válido para sincronizar.");
    return this.request(`/catalog/v2.0/merchants/${encodeURIComponent(merchantId)}/items/price`, {
      method: "PATCH",
      body: { itemId: externalProductId, price: { value: priceCents / 100 } },
    });
  }

  updateItemStatus(merchantId: string, externalProductId: string, available: boolean): Promise<RequestResult<unknown>> {
    return this.request(`/catalog/v2.0/merchants/${encodeURIComponent(merchantId)}/items/status`, {
      method: "PATCH",
      body: { itemId: externalProductId, status: available ? "AVAILABLE" : "UNAVAILABLE" },
    });
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
    const text = await response.text();
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
    const raw: unknown = await response.json().catch(() => null);
    const parsed = tokenSchema.safeParse(raw);
    if (!parsed.success) throw new IfoodHttpError("O iFood retornou uma autenticação inválida.", 502, requestId, true);
    const payload = parsed.data;
    return { value: payload.accessToken, expiresAt: Date.now() + payload.expiresIn * 1000 };
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

export function cancellationCode(reason: JsonRecord): string {
  return firstString(reason, "cancellationCode", "cancelCodeId", "code", "id");
}
