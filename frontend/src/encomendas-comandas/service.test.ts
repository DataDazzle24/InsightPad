import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { send, lookup, identity } = vi.hoisted(() => ({
  send: vi.fn(),
  lookup: vi.fn(),
  identity: {
    currentUser: { uid: "synthetic-actor" } as { uid: string } | null,
  },
}));
vi.mock("@insightpad/dataconnect", () => ({
  connectorConfig: {},
  ecCommand: send,
  ecRead: lookup,
}));
vi.mock("../lib/firebase", () => ({ firebaseApp: {}, auth: identity }));
vi.mock("../auth/session-data-connect", () => ({
  getDataConnect: () => ({}),
  currentSessionToken: () => "a".repeat(64),
}));
import { acknowledge, pending, preserve } from "./pending";
import { BusinessError, execute, resolve, UncertainError } from "./service";
import type { Command, OperationResult, Owner } from "./types";
let owner: Owner, c: Command;
const committed = (): OperationResult => ({
  status: "COMMITTED",
  operationId: c.operationId,
  documentId: crypto.randomUUID(),
  version: "2",
  effects: {},
});
beforeEach(() => {
  vi.stubGlobal("navigator", { onLine: true });
  vi.clearAllMocks();
  identity.currentUser = { uid: "synthetic-actor" };
  owner = { uid: "synthetic-actor", tenantId: crypto.randomUUID() };
  c = {
    operationId: crypto.randomUUID(),
    kind: "COMANDA",
    action: "RECEIVE",
    documentId: crypto.randomUUID(),
    expectedVersion: "1",
    payload: { amountCents: "3333", paymentMethodId: crypto.randomUUID() },
  };
});
describe("ACK e erro real de transporte do SDK", () => {
  it("recupera uma resposta perdida com consulta e uma única mutação", async () => {
    const expected = committed();
    send.mockRejectedValue({
      name: "DataConnectOperationError",
      code: "other",
      response: { errors: [{ message: "SQL execution failed" }] },
    });
    lookup.mockResolvedValue({ data: { response: { result: expected } } });
    expect(await execute(owner, c)).toEqual(expected);
    expect(send).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(await pending(owner)).toBeNull();
  });
  it("UNKNOWN conserva payload e não cria retry automático", async () => {
    send.mockRejectedValue({ code: "dataconnect/other" });
    lookup.mockResolvedValue({
      data: { response: { result: { status: "UNKNOWN" } } },
    });
    await expect(execute(owner, c)).rejects.toBeInstanceOf(UncertainError);
    expect((await pending(owner))?.command).toEqual(c);
    expect(send).toHaveBeenCalledTimes(1);
    await acknowledge(owner, c.operationId);
  });
  it("recusa definitiva consultável libera a edição sem afirmar sucesso", async () => {
    const result = {
      status: "REJECTED",
      operationId: c.operationId,
      error: { code: "VERSION_CONFLICT" },
    };
    send.mockResolvedValue({ data: { query: { response: { result } } } });
    await expect(execute(owner, c)).rejects.toBeInstanceOf(BusinessError);
    expect(await pending(owner)).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });
  it("resposta malformada não é prova de recebimento", async () => {
    send.mockResolvedValue({
      data: { query: { response: { result: { success: true } } } },
    });
    lookup.mockResolvedValue({
      data: { response: { result: { status: "UNKNOWN" } } },
    });
    await expect(execute(owner, c)).rejects.toBeInstanceOf(UncertainError);
    expect(await pending(owner)).not.toBeNull();
    await acknowledge(owner, c.operationId);
  });
  it("replay exige descritor original e mesma identidade", async () => {
    await preserve(owner, c);
    send.mockResolvedValue({
      data: { query: { response: { result: committed() } } },
    });
    await expect(
      execute(
        owner,
        { ...c, payload: { ...c.payload, amountCents: "3334" } },
        true,
      ),
    ).rejects.toThrow("originais");
    expect(send).not.toHaveBeenCalled();
    identity.currentUser = { uid: "another-user" };
    await expect(execute(owner, c, true)).rejects.toThrow("SESSION_REQUIRED");
    expect(send).not.toHaveBeenCalled();
    await acknowledge(owner, c.operationId);
  });
  it("ACK positivo permite repetir só a leitura de resultado", async () => {
    const expected = committed();
    send.mockResolvedValue({
      data: { query: { response: { result: expected } } },
    });
    await execute(owner, c);
    lookup.mockResolvedValue({ data: { response: { result: expected } } });
    await resolve(owner, c);
    await resolve(owner, c);
    expect(send).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledTimes(2);
  });
  it("mesmo identificador não permite substituir dados já preservados", async () => {
    await preserve(owner, c);
    await expect(
      execute(owner, { ...c, payload: { ...c.payload, amountCents: "3334" } }),
    ).rejects.toThrow("confirmação pendente");
    expect(send).not.toHaveBeenCalled();
    expect((await pending(owner))?.command).toEqual(c);
    await acknowledge(owner, c.operationId);
  });
  it("resultado de outra operação não remove o descritor original", async () => {
    await preserve(owner, c);
    lookup.mockResolvedValue({
      data: {
        response: {
          result: { ...committed(), operationId: crypto.randomUUID() },
        },
      },
    });
    await expect(resolve(owner, c)).rejects.toBeInstanceOf(UncertainError);
    expect(await pending(owner)).not.toBeNull();
    await acknowledge(owner, c.operationId);
  });
});
