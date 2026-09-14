import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from "firebase/data-connect";
import { getFunctions, httpsCallable } from "firebase/functions";
import { connectorConfig } from "@insightpad/dataconnect";
import { SortableTableHeader } from "../components/SortableTableHeader";
import { useAuth } from "../auth/useAuth";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { firebaseApp } from "../lib/firebase";
import { nextTableSort, type TableSort } from "../utils/tableSorting";
import { SALES_CHANNEL_PROVIDERS, buildSalesChannelCsv, countActiveFilters, downloadSalesChannelCsv, salesChannelProviderLabel, type SalesChannelProvider } from "../utils/salesChannels";

const dc = getDataConnect(firebaseApp, connectorConfig);
const PAGE_SIZE = 50;
type CancellationReason = { code: string; label: string };
const fetchCancellationReasons = httpsCallable<{ orderId: string }, { reasons: CancellationReason[] }>(getFunctions(firebaseApp, "southamerica-east1"), "ifoodCancellationReasons");
type OrderStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";
type Branch = { id: string; name: string };
type ProductOption = { id: string; name: string; internalCode: string; ean?: string | null; scaleCode?: string | null; salePriceCents?: string | number; weightedProduct?: boolean; physicalStock?: string | number; reservedStock?: string | number; availableStock?: string | number };
type Filters = { status: string; provider: string; branchId: string; dateFrom: string; dateTo: string };
type Item = { id: string; productId?: string | null; productName?: string | null; mappingStatus: string; externalItemId?: string | null; externalProductId?: string | null; ean?: string | null; name: string; quantity: number; unitPriceCents: string; totalCents: string; observation?: string | null; allowNegativeStock?: boolean; physicalStock?: number; reservedStock?: number; availableStock?: number };
type History = { id: string; fromStatus?: string | null; toStatus: string; providerStatus?: string | null; origin: string; reason?: string | null; createdAt: string };
type Order = {
  id: string; providerOrderId: string; displayCode: string; provider: SalesChannelProvider; catalogProfile: "UNVERIFIED" | "RESTAURANT" | "GROCERY"; connectionId: string; connectionName: string; authorizationStatus: string; grocerySeparationStarted?: boolean;
  branchId: string; branchName: string; customerName?: string | null; orderType: string; paymentMethod?: string | null; deliveryAddress?: string | null; notes?: string | null;
  subtotalCents: string; deliveryFeeCents: string; discountCents: string; totalCents: string; status: OrderStatus; partnerStatus?: string | null;
  pendingAction?: string | null; commandStatus: string; lastPartnerRequestId?: string | null; receivedAt: string; acceptedAt?: string | null;
  rejectedAt?: string | null; completedAt?: string | null; statusUpdatedAt: string; rejectionReason?: string | null; version: number; items: Item[]; history?: History[];
  saleId?: string | null; commerceStatus: string; commerceError?: string | null; stockReservationStatus: string; deliveryProvider?: string | null; scheduledAt?: string | null; preparationStartAt?: string | null;
};
type Response = { rows: Order[]; total: number; summary: { pending: number; accepted: number; completed: number; attention: number } };
type Notice = { type: "success" | "error"; text: string };
type Action = "ACCEPT" | "REJECT" | "COMPLETE" | "CANCEL" | "ADD_ITEM" | "REPLACE_ITEM" | "UPDATE_ITEM" | "REMOVE_ITEM";
type PickingAction = Extract<Action, "ADD_ITEM" | "REPLACE_ITEM" | "UPDATE_ITEM" | "REMOVE_ITEM">;

const emptyResponse: Response = { rows: [], total: 0, summary: { pending: 0, accepted: 0, completed: 0, attention: 0 } };
const emptyFilters = (): Filters => ({ status: "", provider: "", branchId: "", dateFrom: "", dateTo: "" });
const money = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) / 100);
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const statusLabels: Record<OrderStatus, string> = { PENDING: "Aguardando", ACCEPTED: "Aceito", REJECTED: "Recusado", COMPLETED: "Concluído", CANCELLED: "Cancelado" };
const actionLabels: Record<Action, string> = { ACCEPT: "aceite", REJECT: "recusa", COMPLETE: "finalização", CANCEL: "cancelamento", ADD_ITEM: "adição de item", REPLACE_ITEM: "substituição de item", UPDATE_ITEM: "alteração de quantidade", REMOVE_ITEM: "remoção de item" };
const mutationApplied = (result: unknown) => Boolean((result as { data?: { _execute?: unknown } })?.data?._execute);
function box<T>(result: unknown): T | undefined { return (((result as { data?: { _select?: { data?: T }[] } }).data?._select ?? [])[0]?.data); }

