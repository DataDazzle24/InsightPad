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
type RequestResult<T> = { data: T; status: number; requestId: string };
type FetchLike = typeof fetch;

const BASE_URL = "https://merchant-api.ifood.com.br";
const REQUEST_TIMEOUT_MS = 12_000;

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
    return (Array.isArray(response.data) ? response.data : asArray(root.merchants)).map(asRecord);
  }

  async merchant(merchantId: string): Promise<RequestResult<JsonRecord>> {
    return this.request(`/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}`);
  }

  async pollEvents(): Promise<RequestResult<unknown[]>> {
    const result = await this.request<unknown>("/events/v1.0/events:polling");
    const root = asRecord(result.data);
    return { ...result, data: Array.isArray(result.data) ? result.data : asArray(root.events) };
  }

  acknowledgeEvents(ids: string[]): Promise<RequestResult<unknown>> {
    return this.request("/events/v1.0/events/acknowledgment", {
      method: "POST",
      body: { acknowledgments: ids.map((id) => ({ id })) },
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
      .then(({ data }) => {
        const root = asRecord(data);
        return (Array.isArray(data) ? data : asArray(root.reasons)).map(asRecord);
      });
  }

  requestCancellation(orderId: string, cancellationCode: string, reason: string): Promise<RequestResult<unknown>> {
    return this.request(`/order/v1.0/orders/${encodeURIComponent(orderId)}/requestCancellation`, {
      method: "POST",
      body: { cancellationCode, reason: reason.slice(0, 500) },
    });
  }

  updateItemPrice(merchantId: string, externalProductId: string, priceCents: number): Promise<RequestResult<unknown>> {
    return this.request(`/catalog/v2.0/merchants/${encodeURIComponent(merchantId)}/items/price`, {
      method: "PATCH",
      body: { itemId: externalProductId, price: { value: Math.max(0, priceCents) / 100 } },
    });
  }

  updateItemStatus(merchantId: string, externalProductId: string, available: boolean): Promise<RequestResult<unknown>> {
    return this.request(`/catalog/v2.0/merchants/${encodeURIComponent(merchantId)}/items/status`, {
      method: "PATCH",
      body: { itemId: externalProductId, status: available ? "AVAILABLE" : "UNAVAILABLE" },
    });
  }

  async request<T>(path: string, options: { method?: string; body?: unknown } = {}, repeatAfterAuth = true): Promise<RequestResult<T>> {
    const token = await this.getToken();
    const request: RequestInit = {
      method: options.method ?? "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token.value}`,
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };
    if (options.body !== undefined) request.body = JSON.stringify(options.body);
    const response = await this.fetcher(`${BASE_URL}${path}`, request);
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("traceid") ?? "";
    if (response.status === 401 && repeatAfterAuth) {
      this.token = undefined;
      return this.request<T>(path, options, false);
    }
    if (!response.ok) throw httpError(response, requestId);
    const text = await response.text();
    return { data: (text ? JSON.parse(text) : {}) as T, status: response.status, requestId };
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
    });
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("traceid") ?? "";
    if (!response.ok) throw httpError(response, requestId);
    const payload = tokenSchema.parse(await response.json());
    return { value: payload.accessToken, expiresAt: Date.now() + payload.expiresIn * 1000 };
  }
}

function httpError(response: Response, requestId: string): IfoodHttpError {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : undefined;
  const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
  return new IfoodHttpError(`O iFood respondeu com HTTP ${response.status}.`, response.status, requestId, retryable, retryAfterSeconds);
}

export function merchantId(merchant: JsonRecord): string {
  return firstString(merchant, "id", "merchantId", "uuid");
}

export function cancellationCode(reason: JsonRecord): string {
  return firstString(reason, "cancellationCode", "cancelCodeId", "code", "id");
}
