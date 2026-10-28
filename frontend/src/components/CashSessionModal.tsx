import { useRef, useState, type FormEvent } from "react";
import {
  executeMutation,
  mutationRef,
  type DataConnect,
  type MutationRef,
} from "firebase/data-connect";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { updatePosPolicy, requestPosCashApproval, posCashApprovalStatus } from "@insightpad/dataconnect";
import { maskMoney, parseMoney } from "../utils/stock";

type Session = {
  id: string;
  openedAt: string;
  openingAmountCents: string;
  expectedAmountCents: string;
  movementCount: number;
};
export type PosPolicy = { requireOpenSession: boolean; operatorDiscountPercent: number; operatorSurchargePercent: number; allowOperatorClose: boolean; operatorWithdrawalLimitCents?: number | string; operatorCloseDifferenceLimitCents?: number | string };

type CashInstruction = {
  signature: string;
  id: string;
  dc: DataConnect;
  name: string;
  payload: Record<string, unknown>;
  reference: MutationRef<{ _execute?: unknown }, Record<string, unknown>>;
  state: "ready" | "uncertain" | "confirmed";
};

// These mutations are transactional. Only a known failed check (or a local SDK
// precondition/auth refusal) proves that this attempt did not commit. In
// particular, OTHER also covers unreadable responses and HTTP failures.
function definitiveCashRefusal(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: unknown; code?: unknown; response?: { errors?: unknown } };
  if (value.name === "DataConnectError" && ["invalid-argument", "unauthorized", "not-initialized", "not-supported"].includes(String(value.code))) return true;
  if (value.name !== "DataConnectOperationError" || value.code !== "partial-error" || !Array.isArray(value.response?.errors) || !value.response.errors.length) return false;
  return value.response.errors.every((entry: unknown) => {
    if (!entry || typeof entry !== "object") return false;
    const info = entry as { message?: unknown; path?: unknown };
    return typeof info.message === "string" && Array.isArray(info.path) &&
      ["session", "lockedBranch", "_execute"].includes(String(info.path.at(-1))) &&
      /(?:^|[^A-Z_])(?:SESSION_REQUIRED|POS_BRANCH_DENIED|POS_REJECTED)(?:$|[^A-Z_])/.test(info.message);
  });
}