export function ChannelOrdersPage() {
  const permission = useAuth().permissions.CANAIS_VENDA;
  const [data, setData] = useState<Response>(emptyResponse);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<TableSort | null>(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterModal, setFilterModal] = useState(false);
  const [busy, setBusy] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ order: Order; action: Action } | null>(null);
  const [picking, setPicking] = useState<{ order: Order; action: PickingAction; item?: Item } | null>(null);
  const [mapping, setMapping] = useState<{ order: Order; item: Item } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const sequence = useRef(0);

  const loadOptions = useCallback(async () => {
    const result = await executeQuery(queryRef(dc, "SalesChannelOptions", { requestKey: crypto.randomUUID() }));
    setBranches(box<{ branches: Branch[] }>(result)?.branches ?? []);
  }, []);
  const load = useCallback(async (silent = false) => {
    const request = ++sequence.current;
    if (!silent) setBusy(true);
    try {
      const result = await executeQuery(queryRef(dc, "SalesChannelOrdersV2", {
        filters: { term: term.trim(), ...filters }, sortField: sort?.key ?? "", sortDirection: sort?.direction ?? "",
        limit: PAGE_SIZE, offset: page * PAGE_SIZE, requestKey: crypto.randomUUID(),
      }));
      if (request === sequence.current) setData(box<Response>(result) ?? emptyResponse);
    } catch (error) {
      console.error(error);
      if (request === sequence.current) setNotice({ type: "error", text: "Não foi possível carregar os pedidos." });
    } finally { if (!silent && request === sequence.current) setBusy(false); }
  }, [filters, page, sort, term]);
  useEffect(() => { const timer = window.setTimeout(() => void loadOptions().catch(console.error), 0); return () => window.clearTimeout(timer); }, [loadOptions]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), term ? 350 : 0); return () => window.clearTimeout(timer); }, [load, term]);
  useEffect(() => { if (!data.rows.some((order) => ["PENDING", "ACCEPTED"].includes(order.status) || ["QUEUED", "RETRY", "PROCESSING", "AWAITING_PARTNER", "RECONCILING"].includes(order.commandStatus))) return; const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(true); }, 10_000); return () => window.clearInterval(timer); }, [data.rows, load]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 7000); return () => window.clearTimeout(timer); }, [notice]);

  const filterCount = countActiveFilters(filters);
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const hasTools = Boolean(term || filterCount || sort);
  function clearTools() { setTerm(""); setFilters(emptyFilters()); setDraftFilters(emptyFilters()); setSort(null); setPage(0); }
  function changeSort(key: string) { setSort((current) => nextTableSort(current, key)); setPage(0); }
  async function queue(order: Order, action: Action, reason = "", cancellationCode = "", itemId: string | null = null, ean = "", quantity = 0) {
    if (acting) return;
    setActing(order.id);
    try {
      const result = await executeMutation(mutationRef(dc, "QueueSalesChannelOrderAction", { id: order.id, action, reason, cancellationCode, itemId, ean, quantity, expectedVersion: order.version }));
      if (!mutationApplied(result)) throw new Error("Pedido alterado, ação inválida ou parceiro indisponível");
      setConfirm(null);
      setPicking(null);
      setNotice({ type: "success", text: `Solicitação de ${actionLabels[action]} enfileirada. O status final aparecerá após confirmação do parceiro.` });
      await load();
    } catch (error) { console.error(error); setNotice({ type: "error", text: "A ação não foi enviada. Atualize o pedido e confira a autorização do canal." }); }
    finally { setActing(null); }
  }
  async function reconcile(order: Order) { if (acting) return; setActing(order.id); try { const result = await executeMutation(mutationRef(dc, "RequestSalesChannelOrderReconciliation", { id: order.id, requestKey: crypto.randomUUID() })); if (!mutationApplied(result)) throw new Error("Indisponível"); setNotice({ type: "success", text: "Reconciliação iniciada. O Insight Pad consultará o estado real no iFood sem repetir a ação anterior." }); await load(); } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível reconciliar este pedido agora." }); } finally { setActing(null); } }
  async function mapItem(order: Order, item: Item, productId: string) { if (acting) return; setActing(order.id); try { const result = await executeMutation(mutationRef(dc, "MapSalesChannelOrderItem", { itemId: item.id, productId, requestKey: crypto.randomUUID() })); if (!mutationApplied(result)) throw new Error("Vínculo inválido"); setMapping(null); setNotice({ type: "success", text: "Item vinculado. Venda e estoque serão reconciliados automaticamente." }); await load(); } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível vincular. Confira se o código externo já pertence a outro produto." }); } finally { setActing(null); } }
  async function exportCsv() {
    setActing("export");
    try {
      const rows: Order[] = [];
      for (let offset = 0; offset < 5000; offset += 100) {
        const result = await executeQuery(queryRef(dc, "SalesChannelOrdersV2", { filters: { term: term.trim(), ...filters }, sortField: sort?.key ?? "", sortDirection: sort?.direction ?? "", limit: 100, offset, requestKey: crypto.randomUUID() }));
        const batch = box<Response>(result)?.rows ?? []; rows.push(...batch); if (batch.length < 100) break;
      }
      downloadSalesChannelCsv("pedidos-canais.csv", buildSalesChannelCsv(["Pedido", "ID parceiro", "Canal", "Loja", "Recebido", "Cliente", "Filial", "Total", "Status", "Comando"], rows.map((item) => [item.displayCode, item.providerOrderId, salesChannelProviderLabel(item.provider), item.connectionName, dateTime(item.receivedAt), item.customerName, item.branchName, money(item.totalCents), statusLabels[item.status], item.commandStatus])));
      setNotice({ type: "success", text: "CSV completo gerado com os filtros aplicados." });
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível exportar os pedidos." }); } finally { setActing(null); }
  }

  return <section className="catalog-page channel-orders-page">
    <header><div className="catalog-title-group"><Link className="catalog-back" to="/modulos/canais" aria-label="Voltar ao submenu de canais" title="Voltar"><span className="material-symbols-rounded">arrow_back</span></Link><div><span className="eyebrow">Canais de venda</span><h1>Pedidos integrados</h1></div></div><div className="catalog-header-actions">{hasTools && <button className="catalog-clear-tools" onClick={clearTools}><span className="material-symbols-rounded">ink_eraser</span>Limpar filtros</button>}<button className="catalog-primary" onClick={() => void load()} disabled={busy}><span className="material-symbols-rounded">refresh</span>Atualizar</button></div></header>
    {notice && <div className={`master-toast master-toast--${notice.type}`} role="alert" aria-live="assertive"><span className="material-symbols-rounded">{notice.type === "success" ? "check_circle" : "error"}</span><strong>{notice.text}</strong></div>}
    <div className="channels-guidance"><span className="material-symbols-rounded">sync_lock</span><div><strong>Status confirmado e venda integrada</strong><p>As ações passam por uma fila segura. Depois da confirmação do iFood, o Insight Pad reserva ou movimenta o estoque e cria a venda uma única vez, sem duplicar em reprocessamentos.</p></div></div>
    <div className="channels-kpis"><Kpi icon="notifications_active" label="Aguardando" value={data.summary.pending} detail="Exigem decisão" /><Kpi icon="skillet" label="Em preparo" value={data.summary.accepted} detail="Aceitos pelo parceiro" variant="success" /><Kpi icon="task_alt" label="Concluídos" value={data.summary.completed} detail="Operação finalizada" variant="success" /><Kpi icon="warning" label="Atenção" value={data.summary.attention} detail="Recusas, cancelamentos ou falhas" variant="danger" /></div>
    <div className="catalog-panel channel-orders-panel"><div className="catalog-toolbar channels-toolbar"><label><span className="material-symbols-rounded">search</span><input value={term} onChange={(event) => { setTerm(event.target.value); setPage(0); }} placeholder="Pesquisar pedido, ID externo ou cliente" /></label><button onClick={() => { setDraftFilters(filters); setFilterModal(true); }}><span className="material-symbols-rounded">tune</span>Pesquisa avançada{filterCount > 0 && <b>{filterCount}</b>}</button>{permission?.canExport && <button onClick={() => void exportCsv()} disabled={acting === "export"}>{acting === "export" ? "Exportando..." : "Exportar CSV"}</button>}</div><div className="catalog-scroll"><div className="catalog-table channel-orders-table"><table><thead><tr><SortableTableHeader label="Pedido" sortKey="displayCode" sort={sort} onChange={changeSort} /><SortableTableHeader label="Canal" sortKey="provider" sort={sort} onChange={changeSort} /><SortableTableHeader label="Recebido" sortKey="receivedAt" sort={sort} onChange={changeSort} /><SortableTableHeader label="Cliente" sortKey="customerName" sort={sort} onChange={changeSort} /><SortableTableHeader label="Filial" sortKey="branchName" sort={sort} onChange={changeSort} /><SortableTableHeader label="Total" sortKey="totalCents" sort={sort} onChange={changeSort} /><SortableTableHeader label="Status" sortKey="status" sort={sort} onChange={changeSort} /><th>Ações</th></tr></thead><tbody>{data.rows.map((order) => <Fragment key={order.id}><tr><td><strong>#{order.displayCode}</strong><small>ID: {order.providerOrderId}</small></td><td><span className={`channel-provider channel-provider--${order.provider.toLowerCase()}`}>{salesChannelProviderLabel(order.provider)}</span><small>{order.connectionName}</small></td><td>{dateTime(order.receivedAt)}</td><td>{order.customerName || "Não informado"}</td><td>{order.branchName}</td><td><strong>{money(order.totalCents)}</strong></td><td><OrderStatus order={order} /></td><td><OrderActions order={order} canUpdate={Boolean(permission?.canUpdate)} busy={acting === order.id} expanded={expanded === order.id} onExpand={() => setExpanded(expanded === order.id ? null : order.id)} onReconcile={() => void reconcile(order)} onAction={(action) => action === "ACCEPT" || action === "COMPLETE" ? void queue(order, action) : setConfirm({ order, action })} /></td></tr>{expanded === order.id && <tr className="channel-order-details"><td colSpan={8}><OrderDetails order={order} canUpdate={Boolean(permission?.canUpdate)} canManage={Boolean(permission?.canManage)} busy={acting === order.id} onMap={(item) => setMapping({ order, item })} onPicking={(action, item) => setPicking({ order, action, item })} /></td></tr>}</Fragment>)}</tbody></table>{!data.rows.length && !busy && <div className="channels-empty"><span className="material-symbols-rounded">receipt_long</span><strong>Nenhum pedido encontrado</strong><p>{hasTools ? "Altere os filtros para ampliar a pesquisa." : "Pedidos aparecerão após uma conexão autorizada receber eventos do parceiro."}</p></div>}</div></div><footer className="catalog-pagination"><button disabled={page === 0 || busy} onClick={() => setPage(Math.max(0, page - 1))}>← Anterior</button><span>Página {page + 1} de {pages} · {data.total} pedido(s)</span><button disabled={page + 1 >= pages || busy} onClick={() => setPage(page + 1)}>Próxima →</button></footer></div>
    {filterModal && <FilterModal branches={branches} value={draftFilters} setValue={setDraftFilters} onClose={() => setFilterModal(false)} onApply={(event) => { event.preventDefault(); setFilters(draftFilters); setPage(0); setFilterModal(false); }} />}
    {confirm && <ActionDialog action={confirm.action} order={confirm.order} busy={acting === confirm.order.id} onClose={() => setConfirm(null)} onConfirm={(reason, code) => void queue(confirm.order, confirm.action, reason, code)} />}
    {picking && <PickingDialog action={picking.action} order={picking.order} item={picking.item} busy={acting === picking.order.id} onClose={() => setPicking(null)} onConfirm={(ean, quantity) => void queue(picking.order, picking.action, "", "", picking.item?.id ?? null, ean, quantity)} />}
    {mapping && <OrderItemMappingDialog order={mapping.order} item={mapping.item} busy={acting === mapping.order.id} onClose={() => setMapping(null)} onConfirm={(productId) => void mapItem(mapping.order, mapping.item, productId)} />}
    {busy && <div className="catalog-loader"><div className="catalog-loader__mark"><span /><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" /></div><strong>Atualizando pedidos...</strong></div>}
  </section>;
}

function Kpi({ icon, label, value, detail, variant = "info" }: { icon: string; label: string; value: number; detail: string; variant?: string }) { return <article className={`channel-kpi channel-kpi--${variant}`}><span className="material-symbols-rounded">{icon}</span><div><small>{label}</small><strong>{Number(value)}</strong><p>{detail}</p></div></article>; }
function OrderStatus({ order }: { order: Order }) { const pending = ["QUEUED", "RETRY", "PROCESSING", "AWAITING_PARTNER", "RECONCILING"].includes(order.commandStatus); const error = ["ERROR", "RECONCILIATION_REQUIRED"].includes(order.commandStatus); return <div className="channel-order-status-stack"><span className={`channel-status channel-status--${order.status.toLowerCase()}`}><i />{statusLabels[order.status]}</span>{pending && <span className="channel-command-state"><span className="material-symbols-rounded">sync</span>{order.pendingAction ? `${actionLabels[order.pendingAction as Action] ?? order.pendingAction}: ${order.commandStatus === "AWAITING_PARTNER" ? "aguardando iFood" : "em processamento"}` : "Ação em processamento"}</span>}{error && <span className="channel-command-state channel-command-state--error"><span className="material-symbols-rounded">error</span>{order.commandStatus === "RECONCILIATION_REQUIRED" ? "Confirmação necessária" : "Falha no envio"}</span>}</div>; }
function acceptanceBlock(order: Order): string | null {
  if (order.items.some((item) => !item.productId)) return "Vincule todos os itens a produtos do Insight Pad antes de aceitar.";
  const required = new Map<string,{ quantity: number; available: number; allowNegative: boolean }>();
  order.items.forEach((item) => {
    if (!item.productId) return;
    const current = required.get(item.productId) ?? { quantity: 0, available: Number(item.availableStock ?? 0), allowNegative: Boolean(item.allowNegativeStock) };
    current.quantity += Number(item.quantity);
    required.set(item.productId,current);
  });
  return [...required.values()].some((item) => !item.allowNegative && item.available < item.quantity)
    ? "Estoque disponível insuficiente. Abra os detalhes para conferir o produto."
    : null;
}

function OrderActions({ order, canUpdate, busy, expanded, onExpand, onReconcile, onAction }: { order: Order; canUpdate: boolean; busy: boolean; expanded: boolean; onExpand: () => void; onReconcile: () => void; onAction: (action: Action) => void }) {
  const authorized = order.authorizationStatus === "AUTHORIZED";
  const grocery = order.catalogProfile === "GROCERY";
  const pendingCommand = ["QUEUED", "RETRY", "PROCESSING", "AWAITING_PARTNER", "RECONCILING"].includes(order.commandStatus);
  const requiresReconciliation = ["ERROR", "RECONCILIATION_REQUIRED"].includes(order.commandStatus);
  const disabled = busy || pendingCommand || !authorized;
  const acceptBlock = acceptanceBlock(order);
  const separationStarted = Boolean(order.grocerySeparationStarted) || ["SEPARATION_STARTED", "SEPARATION_ENDED"].includes(order.partnerStatus ?? "");
  const separationEnded = order.partnerStatus === "SEPARATION_ENDED";
  return <div className="catalog-actions">
    <button className="catalog-action catalog-action--info" onClick={onExpand}><span className="material-symbols-rounded">{expanded ? "expand_less" : "visibility"}</span>{expanded ? "Fechar" : "Detalhes"}</button>
    {canUpdate && requiresReconciliation && <button className="catalog-action catalog-action--edit" disabled={busy || !authorized} onClick={onReconcile}><span className="material-symbols-rounded">sync</span>Reconciliar</button>}
    {canUpdate && !requiresReconciliation && order.status === "PENDING" && <>
      <button className="catalog-action catalog-action--success" disabled={disabled || Boolean(acceptBlock)} title={!authorized ? "Canal não autorizado" : acceptBlock ?? undefined} onClick={() => onAction("ACCEPT")}><span className="material-symbols-rounded">check</span>{grocery ? "Iniciar separação" : "Aceitar"}</button>
      <button className="catalog-action catalog-action--danger" disabled={disabled} onClick={() => onAction("REJECT")}><span className="material-symbols-rounded">close</span>Recusar</button>
    </>}
    {canUpdate && !requiresReconciliation && order.status === "ACCEPTED" && <>{grocery && !separationStarted
      ? <button className="catalog-action catalog-action--success" disabled={disabled} onClick={() => onAction("ACCEPT")}><span className="material-symbols-rounded">playlist_add_check</span>Iniciar separação</button>
      : <button className="catalog-action catalog-action--success" disabled={disabled || separationEnded || (!grocery && ["READY_TO_PICKUP", "RTP", "DISPATCHED", "DSP"].includes(order.partnerStatus ?? ""))} onClick={() => onAction("COMPLETE")}><span className="material-symbols-rounded">task_alt</span>{grocery ? (separationEnded ? "Separação finalizada" : "Finalizar separação") : "Finalizar preparo"}</button>}
      <button className="catalog-action catalog-action--danger" disabled={disabled} onClick={() => onAction("CANCEL")}><span className="material-symbols-rounded">cancel</span>Cancelar</button>
    </>}
  </div>;
}
function OrderDetails({ order, canUpdate, canManage, busy, onPicking, onMap }: { order: Order; canUpdate: boolean; canManage: boolean; busy: boolean; onPicking: (action: PickingAction, item?: Item) => void; onMap: (item: Item) => void }) { const pendingCommand = ["QUEUED", "RETRY", "PROCESSING", "AWAITING_PARTNER", "RECONCILING"].includes(order.commandStatus); const separationStarted = Boolean(order.grocerySeparationStarted) || order.partnerStatus === "SEPARATION_STARTED"; const groceryPicking = order.catalogProfile === "GROCERY" && order.status === "ACCEPTED" && separationStarted && order.partnerStatus !== "SEPARATION_ENDED"; return <div className="channel-order-detail-grid"><section><h3>Itens do pedido</h3>{order.status === "PENDING" && acceptanceBlock(order) && <p className="catalog-form-error" role="alert">{acceptanceBlock(order)}</p>}{order.items.map((item) => <article key={item.id}><strong>{item.quantity}× {item.name}</strong><span>{money(item.totalCents)}</span><small className={item.productId ? "channel-item-mapped" : "channel-item-unmapped"}>{item.productId ? `Vinculado a ${item.productName || "produto interno"} · físico ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(item.physicalStock ?? 0))} · reservado ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(item.reservedStock ?? 0))} · disponível ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(item.availableStock ?? 0))}` : "Sem produto interno vinculado"}{item.ean ? ` · EAN ${item.ean}` : item.externalProductId ? ` · Código ${item.externalProductId}` : ""}</small>{item.observation && <small>{item.observation}</small>}{canManage && !item.productId && <button className="catalog-action catalog-action--edit channel-map-item" disabled={busy || pendingCommand} onClick={() => onMap(item)}><span className="material-symbols-rounded">link</span>Vincular produto</button>}{canUpdate && groceryPicking && item.externalItemId && <div className="catalog-actions"><button className="catalog-action catalog-action--edit" disabled={busy || pendingCommand} onClick={() => onPicking("UPDATE_ITEM", item)}>Quantidade</button><button className="catalog-action catalog-action--edit" disabled={busy || pendingCommand} onClick={() => onPicking("REPLACE_ITEM", item)}>Substituir</button><button className="catalog-action catalog-action--danger" disabled={busy || pendingCommand} onClick={() => onPicking("REMOVE_ITEM", item)}>Remover</button></div>}</article>)}{canUpdate && groceryPicking && <button className="catalog-action catalog-action--success" disabled={busy || pendingCommand} onClick={() => onPicking("ADD_ITEM")}><span className="material-symbols-rounded">add</span>Adicionar item à separação</button>}{order.catalogProfile === "GROCERY" && order.items.some((item) => !item.externalItemId) && <small>Alguns itens antigos não possuem o identificador de separação do iFood e permanecem somente para consulta.</small>}</section><aside><h3>Resumo e integração</h3><p><span>Subtotal</span><strong>{money(order.subtotalCents)}</strong></p><p><span>Entrega</span><strong>{money(order.deliveryFeeCents)}</strong></p><p><span>Desconto</span><strong>- {money(order.discountCents)}</strong></p><p className="total"><span>Total</span><strong>{money(order.totalCents)}</strong></p><small>{order.paymentMethod || "Pagamento não informado"}</small><small>Status do parceiro: {order.partnerStatus || "Não informado"}</small><small>Venda/estoque: {commerceLabel(order.commerceStatus, order.stockReservationStatus)}</small>{order.saleId && <Link className="channel-sale-link" to="/vendas/registros"><span className="material-symbols-rounded">receipt_long</span>Ver venda registrada</Link>}{order.commerceError && <small className="channel-commerce-error">Atenção: {order.commerceError}</small>}<small>Última alteração: {dateTime(order.statusUpdatedAt)}</small><small>Requisição: {order.lastPartnerRequestId || "—"}</small>{order.scheduledAt && <small>Agendado para: {dateTime(order.scheduledAt)}</small>}{order.preparationStartAt && <small>Início recomendado: {dateTime(order.preparationStartAt)}</small>}{order.deliveryProvider && <small>Entrega: {order.deliveryProvider}</small>}{order.deliveryAddress && <address>{order.deliveryAddress}</address>}{order.notes && <small>Observação: {order.notes}</small>}{order.rejectionReason && <small>Motivo: {order.rejectionReason}</small>}</aside>{Boolean(order.history?.length) && <section className="channel-order-history"><h3>Linha do tempo</h3>{order.history?.map((item) => <article key={item.id}><span className="material-symbols-rounded">radio_button_checked</span><div><strong>{item.toStatus}</strong><small>{item.origin} · {dateTime(item.createdAt)}</small>{item.reason && <p>{item.reason}</p>}</div></article>)}</section>}</div>; }
function commerceLabel(commerce: string, stock: string) { if (commerce === "POSTED") return "Venda criada e estoque movimentado"; if (commerce === "BLOCKED_MAPPING") return "Aguardando vínculo de produto"; if (commerce === "RESERVED_WITH_SHORTAGE") return "Reserva com estoque insuficiente"; if (stock === "RESERVED") return "Estoque reservado"; if (commerce === "REVERSED" || stock === "REVERSED") return "Venda e estoque estornados"; if (stock === "RELEASED") return "Reserva liberada"; return "Aguardando confirmação"; }

function OrderItemMappingDialog({ order, item, busy, onClose, onConfirm }: { order: Order; item: Item; busy: boolean; onClose: () => void; onConfirm: (productId: string) => void }) {
  const [term, setTerm] = useState(item.ean || item.externalProductId || item.name);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  useDialogAccessibility(true, onClose);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await executeQuery(queryRef(dc, "SalesChannelProductOptions", { term: term.trim(), connectionId: order.connectionId, limit: 30, requestKey: crypto.randomUUID() }));
        if (!cancelled) setProducts((result.data as { _select?: ProductOption[] })._select ?? []);
      } catch (error) {
        console.error(error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, term ? 250 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [order.connectionId, term]);

  const selectedProduct = products.find((product) => product.id === selected);
  const available = Number(selectedProduct?.availableStock ?? 0);
  const enoughStock = available >= Number(item.quantity);

  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-mapping-modal" role="dialog" aria-modal="true" aria-label="Vincular item ao produto interno">
    <header><div><span className="eyebrow">Pedido #{order.displayCode}</span><h2>Qual produto é “{item.name}”?</h2></div><button onClick={onClose} aria-label="Fechar" disabled={busy}>×</button></header>
    <div className="channel-reject-body">
      <div className="channel-modal__notice"><span className="material-symbols-rounded">link</span><p>Esse vínculo define qual cadastro terá o estoque reservado, baixado ou estornado neste pedido e nos próximos pedidos com o mesmo código. Confira com atenção.</p></div>
      <label><span>Pesquisar produto cadastrado</span><input autoFocus value={term} onChange={(event) => { setTerm(event.target.value); setSelected(""); }} maxLength={160} placeholder="Nome, código interno, EAN ou balança" disabled={busy} /></label>
      <div className="channel-product-results" role="listbox" aria-label="Produtos encontrados">{loading ? <small>Pesquisando...</small> : products.length ? products.map((product) => <button type="button" role="option" aria-selected={selected === product.id} key={product.id} onClick={() => setSelected(product.id)}><strong>{product.name}</strong><small>{product.internalCode || "Sem código"}{product.ean ? ` · EAN ${product.ean}` : product.scaleCode ? ` · Balança ${product.scaleCode}` : ""} · disponível {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(product.availableStock ?? 0))}</small></button>) : <small>Nenhum produto encontrado.</small>}</div>
      {selectedProduct && <section className="channel-mapping-confirmation"><h3>Confirme a baixa</h3><p><strong>{item.quantity} × {selectedProduct.name}</strong></p><small>Estoque físico: {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(selectedProduct.physicalStock ?? 0))} · reservado: {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(selectedProduct.reservedStock ?? 0))} · disponível: {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(available)}</small>{!enoughStock && <p className="channel-field-error">Não há estoque disponível suficiente. O vínculo pode ser salvo para corrigir o cadastro, mas o pedido não poderá ser aceito sem estoque ou permissão de estoque negativo.</p>}</section>}
    </div>
    <footer><button className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className="catalog-primary catalog-modal-submit" disabled={busy || !selected} onClick={() => onConfirm(selected)}>{busy ? "Vinculando..." : "Confirmar produto e reconciliar"}</button></footer>
  </section></div>;
}

function FilterModal({ branches, value, setValue, onClose, onApply }: { branches: Branch[]; value: Filters; setValue: (value: Filters) => void; onClose: () => void; onApply: (event: FormEvent) => void }) { useDialogAccessibility(true, onClose); return <div className="catalog-backdrop"><section className="catalog-modal master-modal advanced-search-modal channel-filter-modal" role="dialog" aria-modal="true" aria-label="Pesquisa avançada de pedidos"><header><div><span className="eyebrow">Pesquisa</span><h2>Filtros avançados</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={onApply}><div className="master-form-grid"><label><span>Status</span><select value={value.status} onChange={(event) => setValue({ ...value, status: event.target.value })}><option value="">Todos</option>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label><span>Parceiro</span><select value={value.provider} onChange={(event) => setValue({ ...value, provider: event.target.value })}><option value="">Todos</option>{Object.entries(SALES_CHANNEL_PROVIDERS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><label><span>Filial</span><select value={value.branchId} onChange={(event) => setValue({ ...value, branchId: event.target.value })}><option value="">Todas</option>{branches.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label><span>Recebido a partir de</span><input type="date" value={value.dateFrom} onChange={(event) => setValue({ ...value, dateFrom: event.target.value })} /></label><label><span>Recebido até</span><input type="date" value={value.dateTo} min={value.dateFrom || undefined} onChange={(event) => setValue({ ...value, dateTo: event.target.value })} /></label></div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose}>Cancelar</button><button className="catalog-primary catalog-modal-submit">Aplicar filtros</button></footer></form></section></div>; }
function ActionDialog({ action, order, busy, onClose, onConfirm }: { action: Action; order: Order; busy: boolean; onClose: () => void; onConfirm: (reason: string, code: string) => void }) {
  const [reason, setReason] = useState("");
  const [code, setCode] = useState("");
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const requiresReason = action === "REJECT" || action === "CANCEL";
  const needsIfoodReasons = requiresReason && order.provider === "IFOOD";
  const [loading, setLoading] = useState(needsIfoodReasons);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useDialogAccessibility(true, onClose);
  useEffect(() => {
    let cancelled = false;
    if (!needsIfoodReasons) return;
    void fetchCancellationReasons({ orderId: order.id }).then(({ data }) => {
      if (!cancelled) setReasons(data.reasons);
    }).catch(() => {
      if (!cancelled) setError("Não foi possível consultar os motivos disponíveis no iFood.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [order.id, needsIfoodReasons, attempt]);
  const valid = !requiresReason || (reason.trim().length >= 5 && (order.provider !== "IFOOD" || reasons.some((item) => item.code === code)));
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-reject-modal" role="dialog" aria-modal="true" aria-label={`${actionLabels[action]} do pedido`}><header><div><span className="eyebrow">Pedido #{order.displayCode}</span><h2>Confirmar {actionLabels[action]}</h2></div><button onClick={onClose} aria-label="Fechar" disabled={busy}>×</button></header><div className="channel-reject-body"><p>A solicitação será enviada ao parceiro e o status só mudará após a confirmação oficial.</p>
    {requiresReason && order.provider === "IFOOD" && <label><span>Motivo disponível no iFood</span><select value={code} disabled={loading || busy} onChange={(event) => { setCode(event.target.value); setReason(reasons.find((item) => item.code === event.target.value)?.label ?? ""); }}><option value="">{loading ? "Consultando iFood..." : "Selecione o motivo"}</option>{reasons.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>}
    {error && <p role="alert">{error} <button type="button" onClick={() => { setLoading(true); setError(""); setAttempt(attempt + 1); }}>Tentar novamente</button></p>}
    {!loading && !error && requiresReason && order.provider === "IFOOD" && !reasons.length && <p>O iFood não permite solicitar o cancelamento deste pedido no momento.</p>}
    {requiresReason && <label><span>Detalhes do motivo</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Informe pelo menos 5 caracteres" disabled={busy} /></label>}</div><footer><button className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className={`catalog-action catalog-modal-submit ${requiresReason ? "catalog-action--danger" : "catalog-action--success"}`} disabled={!valid || busy || loading} onClick={() => onConfirm(reason.trim(), code)}>{busy ? "Enviando..." : "Confirmar solicitação"}</button></footer></section></div>;
}

function PickingDialog({ action, order, item, busy, onClose, onConfirm }: { action: PickingAction; order: Order; item?: Item; busy: boolean; onClose: () => void; onConfirm: (ean: string, quantity: number) => void }) {
  const [ean, setEan] = useState("");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  useDialogAccessibility(true, onClose);
  const needsEan = action === "ADD_ITEM" || action === "REPLACE_ITEM";
  const needsQuantity = action !== "REMOVE_ITEM";
  const parsedQuantity = Number(quantity);
  const validQuantity = !needsQuantity || (Number.isFinite(parsedQuantity) && parsedQuantity > 0 && parsedQuantity <= 10_000 && Math.round(parsedQuantity * 1000) === parsedQuantity * 1000);
  const validEan = !needsEan || /^[A-Za-z0-9._-]{1,160}$/.test(ean.trim());
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-reject-modal" role="dialog" aria-modal="true" aria-label={`${actionLabels[action]} do pedido`}><header><div><span className="eyebrow">Pedido #{order.displayCode}</span><h2>{actionLabels[action]}</h2></div><button onClick={onClose} aria-label="Fechar" disabled={busy}>×</button></header><div className="channel-reject-body"><p>{action === "REMOVE_ITEM" ? `O item “${item?.name ?? "selecionado"}” será removido da sacola em separação.` : action === "UPDATE_ITEM" ? `Informe a quantidade separada de “${item?.name ?? "item"}”.` : "Use o EAN ou código de balança exato do produto que será separado."}</p>{needsEan && <label><span>EAN / código de balança</span><input autoFocus value={ean} onChange={(event) => setEan(event.target.value)} maxLength={160} autoComplete="off" placeholder="Ex.: 7890000000000" disabled={busy} /></label>}{needsQuantity && <label><span>Quantidade</span><input autoFocus={!needsEan} type="number" min="0.001" max="10000" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={busy} /></label>}</div><footer><button className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className={`catalog-action catalog-modal-submit ${action === "REMOVE_ITEM" ? "catalog-action--danger" : "catalog-action--success"}`} disabled={busy || !validQuantity || !validEan} onClick={() => onConfirm(ean.trim(), needsQuantity ? parsedQuantity : 0)}>{busy ? "Enviando..." : "Confirmar"}</button></footer></section></div>;
}
