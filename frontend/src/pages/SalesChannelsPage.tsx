import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from "firebase/data-connect";
import { connectorConfig } from "@insightpad/dataconnect";
import { SortableTableHeader } from "../components/SortableTableHeader";
import { useAuth } from "../auth/useAuth";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { firebaseApp } from "../lib/firebase";
import { nextTableSort, type TableSort } from "../utils/tableSorting";
import {
  SALES_CHANNEL_PROVIDERS,
  buildSalesChannelCsv,
  countActiveFilters,
  downloadSalesChannelCsv,
  isSalesChannelOperational,
  salesChannelHealth,
  salesChannelProviderLabel,
  type SalesChannelProvider,
} from "../utils/salesChannels";

const dc = getDataConnect(firebaseApp, connectorConfig);
const PAGE_SIZE = 50;
type Section = "connections" | "products" | "operations";
type Notice = { type: "success" | "error"; text: string };
type Branch = { id: string; name: string };
type CatalogProfile = "UNVERIFIED" | "RESTAURANT" | "GROCERY";
type ConnectionOption = { catalogProfile: CatalogProfile; id: string; provider: SalesChannelProvider; displayName: string; branchId: string; branchName: string; status: string; authorizationStatus: string; enabled: boolean };
type Options = { branches: Branch[]; connections: ConnectionOption[] };
type Connection = ConnectionOption & {
  externalStoreId?: string | null; integrationMode: string; webhookStatus: string; tokenExpiresAt?: string | null;
  lastHealthCheckAt?: string | null; lastSuccessAt?: string | null; lastSyncedAt?: string | null; lastRequestId?: string | null;
  lastError?: string | null; consecutiveFailures: number; mappingCount: number; pendingOrders: number; createdAt: string; updatedAt: string;
};
type Mapping = {
  id: string; connectionId: string; connectionName: string; provider: SalesChannelProvider; catalogProfile: CatalogProfile; branchName: string; productId: string;
  productName: string; internalCode?: string | null; ean?: string | null; externalProductId: string; externalProductName?: string | null;
  syncPrice: boolean; syncStock: boolean; enabled: boolean; status: string; syncStatus: string; lastSyncedAt?: string | null;
  lastError?: string | null; version: number; updatedAt: string;
};
type ProductOption = { id: string; name: string; internalCode?: string | null; ean?: string | null; scaleCode?: string | null };
type Operation = { id: string; connectionId: string; connectionName: string; provider: SalesChannelProvider; status: string; attempts: number; lastError?: string | null };
type EventOperation = Operation & { providerEventId: string; eventType: string; receivedAt: string };
type CommandOperation = Operation & { action: string; createdAt: string };
type SyncOperation = Operation & { jobType: string; totalItems: number; processedItems: number; failedItems: number; createdAt: string };
type Operations = { events: EventOperation[]; commands: CommandOperation[]; jobs: SyncOperation[]; summary: { eventFailures: number; queuedCommands: number; syncFailures: number } };
type Paged<T> = { rows: T[]; total: number; summary: Record<string, number> };
type Filters = { provider: string; status: string; branchId: string; connectionId: string };
type ConnectionForm = { catalogProfile: CatalogProfile; provider: SalesChannelProvider; branchId: string; displayName: string; externalStoreId: string; enabled: boolean };
type MappingForm = { connectionId: string; productId: string; externalProductId: string; externalProductName: string; syncPrice: boolean; syncStock: boolean; enabled: boolean };

const emptyOptions: Options = { branches: [], connections: [] };
const emptyOperations: Operations = { events: [], commands: [], jobs: [], summary: { eventFailures: 0, queuedCommands: 0, syncFailures: 0 } };
const emptyFilters = (): Filters => ({ provider: "", status: "", branchId: "", connectionId: "" });
const blankConnection = (branchId = ""): ConnectionForm => ({ catalogProfile: "UNVERIFIED", provider: "IFOOD", branchId, displayName: "", externalStoreId: "", enabled: true });
const blankMapping = (connectionId = ""): MappingForm => ({ connectionId, productId: "", externalProductId: "", externalProductName: "", syncPrice: false, syncStock: false, enabled: true });
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const mutationApplied = (result: unknown) => Boolean((result as { data?: { _execute?: unknown } })?.data?._execute);
function box<T>(result: unknown): T | undefined { return (((result as { data?: { _select?: { data?: T }[] } }).data?._select ?? [])[0]?.data); }