export function CashSessionModal({
  dc,
  branchId,
  branchName,
  session,
  canManage,
  policy,
  pendingCount = 0,
  onClose,
  onChanged,
  onNotice,
}: {
  dc: DataConnect;
  branchId: string;
  branchName: string;
  session?: Session | null;
  canManage: boolean;
  pendingCount?: number;
  policy?: PosPolicy;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [mode, setMode] = useState<
    "summary" | "open" | "supply" | "withdrawal" | "close" | "policy"
  >(session ? "summary" : "open");
  const [amount, setAmount] = useState("R$ 0,00"),
    [notes, setNotes] = useState(""),
    [busy, setBusy] = useState(false),
    [uncertain,setUncertain]=useState(false),
    [confirmed,setConfirmed]=useState(false),
    [waitingApproval,setWaitingApproval] = useState(false),
    [draftPolicy, setDraftPolicy] = useState<PosPolicy>(policy ?? {requireOpenSession:true, operatorDiscountPercent:0, operatorSurchargePercent:0, allowOperatorClose:false,operatorWithdrawalLimitCents:0,operatorCloseDifferenceLimitCents:0});
  const inFlight = useRef(false), operation = useRef<CashInstruction | null>(null);
  const instructionLocked = () => inFlight.current || operation.current?.state === "uncertain" || operation.current?.state === "confirmed";
  const close = () => { if (!inFlight.current && operation.current?.state !== "uncertain") onClose() };
  useDialogAccessibility(true, close);
  const expected = Number(session?.expectedAmountCents ?? 0);
  const uncertainNotice = (id: string) => onNotice(`Confirmação do caixa incerta. Repita sem alterar os dados. Referência: ${id}`);
  async function refreshConfirmed() {
    try { await onChanged(); onClose() }
    catch { onNotice(`Operação do caixa confirmada, mas não foi possível atualizar o saldo. Tente atualizar novamente. Referência: ${operation.current?.id ?? ""}`) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || inFlight.current) return;
    if (operation.current?.state === "confirmed") {
      inFlight.current = true; setBusy(true);
      try { await refreshConfirmed() } finally { inFlight.current = false; setBusy(false) }
      return;
    }
    const amountCents = parseMoney(amount);
    const financial = ["supply", "withdrawal", "close"].includes(mode);
    const signature = JSON.stringify({branchId,sessionId:session?.id,canManage,mode,amountCents,notes});
    if (operation.current?.state === "uncertain" && (operation.current.signature !== signature || operation.current.dc !== dc)) {
      uncertainNotice(operation.current.id); return;
    }
    if (!navigator.onLine) { onNotice("Conecte-se para operar o caixa."); return }
    if (mode === "close" && pendingCount) { onNotice("Sincronize as vendas deste caixa antes de fechar."); return }
    if (!branchId) {
      onNotice("Selecione uma filial.");
      return;
    }
    if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
      onNotice("Informe um valor válido.");
      return;
    }
    if (mode === "policy" && [draftPolicy.operatorWithdrawalLimitCents ?? 0, draftPolicy.operatorCloseDifferenceLimitCents ?? 0].some(value => !Number.isSafeInteger(Number(value)) || Number(value) < 0)) {
      onNotice("Informe limites monetários válidos."); return;
    }
    const movementType = mode === "close" ? "CLOSE" : mode === "withdrawal" ? "WITHDRAWAL" : "SUPPLY";
    inFlight.current = true; setBusy(true);
    let dispatched = false;
    const retryingUncertain = operation.current?.state === "uncertain";
    try {
      if (financial && (!operation.current || operation.current.signature !== signature)) {
        const id = crypto.randomUUID(), name = mode === "close" ? "CloseCashSession" : "RegisterCashMovement";
        const payload = Object.freeze(mode === "close"
          ? {sessionId:session!.id,countedAmountCents:amountCents,notes,operationId:id}
          : {sessionId:session!.id,movementType,amountCents,description:notes,operationId:id});
        const reference = mutationRef<{_execute?:unknown},Record<string,unknown>>(dc,name,payload);
        Object.freeze(reference.variables);
        operation.current = {signature,id,dc,name,payload,reference,state:"ready"};
      }
      const instruction = financial ? operation.current! : null;
      const operationId = instruction?.id ?? "";
      if (retryingUncertain && JSON.stringify(mutationRef(dc,instruction!.name,instruction!.payload).variables) !== JSON.stringify(instruction!.reference.variables)) {
        uncertainNotice(operationId); return;
      }
      const requiresApproval = !canManage && (mode === "withdrawal" && amountCents > Number(draftPolicy.operatorWithdrawalLimitCents ?? 0) || mode === "close" && (!draftPolicy.allowOperatorClose || Math.abs(amountCents-expected)>Number(draftPolicy.operatorCloseDifferenceLimitCents ?? 0)));
      // A retry uses the exact original instruction. SQL validates its matching
      // replay even if the original approval has already been consumed.
      if(requiresApproval && !retryingUncertain) {
        if(!waitingApproval) {
          await requestPosCashApproval(dc,{payload:{clientOperationId:operationId,sessionId:session!.id,movementType,amountCents,description:notes.trim()}});
          setWaitingApproval(true); onNotice("Solicitação enviada. Outro gestor deve aprovar estes valores. Depois, verifique a aprovação para concluir."); return;
        }
        const approval = await posCashApprovalStatus(dc,{operationId,requestKey:crypto.randomUUID()});
        const status = String((approval.data._select?.[0] as {status?:string}|undefined)?.status ?? "PENDING");
        if(status !== "APPROVED") {onNotice(status === "PENDING" ? "Aguardando a decisão de outro gestor." : "Solicitação recusada ou expirada. Volte ao resumo e solicite novamente."); return}
      }
      let result;
      if (mode === "policy") result = await updatePosPolicy(dc, {...draftPolicy,operatorWithdrawalLimitCents:String(draftPolicy.operatorWithdrawalLimitCents ?? 0),operatorCloseDifferenceLimitCents:String(draftPolicy.operatorCloseDifferenceLimitCents ?? 0)});
      else if (mode === "open")
        result = await executeMutation(
          mutationRef(dc, "OpenCashSession", {
            branchId,
            openingAmountCents: amountCents,
            notes,
          }),
        );
      else {
        dispatched = true;
        result = await executeMutation(instruction!.reference);
      }
      const affected = (result.data as { _execute?: unknown })._execute;
      if (financial ? typeof affected !== "number" || !Number.isSafeInteger(affected) || affected <= 0 : !affected)
        throw new Error(financial ? "Resposta do caixa sem confirmação positiva." : "A operação foi recusada pelas regras do caixa.");
      if (instruction) { operation.current = {...instruction,state:"confirmed"}; setConfirmed(true); setUncertain(false) }
      onNotice(
        mode === "policy" ? "Regras do caixa atualizadas." : mode === "open"
          ? "Caixa aberto com sucesso."
          : mode === "close"
            ? "Caixa fechado e conferido."
            : mode === "supply"
              ? "Suprimento registrado."
              : "Sangria registrada.",
      );
      if (financial) await refreshConfirmed();
      else { await onChanged(); onClose() }
    } catch (error) {
      if (operation.current?.state === "confirmed") {
        onNotice(`Operação do caixa confirmada. Atualize o saldo. Referência: ${operation.current.id}`);
      } else if (financial && operation.current && (retryingUncertain || dispatched && !definitiveCashRefusal(error))) {
        operation.current = {...operation.current,state:"uncertain"}; setUncertain(true); uncertainNotice(operation.current.id);
      } else if (financial && dispatched) {
        operation.current = null; setWaitingApproval(false); setUncertain(false);
        onNotice("A operação foi recusada pelas regras do caixa. Confira os dados e suas permissões antes de tentar novamente.");
      } else onNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o caixa.",
      );
    } finally {
      inFlight.current = false; setBusy(false);
    }
  }
  return (
    <div className="catalog-backdrop">
      <section
        className="catalog-modal sales-modal cash-session-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Controle de caixa"
      >
        <header>
          <div>
            <span className="eyebrow">CONTROLE FINANCEIRO</span>
            <h2>{mode === "policy" ? "REGRAS DO CAIXA" : session ? "MEU CAIXA ABERTO" : "ABRIR MEU CAIXA"}</h2>
            {!session && <p>Cada usuário abre seu próprio caixa nesta filial. Dinheiro exige abertura; as demais vendas seguem as regras da empresa.</p>}
          </div>
          <button disabled={busy||uncertain} onClick={close} aria-label="Fechar controle de caixa">
            ×
          </button>
        </header>
        {mode === "summary" && session ? (
          <div className="cash-session-summary">
            <article>
              <span>Filial</span>
              <strong>{branchName}</strong>
            </article>
            <article>
              <span>Aberto em</span>
              <strong>
                {new Date(session.openedAt).toLocaleString("pt-BR")}
              </strong>
            </article>
            <article>
              <span>Fundo inicial</span>
              <strong>{maskMoney(Number(session.openingAmountCents))}</strong>
            </article>
            <article>
              <span>Saldo esperado</span>
              <strong>{maskMoney(expected)}</strong>
            </article>
            <article>
              <span>Movimentações</span>
              <strong>{session.movementCount}</strong>
            </article>
            <div className="cash-session-actions">
              <button className="cash-action--cancel" onClick={close}><span className="material-symbols-rounded" aria-hidden="true">close</span>Cancelar</button>
              {canManage && <button onClick={() => {if(!instructionLocked())setMode("policy")}}>Regras da empresa</button>}
              {canManage && (
                <>
                  <button className="cash-action--supply"
                    onClick={() => {
                      if(instructionLocked())return;
                      setMode("supply");
                      setAmount("R$ 0,00");
                      setNotes("");
                    }}
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">add_circle</span>Suprimento
                  </button>
                  <button className="cash-action--withdrawal"
                    onClick={() => {
                      if(instructionLocked())return;
                      setMode("withdrawal");
                      setAmount("R$ 0,00");
                      setNotes("");
                    }}
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">remove_circle</span>Sangria
                  </button>
                  <button
                    disabled={pendingCount > 0}
                    className="danger"
                    onClick={() => {
                      if(instructionLocked())return;
                      setMode("close");
                      setAmount(maskMoney(expected));
                      setNotes("");
                    }}
                  >
                    Fechar caixa
                  </button>
                </>
              )}
              {!canManage && <><button className="cash-action--withdrawal" onClick={() => {if(instructionLocked())return;setMode("withdrawal"); setAmount("R$ 0,00");setNotes("");setWaitingApproval(false)}}><span className="material-symbols-rounded" aria-hidden="true">remove_circle</span>Sangria</button><button disabled={pendingCount>0} className="danger" onClick={() => {if(instructionLocked())return;setMode("close");setAmount(maskMoney(expected));setNotes("");setWaitingApproval(false)}}>Fechar meu caixa</button></>}
            </div>
            {pendingCount > 0 && <p className="wide" role="status">Há {pendingCount} venda(s) deste caixa aguardando confirmação. Sincronize antes de fechar.</p>}
          </div>
        ) : mode === "policy" ? (
          <form onSubmit={submit}><fieldset disabled={busy} className="master-form-grid">
            <label className="wide"><input type="checkbox" checked={draftPolicy.requireOpenSession} onChange={event => setDraftPolicy(value => ({...value, requireOpenSession:event.target.checked}))} /> Exigir abertura em todas as vendas</label>
            <label><span>Limite de desconto do operador (%)</span><input type="number" min="0" max="100" required value={draftPolicy.operatorDiscountPercent} onChange={event => setDraftPolicy(value => ({...value, operatorDiscountPercent:Number(event.target.value)}))} /></label>
            <label><span>Limite de acréscimo do operador (%)</span><input type="number" min="0" max="100" required value={draftPolicy.operatorSurchargePercent} onChange={event => setDraftPolicy(value => ({...value, operatorSurchargePercent:Number(event.target.value)}))} /></label>
            <label className="wide"><input type="checkbox" checked={draftPolicy.allowOperatorClose} onChange={event => setDraftPolicy(value => ({...value, allowOperatorClose:event.target.checked}))} /> Permitir que o operador feche seu próprio caixa</label>
            <label><span>Limite de sangria sem aprovação</span><input inputMode="numeric" value={maskMoney(Number(draftPolicy.operatorWithdrawalLimitCents ?? 0))} onChange={event => setDraftPolicy(value => ({...value,operatorWithdrawalLimitCents:parseMoney(event.target.value)}))} /></label>
            <label><span>Diferença máxima no fechamento sem aprovação</span><input inputMode="numeric" value={maskMoney(Number(draftPolicy.operatorCloseDifferenceLimitCents ?? 0))} onChange={event => setDraftPolicy(value => ({...value,operatorCloseDifferenceLimitCents:parseMoney(event.target.value)}))} /></label>
            <p className="wide">Receber dinheiro sempre exige caixa aberto. Suprimentos exigem gestão. Sangria e fechamento acima dos limites exigem aprovação por outro gestor. Desabilitar o fechamento do operador exige aprovação em todos os fechamentos.</p>
          </fieldset><footer><button type="button" className="catalog-modal-cancel" disabled={busy||uncertain} onClick={() => {if(!instructionLocked())setMode(session ? "summary" : "open")}}>Voltar</button><button className="catalog-primary" disabled={busy}>Salvar regras</button></footer></form>
        ) : (
          <form onSubmit={submit}>
            <fieldset disabled={busy || waitingApproval || uncertain || confirmed} className="master-form-grid">
              <label>
                <span>
                  {mode === "open"
                    ? "Fundo de troco inicial"
                    : mode === "close"
                      ? "Valor contado no caixa"
                      : "Valor"}
                </span>
                <input
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) =>
                    !instructionLocked() && !waitingApproval && setAmount(maskMoney(parseMoney(event.target.value)))
                  }
                  autoFocus
                />
              </label>
              <label className="wide">
                <span>
                  {mode === "supply"
                    ? "Motivo do suprimento"
                    : mode === "withdrawal"
                      ? "Motivo da sangria"
                      : "Observações"}
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => {if(!instructionLocked()&&!waitingApproval)setNotes(event.target.value)}}
                  required={mode === "supply" || mode === "withdrawal"}
                  minLength={mode === "supply" || mode === "withdrawal" ? 3 : 0}
                />
              </label>
              {mode === "close" && (
                <p className="wide">
                  Saldo esperado: <strong>{maskMoney(expected)}</strong> ·
                  Diferença prevista:{" "}
                  <strong>{maskMoney(parseMoney(amount) - expected)}</strong>
                </p>
              )}
            </fieldset>
            <footer>
              <button
                type="button" className="catalog-modal-cancel" disabled={busy||uncertain||confirmed}
                onClick={() => {if(instructionLocked())return;setWaitingApproval(false);operation.current=null;if(session)setMode("summary");else close()}}
              >
                {session ? "Voltar" : draftPolicy.requireOpenSession ? "Cancelar" : "Seguir sem abrir"}
              </button>
              {!session && canManage && <button type="button" disabled={busy} onClick={() => {if(!instructionLocked())setMode("policy")}}>Regras da empresa</button>}
              <button className="catalog-primary" disabled={busy}>
                {confirmed ? "Atualizar saldo" : uncertain ? "Repetir confirmação" : waitingApproval ? "Verificar aprovação e concluir" : busy
                  ? "Processando..."
                  : mode === "open"
                    ? "Abrir caixa"
                    : mode === "close"
                      ? "Confirmar fechamento"
                      : "Registrar"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
