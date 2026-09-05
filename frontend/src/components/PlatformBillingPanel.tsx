import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from "firebase/data-connect";
import { connectorConfig } from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { AppLoading, DateRangePicker, type Notice } from "./SalesUi";
import { SortableTableHeader } from "./SortableTableHeader";
import {
  billingStatusLabel,
  datePtBr,
  formatMoneyFromCents,
  maskMoneyInput,
  moneyInputFromCents,
  parseMoneyToCents,
  type BillingStatus,
} from "../utils/platformBilling";
import { nextTableSort, type TableSort } from "../utils/tableSorting";

type TenantOption = {
  id: string;
  legalName: string;
  tradeName?: string;
  active: boolean;
  monthlyAmountCents?: string;
  nextDueDate?: string;
};
type Payment = {
  id: string;
  amountCents: string;
  paidAt: string;
  method: string;
  provider: string;
  transactionReference?: string;
  notes?: string;
  status: "CONFIRMED" | "REVERSED";
  reversedAt?: string;
  reversalReason?: string;
  createdByUid: string;
};
type Invoice = {
  id: string;
  tenantId: string;
  tenantName: string;
  referenceMonth: string;
  description: string;
  issuedOn: string;
  dueDate: string;
  originalAmountCents: string;
  discountCents: string;
  additionCents: string;
  totalCents: string;
  paidCents: string;
  remainingCents: string;
  status: BillingStatus;
  storedStatus: string;
  provider: string;
  externalChargeId?: string;
  paymentUrl?: string;
  notes?: string;
  version: string;
  createdAt: string;
  payments: Payment[];
};
export type PlatformBillingSummary = {
  receivableCents: string;
  overdueCents: string;
  overdueTenants: number;
  receivedMonthCents: string;
};
type BillingWorkspace = {
  summary: PlatformBillingSummary;
  total: number;
  invoices: Invoice[];
};
type BillingFilters = {
  status: string;
  tenantId: string;
  dueFrom: string;
  dueTo: string;
};
type InvoiceForm = {
  tenantId: string;
  referenceMonth: string;
  description: string;
  issuedOn: string;
  dueDate: string;
  originalAmount: string;
  discount: string;
  addition: string;
  notes: string;
};
type ConfirmAction =
  | { kind: "void"; invoice: Invoice; reason: string }
  | { kind: "reverse"; invoice: Invoice; payment: Payment; reason: string };

const dc = getDataConnect(firebaseApp, connectorConfig);
const PAGE_SIZE = 25;
const emptyWorkspace: BillingWorkspace = {
  summary: { receivableCents: "0", overdueCents: "0", overdueTenants: 0, receivedMonthCents: "0" },
  total: 0,
  invoices: [],
};
const emptyFilters = (): BillingFilters => ({ status: "", tenantId: "", dueFrom: "", dueTo: "" });
const today = () => new Date().toISOString().slice(0, 10);
const month = () => new Date().toISOString().slice(0, 7);
const tenantName = (tenant: TenantOption) => tenant.tradeName || tenant.legalName;
const mutationApplied = (result: unknown) => Boolean((result as { data?: { _execute?: unknown } })?.data?._execute);