export function SalesChannelsPage() {
  const permission = useAuth().permissions.CANAIS_VENDA;
  const [params, setParams] = useSearchParams();
  const requested = params.get("section");
  const section: Section = requested === "products" || requested === "operations" ? requested : "connections";
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [connections, setConnections] = useState<Paged<Connection>>({ rows: [], total: 0, summary: {} });
  const [mappings, setMappings] = useState<Paged<Mapping>>({ rows: [], total: 0, summary: {} });
  const [operations, setOperations] = useState<Operations>(emptyOperations);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<TableSort | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [filterModal, setFilterModal] = useState(false);
  const [connectionModal, setConnectionModal] = useState<Connection | "new" | null>(null);
  const [connectionForm, setConnectionForm] = useState<ConnectionForm>(blankConnection());
  const [mappingModal, setMappingModal] = useState<Mapping | "new" | null>(null);
  const [mappingForm, setMappingForm] = useState<MappingForm>(blankMapping());
  const [confirmRemove, setConfirmRemove] = useState<Connection | Mapping | null>(null);
  const [diagnostics, setDiagnostics] = useState<Connection | null>(null);
  const sequence = useRef(0);

  const loadOptions = useCallback(async () => {
    const result = await executeQuery(queryRef(dc, "SalesChannelOptions", { requestKey: crypto.randomUUID() }));
    setOptions(box<Options>(result) ?? emptyOptions);
  }, []);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setBusy(true);
    try {
      if (section === "connections") {
        const result = await executeQuery(queryRef(dc, "SalesChannelConnectionsV2", { term: term.trim(), provider: filters.provider, status: filters.status, branchId: filters.branchId || null, sortField: sort?.key ?? "", sortDirection: sort?.direction ?? "", limit: PAGE_SIZE, offset: page * PAGE_SIZE, requestKey: crypto.randomUUID() }));
        if (request === sequence.current) setConnections(box<Paged<Connection>>(result) ?? { rows: [], total: 0, summary: {} });
      } else if (section === "products") {
        const result = await executeQuery(queryRef(dc, "SalesChannelProductMappingsV2", { term: term.trim(), provider: filters.provider, connectionId: filters.connectionId || null, status: filters.status, sortField: sort?.key ?? "", sortDirection: sort?.direction ?? "", limit: PAGE_SIZE, offset: page * PAGE_SIZE, requestKey: crypto.randomUUID() }));
        if (request === sequence.current) setMappings(box<Paged<Mapping>>(result) ?? { rows: [], total: 0, summary: {} });
      } else {
        const result = await executeQuery(queryRef(dc, "SalesChannelOperations", { connectionId: filters.connectionId || null, requestKey: crypto.randomUUID() }));
        if (request === sequence.current) setOperations(box<Operations>(result) ?? emptyOperations);
      }
    } catch (error) {
      console.error(error);
      if (request === sequence.current) setNotice({ type: "error", text: "Não foi possível carregar a gestão de canais." });
    } finally { if (request === sequence.current) setBusy(false); }
  }, [filters, page, section, sort, term]);

  useEffect(() => { const timer = window.setTimeout(() => void loadOptions().catch((error) => { console.error(error); setNotice({ type: "error", text: "Não foi possível carregar filiais e conexões." }); }), 0); return () => window.clearTimeout(timer); }, [loadOptions]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), term ? 350 : 0); return () => { window.clearTimeout(timer); sequence.current += 1; }; }, [load, term]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 7000); return () => window.clearTimeout(timer); }, [notice]);
  useEffect(() => {
    if (section !== "connections" || !connections.rows.some((item) => ["PENDING", "PENDING_APPROVAL"].includes(item.authorizationStatus))) return;
    const timer = window.setTimeout(() => void load(), 3000);
    return () => window.clearTimeout(timer);
  }, [connections.rows, load, section]);

  const filterCount = countActiveFilters(filters);
  const total = section === "connections" ? connections.total : section === "products" ? mappings.total : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasTools = Boolean(term || filterCount || sort);
  function changeSection(next: Section) { setParams(next === "connections" ? {} : { section: next }); setTerm(""); setFilters(emptyFilters()); setDraftFilters(emptyFilters()); setSort(null); setPage(0); }
  function changeSort(key: string) { setSort((current) => nextTableSort(current, key)); setPage(0); }
  function clearTools() { setTerm(""); setFilters(emptyFilters()); setDraftFilters(emptyFilters()); setSort(null); setPage(0); }
  function openConnection(item?: Connection) { setConnectionModal(item ?? "new"); setConnectionForm(item ? { catalogProfile: item.catalogProfile ?? "UNVERIFIED", provider: item.provider, branchId: item.branchId, displayName: item.displayName, externalStoreId: item.externalStoreId ?? "", enabled: item.enabled } : blankConnection(options.branches[0]?.id)); }
  function openMapping(item?: Mapping) { const initial = options.connections[0]; setMappingModal(item ?? "new"); setMappingForm(item ? { connectionId: item.connectionId, productId: item.productId, externalProductId: item.externalProductId, externalProductName: item.externalProductName ?? "", syncPrice: item.syncPrice, syncStock: item.syncStock, enabled: item.enabled } : { ...blankMapping(initial?.id), syncPrice: initial?.catalogProfile === "GROCERY", syncStock: initial?.catalogProfile === "GROCERY" }); }
  async function refresh(message?: string) { await Promise.all([load(), loadOptions()]); if (message) setNotice({ type: "success", text: message }); }
  async function saveConnection(event: FormEvent) {
    event.preventDefault();
    if (acting) return;
    if (!connectionForm.branchId || connectionForm.displayName.trim().length < 2) return setNotice({ type: "error", text: "Informe a filial e um nome com pelo menos 2 caracteres." });
    setActing("connection");
    try {
      const editing = connectionModal !== "new" ? connectionModal : null;
      const result = editing
        ? await executeMutation(mutationRef(dc, "UpdateSalesChannelConnection", { id: editing.id, displayName: connectionForm.displayName.trim(), externalStoreId: connectionForm.externalStoreId.trim(), enabled: connectionForm.enabled, catalogProfile: connectionForm.catalogProfile }))
        : await executeMutation(mutationRef(dc, "CreateSalesChannelConnection", { provider: connectionForm.provider, branchId: connectionForm.branchId, displayName: connectionForm.displayName.trim(), externalStoreId: connectionForm.externalStoreId.trim(), catalogProfile: connectionForm.catalogProfile }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      setConnectionModal(null); await refresh(editing ? "Configuração atualizada." : "Ambiente preparado. O credenciamento oficial é a próxima etapa.");
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível salvar. Verifique sua permissão, duplicidade e operações em andamento. Uma loja com pedidos ou produtos vinculados precisa de uma nova conexão para trocar o ID." }); } finally { setActing(null); }
  }
  async function saveMapping(event: FormEvent) {
    event.preventDefault();
    if (acting) return;
    const profile = options.connections.find((item) => item.id === mappingForm.connectionId)?.catalogProfile;
    if (!mappingForm.connectionId || !mappingForm.productId || (profile !== "GROCERY" && !mappingForm.externalProductId.trim())) return setNotice({ type: "error", text: profile === "GROCERY" ? "Selecione uma conexão e um produto com EAN ou código de balança." : "Selecione conexão e produto e informe o ID externo." });
    setActing("mapping");
    try {
      const editing = mappingModal !== "new" ? mappingModal : null;
      const result = editing
        ? await executeMutation(mutationRef(dc, "UpdateSalesChannelProductMapping", { id: editing.id, externalProductId: mappingForm.externalProductId.trim(), externalProductName: mappingForm.externalProductName.trim(), syncPrice: mappingForm.syncPrice, syncStock: mappingForm.syncStock, enabled: mappingForm.enabled }))
        : await executeMutation(mutationRef(dc, "CreateSalesChannelProductMapping", { connectionId: mappingForm.connectionId, productId: mappingForm.productId, externalProductId: mappingForm.externalProductId.trim(), externalProductName: mappingForm.externalProductName.trim(), syncPrice: mappingForm.syncPrice, syncStock: mappingForm.syncStock }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      setMappingModal(null); await refresh(editing ? "Vínculo atualizado e marcado para sincronização." : "Produto vinculado e pronto para sincronização.");
    } catch (error) { console.error(error); setNotice({ type: "error", text: profile === "GROCERY" ? "Não foi possível salvar. O produto Mercado precisa de EAN ou código de balança exclusivo." : "Não foi possível salvar. Verifique produto ou ID externo duplicado." }); } finally { setActing(null); }
  }
  async function remove() {
    if (!confirmRemove) return;
    setActing(confirmRemove.id);
    try {
      const connection = "branchId" in confirmRemove;
      const result = await executeMutation(mutationRef(dc, connection ? "ArchiveSalesChannelConnection" : "ArchiveSalesChannelProductMapping", { id: confirmRemove.id }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      setConfirmRemove(null); await refresh(connection ? "Conexão, vínculos e filas pendentes desativados." : "Vínculo removido com segurança.");
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível concluir a remoção." }); } finally { setActing(null); }
  }
  async function sync(connectionId: string) {
    const profile = options.connections.find((item) => item.id === connectionId)?.catalogProfile;
    if (profile !== "RESTAURANT" && profile !== "GROCERY") {
      setNotice({ type: "error", text: "Confirme o tipo de catálogo em Configurar antes de sincronizar." });
      return;
    }
    setActing(connectionId);
    try {
      const result = await executeMutation(mutationRef(dc, "RequestSalesChannelSync", { connectionId, scope: "FULL", requestKey: crypto.randomUUID() }));
      if (!mutationApplied(result)) throw new Error("Conexão indisponível");
      await refresh(profile === "GROCERY" ? "Publicação Mercado enfileirada pela Item API oficial do iFood." : "Sincronização enfileirada sem bloquear a operação.");
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Confira a autorização e se já existe uma sincronização em andamento." }); } finally { setActing(null); }
  }
  async function authorize(connectionId: string) {
    setActing(connectionId);
    try {
      const result = await executeMutation(mutationRef(dc, "RequestSalesChannelAuthorization", { connectionId, requestKey: crypto.randomUUID() }));
      if (!mutationApplied(result)) throw new Error("Conexão não elegível");
      await refresh("Validação segura iniciada. Acompanhe o resultado em Diagnóstico ou Operações.");
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Não foi possível iniciar a autorização. Confirme o ID oficial da loja e se não existe outra validação em andamento." });
    } finally { setActing(null); }
  }
  async function retry(id: string) {
    setActing(id);
    try { const result = await executeMutation(mutationRef(dc, "RetrySalesChannelCommand", { id })); if (!mutationApplied(result)) throw new Error("Não elegível"); await refresh("Comando reenfileirado."); }
    catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível reenfileirar este comando." }); } finally { setActing(null); }
  }
  async function exportCsv() {
    setActing("export");
    try {
      if (section === "connections") {
        const rows: Connection[] = [];
        for (let offset = 0; offset < 5000; offset += 100) {
          const result = await executeQuery(queryRef(dc, "SalesChannelConnectionsV2", { term: term.trim(), provider: filters.provider, status: filters.status, branchId: filters.branchId || null, sortField: sort?.key ?? "", sortDirection: sort?.direction ?? "", limit: 100, offset, requestKey: crypto.randomUUID() }));
          const batch = box<Paged<Connection>>(result)?.rows ?? []; rows.push(...batch); if (batch.length < 100) break;
        }
        downloadSalesChannelCsv("conexoes-canais.csv", buildSalesChannelCsv(["Parceiro", "Loja", "Filial", "ID externo", "Autorização", "Saúde", "Sincronização"], rows.map((item) => [salesChannelProviderLabel(item.provider), item.displayName, item.branchName, item.externalStoreId, item.authorizationStatus, salesChannelHealth(item).label, dateTime(item.lastSyncedAt)])));
      }
      if (section === "products") {
        const rows: Mapping[] = [];
        for (let offset = 0; offset < 5000; offset += 100) {
          const result = await executeQuery(queryRef(dc, "SalesChannelProductMappingsV2", { term: term.trim(), provider: filters.provider, connectionId: filters.connectionId || null, status: filters.status, sortField: sort?.key ?? "", sortDirection: sort?.direction ?? "", limit: 100, offset, requestKey: crypto.randomUUID() }));
          const batch = box<Paged<Mapping>>(result)?.rows ?? []; rows.push(...batch); if (batch.length < 100) break;
        }
        downloadSalesChannelCsv("catalogo-canais.csv", buildSalesChannelCsv(["Produto", "Código", "Parceiro", "Conexão", "ID externo", "Preço", "Estoque", "Status"], rows.map((item) => [item.productName, item.internalCode, salesChannelProviderLabel(item.provider), item.connectionName, item.externalProductId, item.syncPrice ? "Automático" : "Manual", item.syncStock ? "Automático" : "Manual", item.syncStatus])));
      }
      setNotice({ type: "success", text: "CSV completo gerado com os filtros aplicados." });
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível exportar os dados." }); } finally { setActing(null); }
  }

  return <section className="catalog-page channels-page">
    <header><div className="catalog-title-group"><Link className="catalog-back" to="/modulos/canais" aria-label="Voltar ao submenu de canais" title="Voltar"><span className="material-symbols-rounded">arrow_back</span></Link><div><span className="eyebrow">Canais de venda</span><h1>Gestão de conexões</h1></div></div><div className="catalog-header-actions">{hasTools && <button className="catalog-clear-tools" onClick={clearTools}><span className="material-symbols-rounded">ink_eraser</span>Limpar filtros</button>}{section === "connections" && permission?.canCreate && <button className="catalog-primary" onClick={() => openConnection()}><span className="material-symbols-rounded">add_link</span>Novo canal</button>}{section === "products" && permission?.canManage && <button className="catalog-primary" onClick={() => openMapping()} disabled={!options.connections.length}><span className="material-symbols-rounded">add</span>Vincular produto</button>}</div></header>
    {notice && <div className={`master-toast master-toast--${notice.type}`} role="alert" aria-live="assertive"><span className="material-symbols-rounded">{notice.type === "success" ? "check_circle" : "error"}</span><strong>{notice.text}</strong></div>}
    <nav className="channels-management-tabs" aria-label="Áreas da gestão"><button className={section === "connections" ? "active" : ""} onClick={() => changeSection("connections")}><span className="material-symbols-rounded">hub</span>Conexões</button><button className={section === "products" ? "active" : ""} onClick={() => changeSection("products")}><span className="material-symbols-rounded">inventory_2</span>Catálogo</button><button className={section === "operations" ? "active" : ""} onClick={() => changeSection("operations")}><span className="material-symbols-rounded">monitor_heart</span>Operações</button></nav>
    <Readiness />
    {section === "connections" && <Kpis items={[["link", "Conexões", connections.summary.total, "Ambientes configurados", "info"], ["verified", "Autorizadas", connections.summary.authorized, "Prontas para operar", "success"], ["build_circle", "Em preparação", connections.summary.preparing, "Dependem do parceiro", "info"], ["warning", "Atenção", connections.summary.attention, "Exigem diagnóstico", "danger"]]} />}
    {section === "products" && <Kpis items={[["inventory_2", "Produtos vinculados", mappings.summary.total, "Catálogo integrado", "info"], ["bolt", "Automáticos", mappings.summary.automatic, "Preço ou estoque ativo", "success"], ["schedule", "Pendentes", mappings.summary.pending, "Aguardam processamento", "info"], ["error", "Com erro", mappings.summary.errors, "Exigem correção", "danger"]]} />}
    {section === "operations" && <Kpis items={[["webhook", "Falhas de evento", operations.summary.eventFailures, "Inbox idempotente", operations.summary.eventFailures ? "danger" : "success"], ["outbox", "Comandos em fila", operations.summary.queuedCommands, "Aguardando parceiro", "info"], ["sync_problem", "Falhas de sincronização", operations.summary.syncFailures, "Catálogo, preço e estoque", operations.summary.syncFailures ? "danger" : "success"]]} />}
    <div className="catalog-panel channels-tools-panel"><Toolbar section={section} term={term} setTerm={(value) => { setTerm(value); setPage(0); }} filterCount={filterCount} onFilters={() => { setDraftFilters(filters); setFilterModal(true); }} onExport={permission?.canExport && section !== "operations" ? exportCsv : undefined} exportBusy={acting === "export"} onRefresh={() => void load()} busy={busy} /></div>
    {section === "connections" && <Connections data={connections} permission={permission} sort={sort} acting={acting} onSort={changeSort} onEdit={openConnection} onDiagnostics={setDiagnostics} onAuthorize={authorize} onSync={sync} onRemove={setConfirmRemove} />}
    {section === "products" && <Mappings data={mappings} permission={permission} sort={sort} acting={acting} onSort={changeSort} onEdit={openMapping} onSync={sync} onRemove={setConfirmRemove} />}
    {section === "operations" && <OperationPanels data={operations} permission={permission} acting={acting} onRetry={retry} />}
    {section !== "operations" && <footer className="catalog-pagination channels-pagination"><button disabled={page === 0 || busy} onClick={() => setPage(Math.max(0, page - 1))}>← Anterior</button><span>Página {page + 1} de {pages} · {total} registro(s)</span><button disabled={page + 1 >= pages || busy} onClick={() => setPage(page + 1)}>Próxima →</button></footer>}
    {filterModal && <FilterModal section={section} options={options} value={draftFilters} setValue={setDraftFilters} onClose={() => setFilterModal(false)} onApply={(event) => { event.preventDefault(); setFilters(draftFilters); setPage(0); setFilterModal(false); }} />}
    {connectionModal && <ConnectionModal editing={connectionModal !== "new" ? connectionModal : null} branches={options.branches} form={connectionForm} setForm={setConnectionForm} busy={acting === "connection"} onClose={() => setConnectionModal(null)} onSubmit={saveConnection} />}
    {mappingModal && <MappingModal editing={mappingModal !== "new" ? mappingModal : null} connections={options.connections} form={mappingForm} setForm={setMappingForm} busy={acting === "mapping"} onClose={() => setMappingModal(null)} onSubmit={saveMapping} />}
    {confirmRemove && <RemoveDialog connection={"branchId" in confirmRemove} grocery={!('branchId' in confirmRemove) && confirmRemove.catalogProfile === "GROCERY"} busy={acting === confirmRemove.id} onClose={() => setConfirmRemove(null)} onConfirm={() => void remove()} />}
    {diagnostics && <Diagnostics connection={diagnostics} onClose={() => setDiagnostics(null)} />}
    {busy && <Loading />}
  </section>;
}

function Readiness() { return <div className="channels-guidance"><span className="material-symbols-rounded">verified_user</span><div><strong>Central segura de integração com parceiros</strong><p>Pedidos, catálogo, comandos, eventos e diagnósticos são processados no servidor e isolados por empresa e filial. Tokens e chaves nunca passam pelo navegador.</p></div><span className="channel-readiness">ADAPTADOR SEGURO</span></div>; }
function Toolbar({ section, term, setTerm, filterCount, onFilters, onExport, exportBusy, onRefresh, busy }: { section: Section; term: string; setTerm: (value: string) => void; filterCount: number; onFilters: () => void; onExport?: () => void; exportBusy: boolean; onRefresh: () => void; busy: boolean }) { return <div className="catalog-toolbar channels-toolbar">{section !== "operations" && <label><span className="material-symbols-rounded">search</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={section === "connections" ? "Pesquisar parceiro, loja, filial ou ID" : "Pesquisar produto, código, EAN ou ID externo"} /></label>}<button onClick={onFilters}><span className="material-symbols-rounded">tune</span>Pesquisa avançada{filterCount > 0 && <b>{filterCount}</b>}</button>{onExport && <button onClick={onExport} disabled={exportBusy}>{exportBusy ? "Exportando..." : "Exportar CSV"}</button>}<button onClick={onRefresh} disabled={busy}><span className="material-symbols-rounded">refresh</span>Atualizar</button></div>; }

function Connections({ data, permission, sort, acting, onSort, onEdit, onDiagnostics, onAuthorize, onSync, onRemove }: { data: Paged<Connection>; permission?: { canUpdate?: boolean; canDelete?: boolean; canManage?: boolean }; sort: TableSort | null; acting: string | null; onSort: (key: string) => void; onEdit: (item: Connection) => void; onDiagnostics: (item: Connection) => void; onAuthorize: (id: string) => Promise<void>; onSync: (id: string) => Promise<void>; onRemove: (item: Connection) => void }) {
  return <DataPanel><table><thead><tr><SortableTableHeader label="Canal" sortKey="provider" sort={sort} onChange={onSort} /><SortableTableHeader label="Loja" sortKey="displayName" sort={sort} onChange={onSort} /><SortableTableHeader label="Filial" sortKey="branchName" sort={sort} onChange={onSort} /><th>ID externo</th><SortableTableHeader label="Saúde" sortKey="status" sort={sort} onChange={onSort} /><th>Catálogo</th><SortableTableHeader label="Última sincronização" sortKey="lastSyncedAt" sort={sort} onChange={onSort} /><th>Ações</th></tr></thead><tbody>{data.rows.map((item) => { const health = salesChannelHealth(item); const ready = isSalesChannelOperational(item); const authorizing = ["PENDING", "PENDING_APPROVAL"].includes(item.authorizationStatus); return <tr key={item.id}><td><Provider provider={item.provider} /></td><td><strong>{item.displayName}</strong><small>{item.integrationMode} · {item.catalogProfile === "GROCERY" ? "Mercado" : item.catalogProfile === "RESTAURANT" ? "Restaurante" : "Catálogo a configurar"}</small></td><td>{item.branchName}</td><td><code>{item.externalStoreId || "—"}</code></td><td><Status variant={health.key} label={health.label} title={item.lastError ?? undefined} /></td><td><strong>{item.mappingCount}</strong><small>{item.pendingOrders} pedido(s) pendente(s)</small></td><td>{dateTime(item.lastSyncedAt)}</td><td><div className="catalog-actions"><button className="catalog-action catalog-action--info" onClick={() => onDiagnostics(item)}><span className="material-symbols-rounded">monitor_heart</span>Diagnóstico</button>{permission?.canManage && item.provider === "IFOOD" && !ready && <button className="catalog-action catalog-action--success" disabled={authorizing || acting === item.id || !item.enabled} title="Validar credenciais do aplicativo e vínculo da loja no servidor" onClick={() => void onAuthorize(item.id)}><span className="material-symbols-rounded">verified_user</span>{authorizing ? "Validando..." : "Autorizar"}</button>}{permission?.canManage && ready && <button className="catalog-action catalog-action--success" disabled={acting === item.id} title="Atualizar preços e disponibilidade dos produtos vinculados" onClick={() => void onSync(item.id)}><span className="material-symbols-rounded">sync</span>Sincronizar</button>}{permission?.canUpdate && <button className="catalog-action catalog-action--edit" onClick={() => onEdit(item)}><span className="material-symbols-rounded">edit</span>Configurar</button>}{permission?.canDelete && <button className="catalog-action catalog-action--danger" onClick={() => onRemove(item)}><span className="material-symbols-rounded">link_off</span>Remover</button>}</div></td></tr>; })}</tbody></table>{!data.rows.length && <Empty icon="hub" title="Nenhuma conexão encontrada" text="Prepare uma loja ou altere os filtros para visualizar conexões." />}</DataPanel>;
}
function Mappings({ data, permission, sort, acting, onSort, onEdit, onSync, onRemove }: { data: Paged<Mapping>; permission?: { canManage?: boolean }; sort: TableSort | null; acting: string | null; onSort: (key: string) => void; onEdit: (item: Mapping) => void; onSync: (id: string) => Promise<void>; onRemove: (item: Mapping) => void }) {
  return <DataPanel><table><thead><tr><SortableTableHeader label="Produto" sortKey="productName" sort={sort} onChange={onSort} /><SortableTableHeader label="Canal" sortKey="provider" sort={sort} onChange={onSort} /><SortableTableHeader label="Identificador iFood" sortKey="externalProductId" sort={sort} onChange={onSort} /><th>Nome externo</th><th>Preço</th><th>Estoque</th><SortableTableHeader label="Sincronização" sortKey="syncStatus" sort={sort} onChange={onSort} /><SortableTableHeader label="Último envio" sortKey="lastSyncedAt" sort={sort} onChange={onSort} /><th>Ações</th></tr></thead><tbody>{data.rows.map((item) => <tr key={item.id}><td><strong>{item.productName}</strong><small>{item.internalCode || item.ean || "Sem código"}</small></td><td><Provider provider={item.provider} /><small>{item.connectionName} · {item.branchName}</small></td><td><code>{item.externalProductId}</code><small>{item.catalogProfile === "GROCERY" ? "EAN / código de balança" : "Item do catálogo"}</small></td><td>{item.externalProductName || "—"}</td><td><Status variant={item.syncPrice ? "active" : "paused"} label={item.syncPrice ? "Automático" : "Manual"} /></td><td><Status variant={item.syncStock ? "active" : "paused"} label={item.syncStock ? "Automático" : "Manual"} /></td><td><Status variant={item.syncStatus === "ERROR" ? "error" : item.syncStatus === "COMPLETED" ? "active" : "pending"} label={item.syncStatus === "COMPLETED" ? (item.catalogProfile === "GROCERY" ? "Aceito pelo iFood" : "Sincronizado") : item.syncStatus === "ERROR" ? "Erro" : "Pendente"} title={item.lastError ?? undefined} /></td><td>{dateTime(item.lastSyncedAt)}</td><td><div className="catalog-actions">{permission?.canManage && <><button className="catalog-action catalog-action--success" disabled={acting === item.connectionId} onClick={() => void onSync(item.connectionId)}><span className="material-symbols-rounded">sync</span>{item.catalogProfile === "GROCERY" ? "Publicar" : "Enviar"}</button><button className="catalog-action catalog-action--edit" onClick={() => onEdit(item)}><span className="material-symbols-rounded">edit</span>Configurar</button><button className="catalog-action catalog-action--danger" onClick={() => onRemove(item)}><span className="material-symbols-rounded">delete</span>Remover</button></>}</div></td></tr>)}</tbody></table>{!data.rows.length && <Empty icon="inventory_2" title="Nenhum produto vinculado" text="Cadastre o produto no Insight Pad. Em lojas Mercado, o primeiro envio cria o produto pela Item API; em Restaurante, informe o ID de um item existente." />}</DataPanel>;
}
function OperationPanels({ data, permission, acting, onRetry }: { data: Operations; permission?: { canUpdate?: boolean }; acting: string | null; onRetry: (id: string) => Promise<void> }) {
  return <div className="channels-operation-grid"><OperationCard title="Comandos enviados" icon="outbox"><table><thead><tr><th>Canal</th><th>Ação</th><th>Status</th><th>Tentativas</th><th>Data</th><th>Ação</th></tr></thead><tbody>{data.commands.map((item) => <tr key={item.id}><td>{salesChannelProviderLabel(item.provider)} · {item.connectionName}</td><td>{item.action}</td><td><Status variant={item.status === "ERROR" ? "error" : item.status === "CONFIRMED" ? "active" : "pending"} label={item.status === "AWAITING_PARTNER" ? "Aguardando iFood" : item.status} title={item.lastError ?? undefined} /></td><td>{item.attempts}</td><td>{dateTime(item.createdAt)}</td><td>{permission?.canUpdate && item.status === "ERROR" && <button className="catalog-action catalog-action--edit" disabled={acting === item.id} onClick={() => void onRetry(item.id)}>Tentar novamente</button>}</td></tr>)}</tbody></table>{!data.commands.length && <Empty icon="outbox" title="Nenhum comando recente" text="Aceites, recusas e conclusões aparecerão aqui." />}</OperationCard><OperationCard title="Sincronizações" icon="sync"><table><thead><tr><th>Canal</th><th>Escopo</th><th>Status</th><th>Progresso</th><th>Data</th></tr></thead><tbody>{data.jobs.map((item) => <tr key={item.id}><td>{salesChannelProviderLabel(item.provider)} · {item.connectionName}</td><td>{item.jobType}</td><td><Status variant={item.status === "ERROR" ? "error" : item.status === "COMPLETED" ? "active" : "pending"} label={item.status === "AWAITING_PARTNER" ? "Aguardando iFood" : item.status} title={item.lastError ?? undefined} /></td><td>{item.processedItems}/{item.totalItems} · {item.failedItems} falha(s)</td><td>{dateTime(item.createdAt)}</td></tr>)}</tbody></table>{!data.jobs.length && <Empty icon="sync" title="Nenhuma sincronização recente" text="Catálogo, preço e estoque aparecerão aqui." />}</OperationCard><OperationCard title="Eventos recebidos" icon="webhook"><table><thead><tr><th>Canal</th><th>Evento</th><th>Status</th><th>Tentativas</th><th>Recebido</th></tr></thead><tbody>{data.events.map((item) => <tr key={item.id}><td>{salesChannelProviderLabel(item.provider)} · {item.connectionName}</td><td><strong>{item.eventType}</strong><small>{item.providerEventId}</small></td><td><Status variant={item.status === "ERROR" ? "error" : item.status === "PROCESSED" || item.status === "ACKNOWLEDGED" ? "active" : "pending"} label={item.status === "AWAITING_PARTNER" ? "Aguardando iFood" : item.status} title={item.lastError ?? undefined} /></td><td>{item.attempts}</td><td>{dateTime(item.receivedAt)}</td></tr>)}</tbody></table>{!data.events.length && <Empty icon="webhook" title="Nenhum evento recente" text="Webhooks e eventos consultados aparecerão aqui." />}</OperationCard></div>;
}
function Kpis({ items }: { items: [string, string, number | undefined, string, string][] }) { return <div className="channels-kpis">{items.map(([icon, label, value, detail, variant]) => <article className={`channel-kpi channel-kpi--${variant}`} key={label}><span className="material-symbols-rounded">{icon}</span><div><small>{label}</small><strong>{Number(value ?? 0)}</strong><p>{detail}</p></div></article>)}</div>; }
function DataPanel({ children }: { children: ReactNode }) { return <div className="catalog-panel channels-data-panel"><div className="catalog-scroll"><div className="catalog-table channels-table">{children}</div></div></div>; }
function OperationCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) { return <section className="channel-operation-card"><header><span className="material-symbols-rounded">{icon}</span><h2>{title}</h2></header><div className="channel-operation-card__scroll">{children}</div></section>; }
function Provider({ provider }: { provider: SalesChannelProvider }) { return <span className={`channel-provider channel-provider--${provider.toLowerCase()}`}>{salesChannelProviderLabel(provider)}</span>; }
function Status({ variant, label, title }: { variant: string; label: string; title?: string }) { return <span className={`channel-status channel-status--${variant}`} title={title}><i />{label}</span>; }
function Empty({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="channels-empty"><span className="material-symbols-rounded">{icon}</span><strong>{title}</strong><p>{text}</p></div>; }
function Loading() { return <div className="catalog-loader"><div className="catalog-loader__mark"><span /><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" /></div><strong>Atualizando canais de venda...</strong></div>; }

function FilterModal({ section, options, value, setValue, onClose, onApply }: { section: Section; options: Options; value: Filters; setValue: (value: Filters) => void; onClose: () => void; onApply: (event: FormEvent) => void }) {
  useDialogAccessibility(true, onClose);
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal advanced-search-modal channel-filter-modal" role="dialog" aria-modal="true" aria-label="Pesquisa avançada"><header><div><span className="eyebrow">Pesquisa</span><h2>Filtros avançados</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={onApply}><div className="master-form-grid">{section !== "operations" && <label><span>Parceiro</span><select value={value.provider} onChange={(event) => setValue({ ...value, provider: event.target.value })}><option value="">Todos os parceiros</option>{Object.entries(SALES_CHANNEL_PROVIDERS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>}{section === "connections" && <label><span>Filial</span><select value={value.branchId} onChange={(event) => setValue({ ...value, branchId: event.target.value })}><option value="">Todas as filiais</option>{options.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}{section !== "connections" && <label><span>Conexão</span><select value={value.connectionId} onChange={(event) => setValue({ ...value, connectionId: event.target.value })}><option value="">Todas as conexões</option>{options.connections.map((item) => <option key={item.id} value={item.id}>{salesChannelProviderLabel(item.provider)} · {item.displayName}</option>)}</select></label>}{section !== "operations" && <label><span>Status</span><select value={value.status} onChange={(event) => setValue({ ...value, status: event.target.value })}><option value="">Todos os status</option>{section === "connections" ? <><option value="AUTHORIZED">Autorizada</option><option value="NOT_CONNECTED">Não conectada</option><option value="PENDING_APPROVAL">Aguardando aprovação</option><option value="ERROR">Com erro</option><option value="SUSPENDED">Suspensa</option></> : <><option value="ENABLED">Ativo</option><option value="PAUSED">Pausado</option><option value="PENDING">Pendente</option><option value="COMPLETED">Sincronizado</option><option value="ERROR">Com erro</option></>}</select></label>}</div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose}>Cancelar</button><button className="catalog-primary catalog-modal-submit">Aplicar filtros</button></footer></form></section></div>;
}

function ConnectionModal({ editing, branches, form, setForm, busy, onClose, onSubmit }: { editing: Connection | null; branches: Branch[]; form: ConnectionForm; setForm: (value: ConnectionForm) => void; busy: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  useDialogAccessibility(true, onClose); const partner = SALES_CHANNEL_PROVIDERS[form.provider];
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-modal" role="dialog" aria-modal="true" aria-label={editing ? "Configurar canal" : "Preparar canal"}><header><div><span className="eyebrow">Integrações</span><h2>{editing ? "Configurar canal" : "Preparar canal"}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={onSubmit}><div className="channel-modal-body"><div className="channel-modal__notice"><span className="material-symbols-rounded">security</span><p><strong>Credenciais protegidas.</strong> Senhas, tokens e chaves são tratados pelo serviço seguro. Nunca os informe nesta tela.</p></div><div className="master-form-grid"><label><span>Parceiro</span><select value={form.provider} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, provider: event.target.value as SalesChannelProvider })}>{Object.entries(SALES_CHANNEL_PROVIDERS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><label><span>Filial</span><select value={form.branchId} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, branchId: event.target.value })} required><option value="">Selecione</option>{branches.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label><span>Nome da loja</span><input autoFocus value={form.displayName} maxLength={160} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Ex.: Loja Centro" required /></label><label><span>Tipo de catálogo iFood</span><select value={form.catalogProfile} disabled={form.provider !== "IFOOD"} onChange={(event) => setForm({ ...form, catalogProfile: event.target.value as CatalogProfile })}><option value="UNVERIFIED">Selecione o tipo da loja</option><option value="RESTAURANT">Restaurante</option><option value="GROCERY">Mercado / outras lojas</option></select></label><label><span>ID oficial da loja <small>(opcional)</small></span><input value={form.externalStoreId} maxLength={160} onChange={(event) => setForm({ ...form, externalStoreId: event.target.value })} /></label>{editing && <label className="channel-toggle"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>Permitir sincronizações quando a autorização estiver ativa?</span></label>}</div><section className="channel-capabilities"><header><span className="material-symbols-rounded">dataset_linked</span><div><strong>{partner.label}</strong><small>{partner.mode}</small></div></header><div>{partner.capabilities.map((item) => <span key={item}><i className="material-symbols-rounded">check_circle</i>{item}</span>)}</div></section></div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className={`catalog-primary catalog-modal-submit ${editing ? "catalog-modal-submit--edit" : "catalog-modal-submit--create"}`} disabled={busy}>{busy ? "Salvando..." : editing ? "Salvar configuração" : "Preparar canal"}</button></footer></form></section></div>;
}

function MappingModal({ editing, connections, form, setForm, busy, onClose, onSubmit }: { editing: Mapping | null; connections: ConnectionOption[]; form: MappingForm; setForm: (value: MappingForm) => void; busy: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const [term, setTerm] = useState(editing?.productName ?? ""); const [products, setProducts] = useState<ProductOption[]>(editing ? [{ id: editing.productId, name: editing.productName }] : []); const [loading, setLoading] = useState(false); const [pickerOpen, setPickerOpen] = useState(!editing);
  useDialogAccessibility(true, onClose);
  useEffect(() => { let cancelled = false; const timer = window.setTimeout(async () => { setLoading(true); try { const result = await executeQuery(queryRef(dc, "SalesChannelProductOptions", { term: term.trim(), limit: 30, requestKey: crypto.randomUUID() })); if (!cancelled) setProducts((result.data as { _select?: ProductOption[] })._select ?? []); } catch (error) { console.error(error); } finally { if (!cancelled) setLoading(false); } }, term ? 250 : 0); return () => { cancelled = true; window.clearTimeout(timer); }; }, [term]);
  const connection = connections.find((item) => item.id === form.connectionId);
  const grocery = connection?.catalogProfile === "GROCERY";
  const selectedProduct = products.find((item) => item.id === form.productId);
  const groceryIdentifier = form.externalProductId || selectedProduct?.ean || selectedProduct?.scaleCode || "";
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-modal" role="dialog" aria-modal="true" aria-label="Vincular produto"><header><div><span className="eyebrow">Catálogo integrado</span><h2>{editing ? "Configurar vínculo" : grocery ? "Publicar produto Mercado" : "Vincular produto"}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={onSubmit}><div className="channel-modal-body">{grocery && <div className="channel-modal__notice"><span className="material-symbols-rounded">inventory_2</span><p><strong>Publicação pela Item API.</strong> O iFood identifica produtos Mercado pelo EAN ou código de balança. O primeiro envio criará o item sem redefinir o restante do catálogo.</p></div>}<div className="master-form-grid"><label><span>Conexão</span><select value={form.connectionId} disabled={Boolean(editing)} onChange={(event) => { const next = connections.find((item) => item.id === event.target.value); setForm({ ...form, connectionId: event.target.value, externalProductId: next?.catalogProfile === "GROCERY" ? (selectedProduct?.ean || selectedProduct?.scaleCode || "") : "", syncPrice: next?.catalogProfile === "GROCERY", syncStock: next?.catalogProfile === "GROCERY" }); }} required><option value="">Selecione</option>{connections.map((item) => <option key={item.id} value={item.id}>{salesChannelProviderLabel(item.provider)} · {item.displayName} · {item.branchName}</option>)}</select></label><label className="channel-product-picker"><span>Produto Insight Pad</span><input value={term} disabled={Boolean(editing)} onFocus={() => setPickerOpen(true)} onChange={(event) => { setTerm(event.target.value); setPickerOpen(true); setForm({ ...form, productId: "", externalProductId: grocery ? "" : form.externalProductId }); }} placeholder="Nome, código, EAN ou código de balança" autoComplete="off" role="combobox" aria-expanded={pickerOpen} aria-controls="channel-product-results" />{!editing && pickerOpen && <div id="channel-product-results" className="channel-product-results" role="listbox">{loading ? <small>Pesquisando...</small> : products.map((item) => <button type="button" role="option" aria-selected={form.productId === item.id} key={item.id} onClick={() => { setForm({ ...form, productId: item.id, externalProductId: grocery ? (item.ean || item.scaleCode || "") : form.externalProductId }); setTerm(item.name); setPickerOpen(false); }}><strong>{item.name}</strong><small>{item.ean || item.scaleCode || item.internalCode || "Sem código"}</small></button>)}</div>}</label><label><span>{grocery ? "EAN / código de balança" : "ID no parceiro"}</span><input value={grocery ? groceryIdentifier : form.externalProductId} maxLength={160} disabled={grocery} onChange={(event) => setForm({ ...form, externalProductId: event.target.value })} required={!grocery} placeholder={grocery ? "Definido no cadastro do produto" : "UUID do item no catálogo iFood"} /></label><label><span>Nome no parceiro <small>(opcional)</small></span><input value={form.externalProductName} maxLength={240} onChange={(event) => setForm({ ...form, externalProductName: event.target.value })} /></label><label className="channel-toggle"><input type="checkbox" checked={form.syncPrice} onChange={(event) => setForm({ ...form, syncPrice: event.target.checked })} /><span>Sincronizar preço automaticamente?</span></label><label className="channel-toggle"><input type="checkbox" checked={form.syncStock} onChange={(event) => setForm({ ...form, syncStock: event.target.checked })} /><span>{grocery ? "Sincronizar a quantidade disponível?" : "Atualizar disponibilidade conforme o estoque?"}</span></label>{editing && <label className="channel-toggle"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>Manter este vínculo ativo?</span></label>}</div></div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className={`catalog-primary catalog-modal-submit ${editing ? "catalog-modal-submit--edit" : "catalog-modal-submit--create"}`} disabled={busy || !form.productId || (grocery && !groceryIdentifier)}>{busy ? "Salvando..." : editing ? "Salvar vínculo" : grocery ? "Preparar publicação" : "Vincular produto"}</button></footer></form></section></div>;
}

function RemoveDialog({ connection, grocery, busy, onClose, onConfirm }: { connection: boolean; grocery: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) { useDialogAccessibility(true, onClose); return <div className="catalog-backdrop"><section className="catalog-confirm" role="alertdialog" aria-modal="true" aria-label="Confirmar remoção"><span className="material-symbols-rounded">{connection ? "link_off" : "delete"}</span><h2>{connection ? "Remover conexão?" : "Remover vínculo?"}</h2><p>{connection ? "Vínculos e filas pendentes também serão desativados. O histórico continuará preservado para auditoria." : grocery ? "O vínculo será encerrado e a desativação do produto será enfileirada na loja iFood Mercado. O histórico será preservado." : "O produto deixará as próximas sincronizações, com histórico preservado."}</p><footer><button className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className="catalog-action catalog-action--danger catalog-modal-submit" onClick={onConfirm} disabled={busy}>{busy ? "Removendo..." : "Confirmar remoção"}</button></footer></section></div>; }
function Diagnostics({ connection, onClose }: { connection: Connection; onClose: () => void }) { useDialogAccessibility(true, onClose); const health = salesChannelHealth(connection); return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-diagnostics-modal" role="dialog" aria-modal="true" aria-label="Diagnóstico"><header><div><span className="eyebrow">Saúde da integração</span><h2>{connection.displayName}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><div className="channel-diagnostics-body"><div className="channel-diagnostics-hero"><Provider provider={connection.provider} /><Status variant={health.key} label={health.label} /></div><dl><div><dt>Autorização</dt><dd>{connection.authorizationStatus}</dd></div><div><dt>Modo</dt><dd>{connection.integrationMode}</dd></div><div><dt>Catálogo</dt><dd>{connection.catalogProfile === "GROCERY" ? "Mercado: criação, preço e estoque pela Item API" : connection.catalogProfile === "RESTAURANT" ? "Atualização de preço e disponibilidade" : "Tipo de loja ainda não confirmado"}</dd></div><div><dt>Pedidos</dt><dd>{connection.catalogProfile === "GROCERY" ? "Separação e alterações de itens habilitadas" : "Preparação e despacho habilitados"}</dd></div><div><dt>Webhook</dt><dd>{connection.webhookStatus}</dd></div><div><dt>Falhas consecutivas</dt><dd>{connection.consecutiveFailures}</dd></div><div><dt>Última verificação</dt><dd>{dateTime(connection.lastHealthCheckAt)}</dd></div><div><dt>Último sucesso</dt><dd>{dateTime(connection.lastSuccessAt)}</dd></div><div><dt>Expiração</dt><dd>{dateTime(connection.tokenExpiresAt)}</dd></div><div><dt>ID da requisição</dt><dd><code>{connection.lastRequestId || "—"}</code></dd></div></dl>{connection.lastError && <div className="channel-diagnostics-error"><span className="material-symbols-rounded">error</span><div><strong>Última falha</strong><p>{connection.lastError}</p></div></div>}<div className="channel-diagnostics-security"><span className="material-symbols-rounded">lock</span><p>Somente metadados operacionais são exibidos. Tokens, segredos e payloads brutos não chegam ao navegador.</p></div></div><footer><button className="catalog-modal-cancel" onClick={onClose}>Fechar</button></footer></section></div>; }
