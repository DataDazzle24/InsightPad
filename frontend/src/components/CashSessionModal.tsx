import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  executeMutation,
  mutationRef,
  type DataConnect,
  type MutationRef,
} from "firebase/data-connect";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { updatePosPolicy, requestPosCashApproval, posCashApprovalStatus, salesWorkspace } from "@insightpad/dataconnect";
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
  branches = [],
  branchLocked = false,
  canOpen = false,
  onOpened,
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
  branches?: ReadonlyArray<{id: string; name: string}>;
  branchLocked?: boolean;
  canOpen?: boolean;
  onOpened?: (branchId: string) => void | Promise<void>;
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
  const [openingBranchId, setOpeningBranchId] = useState(() => branches.some(b => b.id === branchId) ? branchId : branches.length === 1 ? branches[0].id : "");
  const [openingLookup, setOpeningLookup] = useState<{branchId:string; session:Session|null; error:boolean; busy:boolean}>({branchId:"",session:null,error:false,busy:false});
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const opening = useRef<{dc:DataConnect; branchId:string; signature:string; payload:Record<string,unknown>; reference:MutationRef<{_execute?:unknown},Record<string,unknown>>; state:"uncertain"|"confirmed"} | null>(null);
  const lookupSequence = useRef(0);
  const openingAllowed = branches.some(b => b.id === openingBranchId) && (!branchLocked || openingBranchId === branchId);
  const readOpeningSession = useCallback(async (selectedBranch:string) => {
    const result = await salesWorkspace(dc,{branchId:selectedBranch,requestKey:crypto.randomUUID()});
    const data = (result.data._select?.[0] as {data?:{branches?:{id:string}[];openSession?:Session|null}}|undefined)?.data;
    if (!data?.branches?.some(b => b.id === selectedBranch)) throw new Error("Filial não disponível para este usuário.");
    return data.openSession ?? null;
  },[dc]);
  useEffect(() => {
    const request = ++lookupSequence.current;
    if (mode !== "open" || !openingAllowed || opening.current) return;
    let disposed = false;
    // A single authorized branch lookup; never enumerate sessions across branches.
    const timer = setTimeout(() => {
      setOpeningLookup({branchId:openingBranchId,session:null,error:false,busy:true});
      void readOpeningSession(openingBranchId).then(found => {
        if (!disposed && request === lookupSequence.current) setOpeningLookup({branchId:openingBranchId,session:found,error:false,busy:false});
      }).catch(() => {
        if (!disposed && request === lookupSequence.current) setOpeningLookup({branchId:openingBranchId,session:null,error:true,busy:false});
      });
    },0);
    return () => { disposed = true; clearTimeout(timer) };
  }, [readOpeningSession,mode,openingBranchId,openingAllowed,lookupAttempt]);
  const inFlight = useRef(false), operation = useRef<CashInstruction | null>(null);
  const instructionLocked = () => inFlight.current || Boolean(opening.current) || operation.current?.state === "uncertain" || operation.current?.state === "confirmed";
  const close = () => { if (!inFlight.current && opening.current?.state !== "uncertain" && operation.current?.state !== "uncertain") onClose() };
  useDialogAccessibility(true, close);
  const expected = Number(session?.expectedAmountCents ?? 0);
  const uncertainNotice = (id: string) => onNotice(`Confirmação do caixa incerta. Repita sem alterar os dados. Referência: ${id}`);
  async function refreshConfirmed() {
    try { await onChanged(); onClose() }
    catch { onNotice(`Operação do caixa confirmada, mas não foi possível atualizar o saldo. Tente atualizar novamente. Referência: ${operation.current?.id ?? ""}`) }
  }
  async function submitOpening() {
    if (!openingAllowed || !canOpen || !onOpened) { onNotice("Selecione uma filial autorizada para abrir seu caixa."); return }
    if (!navigator.onLine) { onNotice("Conecte-se para operar o caixa."); return }
    const amountCents = parseMoney(amount);
    if (!Number.isSafeInteger(amountCents) || amountCents < 0) { onNotice("Informe um valor válido."); return }
    const signature = JSON.stringify({branchId:openingBranchId,activeBranchId:branchId,branchLocked,canOpen,amountCents,notes});
    const previous = opening.current;
    if (previous && (previous.dc !== dc || previous.signature !== signature || JSON.stringify(mutationRef(dc,"OpenCashSession",previous.payload).variables) !== JSON.stringify(previous.reference.variables))) {
      onNotice("O contexto da abertura mudou. Preserve esta confirmação e confira a sessão antes de continuar."); return;
    }
    if (!previous && (openingLookup.busy || openingLookup.error || openingLookup.branchId !== openingBranchId)) { onNotice("Confira a sessão desta filial antes de abrir o caixa."); return }
    inFlight.current = true; setBusy(true);
    let dispatched = false;
    try {
      if (previous?.state !== "confirmed") {
        // OpenCashSession has no operationId. Reconcile a lost ACK by reading the
        // same user's session in the same branch before considering a replay.
        const existing = previous ? await readOpeningSession(openingBranchId) : openingLookup.session;
        if (!existing) {
          const payload = previous?.payload ?? Object.freeze({branchId:openingBranchId,openingAmountCents:amountCents,notes});
          const reference = previous?.reference ?? mutationRef<{_execute?:unknown},Record<string,unknown>>(dc,"OpenCashSession",payload);
          Object.freeze(reference.variables);
          opening.current = previous ?? {dc,branchId:openingBranchId,signature,payload,reference,state:"uncertain"};
          dispatched = true;
          const result = await executeMutation(reference);
          if (typeof result.data._execute !== "number" || !Number.isSafeInteger(result.data._execute) || result.data._execute <= 0) throw new Error("Abertura sem confirmação positiva.");
        }
        if (opening.current) opening.current = {...opening.current,state:"confirmed"};
        else opening.current = {dc,branchId:openingBranchId,signature,payload:{branchId:openingBranchId,openingAmountCents:amountCents,notes},reference:mutationRef(dc,"OpenCashSession",{branchId:openingBranchId,openingAmountCents:amountCents,notes}),state:"confirmed"};
        setConfirmed(true); setUncertain(false);
        onNotice(existing ? "Caixa existente retomado." : "Caixa aberto com sucesso.");
      }
      await onOpened(openingBranchId); onClose();
    } catch (error) {
      if (opening.current?.state === "confirmed") {
        onNotice("A abertura foi confirmada. Atualize o contexto para carregar seu caixa.");
      } else if (previous || dispatched && !definitiveCashRefusal(error)) {
        setUncertain(true); onNotice("Confirmação da abertura incerta. Confira novamente sem alterar a filial ou os valores.");
      } else {
        opening.current = null; setUncertain(false);
        setOpeningLookup(current => ({...current,error:true}));
        onNotice("A abertura foi recusada. Confira a sessão, a filial e suas permissões antes de tentar novamente.");
      }
    } finally { inFlight.current = false; setBusy(false) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || inFlight.current) return;
    if (operation.current?.state === "confirmed") {
      inFlight.current = true; setBusy(true);
      try { await refreshConfirmed() } finally { inFlight.current = false; setBusy(false) }
      return;
    }
    if (mode === "open") { await submitOpening(); return }
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
      else {
        dispatched = true;
        result = await executeMutation(instruction!.reference);
      }
      const affected = (result.data as { _execute?: unknown })._execute;
      if (financial ? typeof affected !== "number" || !Number.isSafeInteger(affected) || affected <= 0 : !affected)
        throw new Error(financial ? "Resposta do caixa sem confirmação positiva." : "A operação foi recusada pelas regras do caixa.");
      if (instruction) { operation.current = {...instruction,state:"confirmed"}; setConfirmed(true); setUncertain(false) }
      onNotice(
        mode === "policy" ? "Regras do caixa atualizadas." : mode === "close"
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
              {mode === "open" && <>
                <label className="wide"><span>Filial</span><select aria-label="Filial" required value={openingBranchId} disabled={branches.length === 1 || branchLocked} onChange={event => {if(!instructionLocked())setOpeningBranchId(event.target.value)}}>
                  <option value="">Selecione a filial</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select></label>
                {branchLocked && <p className="wide">O carrinho ou a correção mantém este caixa na filial atual.</p>}
                {openingAllowed && <p className="wide" role="status">{openingLookup.branchId !== openingBranchId || openingLookup.busy ? "Conferindo a sessão desta filial..." : openingLookup.error ? "Não foi possível conferir a sessão desta filial." : openingLookup.session ? "Você já tem um caixa aberto nesta filial. Retome a sessão existente." : "A abertura será confirmada nesta filial."}</p>}
              </>}
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
              {mode === "open" && openingLookup.error && !uncertain && !confirmed && <button type="button" disabled={busy} onClick={() => setLookupAttempt(value => value+1)}>Conferir sessão</button>}
              {!session && canManage && <button type="button" disabled={busy} onClick={() => {if(!instructionLocked())setMode("policy")}}>Regras da empresa</button>}
              <button className="catalog-primary" disabled={busy || mode === "open" && (!openingAllowed || !canOpen || !onOpened || !uncertain && !confirmed && (openingLookup.busy || openingLookup.error || openingLookup.branchId !== openingBranchId))}>
                {confirmed && mode === "open" ? "Atualizar contexto" : confirmed ? "Atualizar saldo" : uncertain ? "Repetir confirmação" : waitingApproval ? "Verificar aprovação e concluir" : busy
                  ? "Processando..."
                  : mode === "open"
                    ? openingLookup.session ? "Retomar caixa" : "Abrir caixa"
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