export function PlatformBillingPanel({ tenants, onNotice, onSummaryChange }: { tenants: TenantOption[]; onNotice: (notice: Notice) => void; onSummaryChange: (summary: PlatformBillingSummary) => void }) {
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<BillingFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<BillingFilters>(emptyFilters);
  const [filterModal, setFilterModal] = useState(false);
  const [sort, setSort] = useState<TableSort | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState<Invoice | "new" | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", paidAt: "", method: "PIX", transactionReference: "", notes: "" });
  const [details, setDetails] = useState<Invoice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await executeQuery(queryRef(dc, "PlatformBillingWorkspaceV2", {
        term: term.trim(),
        status: filters.status,
        tenantId: filters.tenantId || null,
        dueFrom: filters.dueFrom || null,
        dueTo: filters.dueTo || null,
        sortKey: sort?.key ?? "",
        sortDirection: sort?.direction ?? "",
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        requestKey: crypto.randomUUID(),
      }));
      const box = (((result.data as { _select?: unknown[] })._select ?? [])[0] as { data?: BillingWorkspace } | undefined)?.data;
      const next = box ?? emptyWorkspace;
      setWorkspace(next);
      onSummaryChange(next.summary);
    } catch (error) {
      console.error(error);
      onNotice({ type: "error", text: "Não foi possível carregar cobranças e baixas." });
    } finally {
      setBusy(false);
    }
  }, [filters, onNotice, onSummaryChange, page, sort, term]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), term ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, term]);
  useDialogAccessibility(Boolean(invoiceModal), () => closeInvoice());
  useDialogAccessibility(Boolean(paymentInvoice), () => setPaymentInvoice(null));
  useDialogAccessibility(Boolean(details), () => setDetails(null));
  useDialogAccessibility(Boolean(confirm), () => setConfirm(null));
  useDialogAccessibility(filterModal, () => setFilterModal(false));

  const totalPages = Math.max(1, Math.ceil(workspace.total / PAGE_SIZE));
  const filterCount = Object.values(filters).filter(Boolean).length;
  const hasFilters = Boolean(term || filterCount || sort);
  const invoiceTotal = useMemo(() => {
    if (!invoiceForm) return 0;
    return Math.max(0, parseMoneyToCents(invoiceForm.originalAmount) - parseMoneyToCents(invoiceForm.discount) + parseMoneyToCents(invoiceForm.addition));
  }, [invoiceForm]);

  function patchInvoice<K extends keyof InvoiceForm>(key: K, value: InvoiceForm[K]) {
    setInvoiceForm((current) => (current ? { ...current, [key]: value } : current));
  }
  function openInvoice(invoice?: Invoice) {
    if (invoice) {
      setInvoiceModal(invoice);
      setInvoiceForm({
        tenantId: invoice.tenantId,
        referenceMonth: invoice.referenceMonth.slice(0, 7),
        description: invoice.description,
        issuedOn: invoice.issuedOn.slice(0, 10),
        dueDate: invoice.dueDate.slice(0, 10),
        originalAmount: moneyInputFromCents(invoice.originalAmountCents),
        discount: moneyInputFromCents(invoice.discountCents),
        addition: moneyInputFromCents(invoice.additionCents),
        notes: invoice.notes ?? "",
      });
      return;
    }
    const selected = tenants.find((item) => item.id === filters.tenantId) ?? tenants.find((item) => item.active) ?? tenants[0];
    setInvoiceModal("new");
    setInvoiceForm({
      tenantId: selected?.id ?? "",
      referenceMonth: month(),
      description: `Mensalidade Insight Pad · ${month()}`,
      issuedOn: today(),
      dueDate: selected?.nextDueDate?.slice(0, 10) ?? "",
      originalAmount: selected?.monthlyAmountCents ? moneyInputFromCents(selected.monthlyAmountCents) : "",
      discount: "",
      addition: "",
      notes: "",
    });
  }
  function closeInvoice() {
    setInvoiceModal(null);
    setInvoiceForm(null);
  }
  function openPayment(invoice: Invoice) {
    const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setPaymentInvoice(invoice);
    setPaymentForm({ amount: moneyInputFromCents(invoice.remainingCents), paidAt: localNow, method: "PIX", transactionReference: "", notes: "" });
  }
  function resetFilters() {
    setTerm("");
    setFilters(emptyFilters());
    setDraftFilters(emptyFilters());
    setSort(null);
    setPage(0);
  }
  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setFilters(draftFilters);
    setPage(0);
    setFilterModal(false);
  }
  function changeSort(key: string) {
    setSort((current) => nextTableSort(current, key));
    setPage(0);
  }
  async function saveInvoice(event: FormEvent) {
    event.preventDefault();
    if (!invoiceForm || !invoiceForm.tenantId || !invoiceForm.referenceMonth || !invoiceForm.dueDate || !invoiceForm.description.trim() || invoiceTotal <= 0) {
      onNotice({ type: "error", text: "Informe ambiente, competência, vencimento, descrição e um total maior que zero." });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        tenantId: invoiceForm.tenantId,
        referenceMonth: `${invoiceForm.referenceMonth}-01`,
        description: invoiceForm.description.trim(),
        issuedOn: invoiceForm.issuedOn,
        dueDate: invoiceForm.dueDate,
        originalAmountCents: parseMoneyToCents(invoiceForm.originalAmount),
        discountCents: parseMoneyToCents(invoiceForm.discount),
        additionCents: parseMoneyToCents(invoiceForm.addition),
        notes: invoiceForm.notes.trim(),
      };
      const result = invoiceModal === "new"
        ? await executeMutation(mutationRef(dc, "CreatePlatformInvoice", { payload: { ...payload, clientOperationId: crypto.randomUUID() } }))
        : await executeMutation(mutationRef(dc, "UpdatePlatformInvoice", { payload: { ...payload, invoiceId: invoiceModal?.id, expectedVersion: Number(invoiceModal?.version) } }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      closeInvoice();
      onNotice({ type: "success", text: invoiceModal === "new" ? "Cobrança criada com sucesso." : "Cobrança atualizada com sucesso." });
      await load();
    } catch (error) {
      console.error(error);
      onNotice({ type: "error", text: "Não foi possível salvar a cobrança. Verifique datas, valores, duplicidade ou uma alteração concorrente." });
    } finally {
      setBusy(false);
    }
  }
  async function settle(event: FormEvent) {
    event.preventDefault();
    if (!paymentInvoice) return;
    const amountCents = parseMoneyToCents(paymentForm.amount);
    if (amountCents <= 0 || amountCents > Number(paymentInvoice.remainingCents) || !paymentForm.paidAt) {
      onNotice({ type: "error", text: "A baixa deve ser maior que zero e não pode superar o saldo da cobrança." });
      return;
    }
    setBusy(true);
    try {
      const result = await executeMutation(mutationRef(dc, "SettlePlatformInvoice", { payload: {
        invoiceId: paymentInvoice.id,
        amountCents,
        paidAt: new Date(paymentForm.paidAt).toISOString(),
        method: paymentForm.method,
        transactionReference: paymentForm.transactionReference.trim(),
        notes: paymentForm.notes.trim(),
        idempotencyKey: crypto.randomUUID(),
      } }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      setPaymentInvoice(null);
      onNotice({ type: "success", text: amountCents === Number(paymentInvoice.remainingCents) ? "Cobrança baixada integralmente." : "Baixa parcial registrada com sucesso." });
      await load();
    } catch (error) {
      console.error(error);
      onNotice({ type: "error", text: "Não foi possível registrar a baixa. Atualize os dados e confira o saldo." });
    } finally {
      setBusy(false);
    }
  }
  async function applyConfirmation(event: FormEvent) {
    event.preventDefault();
    if (!confirm || confirm.reason.trim().length < 5) {
      onNotice({ type: "error", text: "Informe uma justificativa com pelo menos 5 caracteres." });
      return;
    }
    setBusy(true);
    try {
      const result = confirm.kind === "void"
        ? await executeMutation(mutationRef(dc, "VoidPlatformInvoice", { invoiceId: confirm.invoice.id, reason: confirm.reason.trim(), expectedVersion: Number(confirm.invoice.version) }))
        : await executeMutation(mutationRef(dc, "ReversePlatformPayment", { paymentId: confirm.payment.id, reason: confirm.reason.trim() }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      const wasReverse = confirm.kind === "reverse";
      setConfirm(null);
      setDetails(null);
      onNotice({ type: "success", text: wasReverse ? "Baixa estornada e saldo restaurado." : "Cobrança cancelada com histórico preservado." });
      await load();
    } catch (error) {
      console.error(error);
      onNotice({ type: "error", text: "A operação não foi aplicada. O registro pode ter sido alterado por outro administrador." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="platform-panel platform-billing-panel">
      <div className="platform-toolbar platform-billing-toolbar">
        <label className="platform-search"><span className="material-symbols-rounded">search</span><span className="sr-only">Pesquisar cobranças</span><input value={term} onChange={(event) => { setTerm(event.target.value); setPage(0); }} placeholder="Pesquisar ambiente, descrição ou referência" /></label>
        {hasFilters && <button className="catalog-clear-tools" onClick={resetFilters}><span className="material-symbols-rounded">filter_alt_off</span>Limpar filtros</button>}
        <button onClick={() => { setDraftFilters(filters); setFilterModal(true); }}><span className="material-symbols-rounded">tune</span>Pesquisa avançada{filterCount > 0 && <b>{filterCount}</b>}</button>
        <button className="catalog-primary" onClick={() => openInvoice()}><span className="material-symbols-rounded">add</span>Nova cobrança</button>
      </div>
      <div className="platform-table platform-billing-table">
        <table>
          <thead><tr><SortableTableHeader label="Ambiente" sortKey="tenantName" sort={sort} onChange={changeSort} /><SortableTableHeader label="Competência" sortKey="referenceMonth" sort={sort} onChange={changeSort} /><SortableTableHeader label="Vencimento" sortKey="dueDate" sort={sort} onChange={changeSort} /><SortableTableHeader label="Total" sortKey="totalCents" sort={sort} onChange={changeSort} /><SortableTableHeader label="Pago" sortKey="paidCents" sort={sort} onChange={changeSort} /><SortableTableHeader label="Saldo" sortKey="remainingCents" sort={sort} onChange={changeSort} /><SortableTableHeader label="Status" sortKey="status" sort={sort} onChange={changeSort} /><th>Ações</th></tr></thead>
          <tbody>
            {workspace.invoices.map((invoice) => <tr key={invoice.id}>
              <td><strong>{invoice.tenantName}</strong><small>{invoice.description}</small></td>
              <td>{invoice.referenceMonth.slice(0, 7).split("-").reverse().join("/")}</td>
              <td>{datePtBr(invoice.dueDate)}</td>
              <td>{formatMoneyFromCents(invoice.totalCents)}</td>
              <td>{formatMoneyFromCents(invoice.paidCents)}</td>
              <td><strong>{formatMoneyFromCents(invoice.remainingCents)}</strong></td>
              <td><span className={`platform-financial-status platform-financial-status--${invoice.status.toLowerCase()}`}><i />{billingStatusLabel[invoice.status]}</span></td>
              <td className="platform-row-actions">
                <button className="catalog-row-info" onClick={() => setDetails(invoice)} title="Ver histórico"><span className="material-symbols-rounded">visibility</span>Detalhes</button>
                {invoice.storedStatus !== "VOID" && Number(invoice.paidCents) === 0 && <button className="catalog-row-edit" onClick={() => openInvoice(invoice)}><span className="material-symbols-rounded">edit</span>Editar</button>}
                {invoice.storedStatus !== "VOID" && Number(invoice.remainingCents) > 0 && <button className="success" onClick={() => openPayment(invoice)}><span className="material-symbols-rounded">price_check</span>Dar baixa</button>}
              </td>
            </tr>)}
            {!workspace.invoices.length && !busy && <tr><td colSpan={8}><div className="platform-empty"><span className="material-symbols-rounded">receipt_long</span><strong>Nenhuma cobrança encontrada</strong><small>Ajuste os filtros ou crie a primeira cobrança para um ambiente.</small></div></td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="catalog-pagination platform-pagination"><span>{workspace.total} cobrança{workspace.total === 1 ? "" : "s"}</span><div><button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><span className="material-symbols-rounded">chevron_left</span>Anterior</button><strong>Página {page + 1} de {totalPages}</strong><button disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Próxima<span className="material-symbols-rounded">chevron_right</span></button></div></footer>

      {filterModal && <div className="catalog-backdrop"><section className="catalog-modal master-modal advanced-search-modal platform-filter-modal" role="dialog" aria-modal="true" aria-labelledby="platform-filter-title"><header><div><span className="eyebrow">Pesquisa</span><h2 id="platform-filter-title">Filtros avançados</h2></div><button type="button" aria-label="Fechar pesquisa avançada" onClick={() => setFilterModal(false)}>×</button></header><form onSubmit={applyFilters}><div className="catalog-filter-body"><div className="master-section-title"><span className="material-symbols-rounded">manage_search</span><div><strong>Refine as cobranças</strong><small>Selecione o ambiente, a situação financeira e o período de vencimento.</small></div></div><div className="master-form-grid filter-grid">
        <label><span>Status</span><select value={draftFilters.status} onChange={(event) => setDraftFilters({ ...draftFilters, status: event.target.value })}><option value="">Todos os status</option><option value="OPEN">Em aberto</option><option value="PARTIALLY_PAID">Parcial</option><option value="PAID">Pago</option><option value="OVERDUE">Em atraso</option><option value="VOID">Cancelado</option></select></label>
        <label><span>Ambiente</span><select value={draftFilters.tenantId} onChange={(event) => setDraftFilters({ ...draftFilters, tenantId: event.target.value })}><option value="">Todos os ambientes</option>{tenants.map((item) => <option key={item.id} value={item.id}>{tenantName(item)}</option>)}</select></label>
        <DateRangePicker label="Período de vencimento" from={draftFilters.dueFrom} to={draftFilters.dueTo} onChange={(dueFrom, dueTo) => setDraftFilters((current) => ({ ...current, dueFrom, dueTo }))} />
      </div></div><footer><button type="button" className="catalog-clear-tools" onClick={() => setDraftFilters(emptyFilters())}><span className="material-symbols-rounded">filter_alt_off</span>Limpar filtros</button><button type="button" className="catalog-modal-cancel" onClick={() => setFilterModal(false)}>Cancelar</button><button className="catalog-primary catalog-modal-submit">Aplicar filtros</button></footer></form></section></div>}

      {invoiceModal && invoiceForm && <div className="catalog-backdrop"><section className="catalog-modal master-modal platform-modal platform-invoice-modal" role="dialog" aria-modal="true" aria-labelledby="platform-invoice-title"><header><div><span className="eyebrow">COBRANÇA</span><h2 id="platform-invoice-title">{invoiceModal === "new" ? "Nova cobrança" : "Editar cobrança"}</h2></div><button type="button" aria-label="Fechar" onClick={closeInvoice}>×</button></header><form onSubmit={saveInvoice}><div className="master-modal-content"><div className="master-section-title"><span className="material-symbols-rounded">request_quote</span><div><strong>Identificação e valores</strong><small>Registre a competência e o valor exato a receber.</small></div></div><div className="master-form-grid">
        <label><span>Ambiente *</span><select value={invoiceForm.tenantId} disabled={invoiceModal !== "new"} onChange={(event) => { const selected = tenants.find((item) => item.id === event.target.value); patchInvoice("tenantId", event.target.value); if (selected?.monthlyAmountCents) patchInvoice("originalAmount", moneyInputFromCents(selected.monthlyAmountCents)); if (selected?.nextDueDate) patchInvoice("dueDate", selected.nextDueDate.slice(0, 10)); }} required><option value="">Selecione</option>{tenants.map((item) => <option key={item.id} value={item.id}>{tenantName(item)}</option>)}</select></label>
        <label><span>Competência *</span><input type="month" value={invoiceForm.referenceMonth} onChange={(event) => patchInvoice("referenceMonth", event.target.value)} required /></label>
        <label className="field-wide"><span>Descrição *</span><input value={invoiceForm.description} maxLength={180} onChange={(event) => patchInvoice("description", event.target.value)} required /></label>
        <label><span>Data de emissão *</span><input type="date" value={invoiceForm.issuedOn} onChange={(event) => patchInvoice("issuedOn", event.target.value)} required /></label>
        <label><span>Vencimento *</span><input type="date" min={invoiceForm.issuedOn} value={invoiceForm.dueDate} onChange={(event) => patchInvoice("dueDate", event.target.value)} required /></label>
        <label><span>Valor original *</span><input inputMode="numeric" value={invoiceForm.originalAmount} onChange={(event) => patchInvoice("originalAmount", maskMoneyInput(event.target.value))} placeholder="R$ 0,00" required /></label>
        <label><span>Desconto</span><input inputMode="numeric" value={invoiceForm.discount} onChange={(event) => patchInvoice("discount", maskMoneyInput(event.target.value))} placeholder="R$ 0,00" /></label>
        <label><span>Acréscimo</span><input inputMode="numeric" value={invoiceForm.addition} onChange={(event) => patchInvoice("addition", maskMoneyInput(event.target.value))} placeholder="R$ 0,00" /></label>
        <div className="platform-calculated-total"><span>Total da cobrança</span><strong>{formatMoneyFromCents(invoiceTotal)}</strong></div>
        <label className="field-full"><span>Observações</span><textarea value={invoiceForm.notes} maxLength={1000} onChange={(event) => patchInvoice("notes", event.target.value)} /></label>
      </div></div><footer><button type="button" className="catalog-modal-cancel" onClick={closeInvoice}>Cancelar</button><button className={`catalog-modal-submit catalog-modal-submit--${invoiceModal === "new" ? "create" : "edit"}`} disabled={busy}>{invoiceModal === "new" ? "Criar cobrança" : "Salvar alterações"}</button></footer></form></section></div>}

      {paymentInvoice && <div className="catalog-backdrop"><section className="catalog-modal master-modal platform-modal platform-payment-modal" role="dialog" aria-modal="true" aria-labelledby="platform-payment-title"><header><div><span className="eyebrow">BAIXA FINANCEIRA</span><h2 id="platform-payment-title">Registrar recebimento</h2></div><button type="button" aria-label="Fechar" onClick={() => setPaymentInvoice(null)}>×</button></header><form onSubmit={settle}><div className="master-modal-content"><div className="platform-payment-summary"><span>Ambiente<strong>{paymentInvoice.tenantName}</strong></span><span>Total<strong>{formatMoneyFromCents(paymentInvoice.totalCents)}</strong></span><span>Saldo<strong>{formatMoneyFromCents(paymentInvoice.remainingCents)}</strong></span></div><div className="master-section-title"><span className="material-symbols-rounded">price_check</span><div><strong>Dados do recebimento</strong><small>Baixas parciais são permitidas; o histórico nunca é apagado.</small></div></div><div className="master-form-grid">
        <label><span>Valor recebido *</span><input autoFocus inputMode="numeric" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: maskMoneyInput(event.target.value) })} required /></label>
        <label><span>Data e hora *</span><input type="datetime-local" value={paymentForm.paidAt} onChange={(event) => setPaymentForm({ ...paymentForm, paidAt: event.target.value })} required /></label>
        <label><span>Forma de pagamento *</span><select value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })}><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="TRANSFERENCIA">Transferência</option><option value="CARTAO">Cartão</option><option value="DINHEIRO">Dinheiro</option><option value="OUTRO">Outro</option></select></label>
        <label className="field-wide"><span>Referência da transação</span><input value={paymentForm.transactionReference} maxLength={180} onChange={(event) => setPaymentForm({ ...paymentForm, transactionReference: event.target.value })} placeholder="NSU, ID Pix ou referência bancária" /></label>
        <label className="field-full"><span>Observações</span><textarea value={paymentForm.notes} maxLength={1000} onChange={(event) => setPaymentForm({ ...paymentForm, notes: event.target.value })} /></label>
      </div></div><footer><button type="button" className="catalog-modal-cancel" onClick={() => setPaymentInvoice(null)}>Cancelar</button><button className="catalog-modal-submit catalog-modal-submit--create" disabled={busy}>Confirmar baixa</button></footer></form></section></div>}

      {details && <div className="catalog-backdrop"><section className="catalog-modal master-modal platform-modal platform-history-modal" role="dialog" aria-modal="true" aria-labelledby="platform-history-title"><header><div><span className="eyebrow">HISTÓRICO FINANCEIRO</span><h2 id="platform-history-title">Detalhes da cobrança</h2></div><button type="button" aria-label="Fechar" onClick={() => setDetails(null)}>×</button></header><div className="master-modal-content"><div className="platform-payment-summary"><span>Ambiente<strong>{details.tenantName}</strong></span><span>Vencimento<strong>{datePtBr(details.dueDate)}</strong></span><span>Saldo<strong>{formatMoneyFromCents(details.remainingCents)}</strong></span></div><div className="master-section-title"><span className="material-symbols-rounded">history</span><div><strong>Baixas e estornos</strong><small>{details.payments.length ? "Movimentações registradas para esta cobrança." : "Esta cobrança ainda não recebeu nenhuma baixa."}</small></div></div><div className="platform-payment-history">
        {details.payments.map((payment) => <article className={payment.status === "REVERSED" ? "reversed" : ""} key={payment.id}><div><strong>{formatMoneyFromCents(payment.amountCents)}</strong><span>{new Date(payment.paidAt).toLocaleString("pt-BR")} · {payment.method}</span>{payment.transactionReference && <small>Referência: {payment.transactionReference}</small>}{payment.notes && <small>{payment.notes}</small>}{payment.status === "REVERSED" && <small>Estornada: {payment.reversalReason}</small>}</div><span className={`platform-financial-status platform-financial-status--${payment.status === "REVERSED" ? "void" : "paid"}`}>{payment.status === "REVERSED" ? "Estornada" : "Confirmada"}</span>{payment.status === "CONFIRMED" && <button className="danger" onClick={() => setConfirm({ kind: "reverse", invoice: details, payment, reason: "" })}><span className="material-symbols-rounded">undo</span>Estornar</button>}</article>)}
        {!details.payments.length && <div className="platform-empty compact"><span className="material-symbols-rounded">payments</span><strong>Sem movimentações</strong></div>}
      </div></div><footer>{details.storedStatus !== "VOID" && Number(details.paidCents) === 0 && <button className="danger" onClick={() => setConfirm({ kind: "void", invoice: details, reason: "" })}>Cancelar cobrança</button>}<button type="button" className="catalog-modal-cancel" onClick={() => setDetails(null)}>Fechar</button></footer></section></div>}

      {confirm && <div className="catalog-backdrop catalog-confirm-backdrop"><section className="catalog-modal catalog-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="platform-confirm-title"><header><div><span className="eyebrow">CONFIRMAÇÃO</span><h2 id="platform-confirm-title">{confirm.kind === "void" ? "Cancelar cobrança?" : "Estornar baixa?"}</h2></div><button type="button" aria-label="Fechar" onClick={() => setConfirm(null)}>×</button></header><form onSubmit={applyConfirmation}><div className="master-modal-content"><p>{confirm.kind === "void" ? "A cobrança ficará cancelada e não aceitará novas baixas. O registro continuará disponível no histórico." : "O valor voltará para o saldo da cobrança. A baixa original continuará visível como estornada."}</p><label><span>Justificativa *</span><textarea autoFocus minLength={5} value={confirm.reason} onChange={(event) => setConfirm({ ...confirm, reason: event.target.value })} required /></label></div><footer><button type="button" className="catalog-modal-cancel" onClick={() => setConfirm(null)}>Voltar</button><button className="danger" disabled={busy}>{confirm.kind === "void" ? "Cancelar cobrança" : "Confirmar estorno"}</button></footer></form></section></div>}
      {busy && <AppLoading text="Atualizando gestão financeira..." />}
    </div>
  );
}
