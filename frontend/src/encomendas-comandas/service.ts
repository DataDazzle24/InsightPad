import { getDataConnect } from "firebase/data-connect";
import { z } from "zod";
import { connectorConfig, ecCommand, ecRead } from "@insightpad/dataconnect";
import { firebaseApp, auth } from "../lib/firebase";
import { currentSessionToken } from "../auth/session-data-connect";
import { acknowledge, pending, preserve } from "./pending";
import type { Command, OperationResult, Owner } from "./types";
const dc = getDataConnect(firebaseApp, connectorConfig);
function deadline<T>(work: PromiseLike<T>, milliseconds = 20000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    Promise.resolve(work),
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error("A confirmação excedeu o tempo de espera.")),
        milliseconds,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}
export class BusinessError extends Error {
  result: OperationResult;
  constructor(result: OperationResult) {
    super(result.error?.code ?? "VALIDATION_ERROR");
    this.result = result;
  }
}
export class UncertainError extends Error {
  command: Command;
  constructor(command: Command) {
    super(
      "A confirmação ainda não pôde ser verificada. Confira o resultado antes de repetir.",
    );
    this.command = command;
  }
}
const envelope = z.object({ result: z.unknown() });
const receipt = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("COMMITTED"),
      operationId: z.string().uuid(),
      documentId: z.string().uuid(),
      version: z.string().regex(/^[1-9]\d*$/),
      effects: z.record(z.string(), z.unknown()),
    })
    .passthrough(),
  z
    .object({
      status: z.literal("REJECTED"),
      operationId: z.string().uuid(),
      error: z.object({ code: z.string(), details: z.unknown().optional() }),
    })
    .passthrough(),
  z.object({ status: z.literal("UNKNOWN") }).passthrough(),
]);
function identity(owner: Owner) {
  if (auth.currentUser?.uid !== owner.uid || !currentSessionToken())
    throw new Error("SESSION_REQUIRED");
}
export async function read<T>(input: Record<string, unknown>): Promise<T> {
  const response = await deadline(
    ecRead(dc, { input, sessionToken: currentSessionToken() }),
  );
  const result = envelope.parse(response.data.response).result;
  if (!result) throw new Error("Não foi possível consultar os dados.");
  return result as T;
}
export async function resolve(
  owner: Owner,
  command: Command,
): Promise<OperationResult> {
  identity(owner);
  const result = receipt.parse(
    await read<unknown>({
      mode: "RESULT",
      kind: command.kind,
      operationId: command.operationId,
      expectedCommand: command,
    }),
  ) as OperationResult;
  if (result.status !== "UNKNOWN" && result.operationId !== command.operationId)
    throw new UncertainError(command);
  if (result.status === "COMMITTED" || result.status === "REJECTED")
    await acknowledge(owner, command.operationId);
  return result;
}
// No automatic replay, including SDK `other`, timeout and HTTP error shapes.
// An explicit retry uses the frozen encrypted descriptor and its original ID.
export async function execute(
  owner: Owner,
  command: Command,
  replay = false,
): Promise<OperationResult> {
  identity(owner);
  if (!navigator.onLine)
    throw new Error("Conecte-se à internet para confirmar esta operação.");
  if (!replay) await preserve(owner, command);
  else {
    const saved = await pending(owner);
    if (!saved || JSON.stringify(saved.command) !== JSON.stringify(command))
      throw new Error(
        "O replay exige os dados originais da confirmação pendente.",
      );
  }
  identity(owner);
  let result: OperationResult;
  try {
    const response = await deadline(
      ecCommand(dc, { command, sessionToken: currentSessionToken() }),
    );
    result = receipt.parse(
      envelope.parse(response.data.query?.response).result,
    ) as OperationResult;
    if (
      result?.operationId !== command.operationId ||
      !["COMMITTED", "REJECTED"].includes(result.status)
    )
      throw new UncertainError(command);
  } catch {
    try {
      result = await resolve(owner, command);
    } catch {
      throw new UncertainError(command);
    }
    if (result.status === "UNKNOWN") throw new UncertainError(command);
  }
  await acknowledge(owner, command.operationId);
  if (result.status === "REJECTED") throw new BusinessError(result);
  return result;
}
export const errorText = (error: unknown): string => {
  const code =
    error instanceof BusinessError
      ? error.result.error?.code
      : error instanceof Error
        ? error.message
        : "";
  const messages: Record<string, string> = {
    FINANCIAL_APPROVAL_REQUIRED:
      "O valor exige aprovação de outro gestor do Caixa. Solicite a aprovação e confira o resultado antes de devolver.",
    CASH_BALANCE_REQUIRED:
      "O caixa não possui saldo suficiente para esta devolução.",
    INVALID_STATE: "O estado atual não permite esta ação.",
    NO_BALANCE: "Não há saldo em aberto para receber.",
    EMPTY_DOCUMENT: "Adicione itens antes de concluir.",
    ORDER_NOT_READY: "Marque a encomenda como pronta antes de concluir.",
    SESSION_REQUIRED: "Sua sessão precisa ser validada novamente.",
    ACCESS_DENIED: "Seu perfil não permite esta ação.",
    BRANCH_DENIED: "A filial ou o vínculo financeiro impede esta alteração.",
    NOT_FOUND: "Registro indisponível neste contexto.",
    VERSION_CONFLICT:
      "Os dados foram alterados. Atualize e revise antes de confirmar.",
    CASH_SESSION_REQUIRED: "Abra um caixa nesta filial antes de receber.",
    CASH_SESSION_CLOSED:
      "O caixa selecionado foi fechado. Atualize e escolha um caixa aberto.",
    APPROVAL_REQUIRED: "Esta ação exige um responsável autorizado.",
    INSUFFICIENT_STOCK:
      "Estoque insuficiente. Confira os componentes e as quantidades.",
    RESERVATION_REQUIRED: "Reserve integralmente o estoque antes de concluir.",
    PAYMENT_REQUIRED: "Quite o saldo antes de concluir.",
    AMOUNT_EXCEEDS_BALANCE: "O valor ultrapassa o saldo disponível.",
    TOTAL_BELOW_RECEIVED: "O total não pode ser menor que o valor recebido.",
    ALLOCATION_REQUIRED:
      "Concilie os recebimentos por valor com os itens antes desta ação.",
    ITEM_ALREADY_PAID:
      "Este item já possui pagamento. A retirada ou transferência simples está bloqueada.",
    DOCUMENT_TERMINAL:
      "Este registro já foi encerrado. Atualize para consultar o histórico.",
    IDEMPOTENCY_CONFLICT:
      "O identificador já foi usado com outros dados. Confira a operação original.",
    VALIDATION_ERROR: "Revise os campos, quantidades e referências informados.",
  };
  return (
    messages[code ?? ""] ??
    (error instanceof UncertainError
      ? error.message
      : "Não foi possível concluir. Preserve os dados e confira o resultado.")
  );
};
