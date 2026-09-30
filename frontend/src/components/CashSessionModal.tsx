import { useRef, useState, type FormEvent } from "react";
import {
  executeMutation,
  mutationRef,
  type DataConnect,
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
    [waitingApproval,setWaitingApproval] = useState(false),
    [draftPolicy, setDraftPolicy] = useState<PosPolicy>(policy ?? {requireOpenSession:true, operatorDiscountPercent:0, operatorSurchargePercent:0, allowOperatorClose:false,operatorWithdrawalLimitCents:0,operatorCloseDifferenceLimitCents:0});
  const inFlight = useRef(false), operation = useRef({payload:"",id:""});
  useDialogAccessibility(true, () => { if(!busy) onClose() });
  const expected = Number(session?.expectedAmountCents ?? 0);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || inFlight.current) return;
    if (!navigator.onLine) { onNotice("Conecte-se para operar o caixa."); return }
    if (mode === "close" && pendingCount) { onNotice("Sincronize as vendas deste caixa antes de fechar."); return }
    if (!branchId) {
      onNotice("Selecione uma filial.");
      return;
    }
    const amountCents = parseMoney(amount);
    if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
      onNotice("Informe um valor válido.");
      return;
    }
    if (mode === "policy" && [draftPolicy.operatorWithdrawalLimitCents ?? 0, draftPolicy.operatorCloseDifferenceLimitCents ?? 0].some(value => !Number.isSafeInteger(Number(value)) || Number(value) < 0)) {
      onNotice("Informe limites monetários válidos."); return;
    }
    const movementType = mode === "close" ? "CLOSE" : mode === "withdrawal" ? "WITHDRAWAL" : "SUPPLY";
    const signature = JSON.stringify({sessionId:session?.id,mode,amountCents,notes});
    if(operation.current.payload !== signature) operation.current = {payload:signature,id:crypto.randomUUID()};
    const operationId = operation.current.id;
    inFlight.current = true; setBusy(true);
    try {
      const requiresApproval = !canManage && (mode === "withdrawal" && amountCents > Number(draftPolicy.operatorWithdrawalLimitCents ?? 0) || mode === "close" && (!draftPolicy.allowOperatorClose || Math.abs(amountCents-expected)>Number(draftPolicy.operatorCloseDifferenceLimitCents ?? 0)));
      if(requiresApproval) {
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
      else if (mode === "close")
        result = await executeMutation(
          mutationRef(dc, "CloseCashSession", {
            sessionId: session!.id,
            countedAmountCents: amountCents,
            notes,
            operationId,
          }),
        );
      else
        result = await executeMutation(
          mutationRef(dc, "RegisterCashMovement", {
            sessionId: session!.id,
            movementType: mode === "supply" ? "SUPPLY" : "WITHDRAWAL",
            amountCents,
            description: notes,
            operationId,
          }),
        );
      if (!(result.data as { _execute?: unknown })._execute)
        throw new Error("A operação foi recusada pelas regras do caixa.");
      onNotice(
        mode === "policy" ? "Regras do caixa atualizadas." : mode === "open"
          ? "Caixa aberto com sucesso."
          : mode === "close"
            ? "Caixa fechado e conferido."
            : mode === "supply"
              ? "Suprimento registrado."
              : "Sangria registrada.",
      );
      await onChanged();
      onClose();
    } catch (error) {
      console.error(error);
      onNotice(
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
          <button disabled={busy} onClick={onClose} aria-label="Fechar controle de caixa">
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
              {canManage && <button onClick={() => setMode("policy")}>Regras da empresa</button>}
              {canManage && (
                <>
                  <button
                    onClick={() => {
                      setMode("supply");
                      setAmount("R$ 0,00");
                      setNotes("");
                    }}
                  >
                    Suprimento
                  </button>
                  <button
                    onClick={() => {
                      setMode("withdrawal");
                      setAmount("R$ 0,00");
                      setNotes("");
                    }}
                  >
                    Sangria
                  </button>
                  <button
                    disabled={pendingCount > 0}
                    className="danger"
                    onClick={() => {
                      setMode("close");
                      setAmount(maskMoney(expected));
                      setNotes("");
                    }}
                  >
                    Fechar caixa
                  </button>
                </>
              )}
              {!canManage && <><button onClick={() => {setMode("withdrawal"); setAmount("R$ 0,00");setNotes("");setWaitingApproval(false)}}>Sangria</button><button disabled={pendingCount>0} className="danger" onClick={() => {setMode("close");setAmount(maskMoney(expected));setNotes("");setWaitingApproval(false)}}>Fechar meu caixa</button></>}
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
          </fieldset><footer><button type="button" className="catalog-modal-cancel" disabled={busy} onClick={() => setMode(session ? "summary" : "open")}>Voltar</button><button className="catalog-primary" disabled={busy}>Salvar regras</button></footer></form>
        ) : (
          <form onSubmit={submit}>
            <fieldset disabled={busy || waitingApproval} className="master-form-grid">
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
                    setAmount(maskMoney(parseMoney(event.target.value)))
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
                  onChange={(event) => setNotes(event.target.value)}
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
                type="button" className="catalog-modal-cancel" disabled={busy}
                onClick={() => {setWaitingApproval(false);operation.current={payload:"",id:""};if(session)setMode("summary");else onClose()}}
              >
                {session ? "Voltar" : draftPolicy.requireOpenSession ? "Cancelar" : "Seguir sem abrir"}
              </button>
              {!session && canManage && <button type="button" disabled={busy} onClick={() => setMode("policy")}>Regras da empresa</button>}
              <button className="catalog-primary" disabled={busy}>
                {waitingApproval ? "Verificar aprovação e concluir" : busy
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
