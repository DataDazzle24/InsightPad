import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from "firebase/data-connect";
import { getFunctions, httpsCallable } from "firebase/functions";
import { connectorConfig } from "@insightpad/dataconnect";
import { SortableTableHeader } from "../components/SortableTableHeader";
import { useAuth } from "../auth/useAuth";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { firebaseApp } from "../lib/firebase";
import { nextTableSort, type TableSort } from "../utils/tableSorting";
import { resolveGroceryIdentifier } from "../utils/productIdentifiers";
import { maskMoneyInput, moneyInputFromCents, parseMoneyToCents } from "../utils/platformBilling";
import {
  SALES_CHANNEL_PROVIDERS,
  buildSalesChannelCsv,
  countActiveFilters,
  downloadSalesChannelCsv,
  isSalesChannelOperational,
  salesChannelHealth,
  salesChannelActionLabel,
  salesChannelJobLabel,
  salesChannelProviderLabel,
  salesChannelStatusLabel,
  storeHoursHaveOverlap,
  type SalesChannelProvider,
} from "../utils/salesChannels";

const dc = getDataConnect(firebaseApp, connectorConfig);
const functions = getFunctions(firebaseApp, "southamerica-east1");
const fetchAvailableMerchants = httpsCallable<{ connectionId: string }, { merchants: MerchantOption[] }>(functions, "ifoodAvailableMerchants");
const runMerchantOperation = httpsCallable<{ connectionId: string; action: string; payload?: unknown }, { data: unknown }>(functions, "ifoodMerchantOperations");
const PAGE_SIZE = 50;
type Section = "connections" | "products" | "operations";
type Notice = { type: "success" | "error"; text: string };
type Branch = { id: string; name: string };
type MerchantOption = { id: string; name: string; type: string; catalogProfile: CatalogProfile };
type CatalogProfile = "UNVERIFIED" | "RESTAURANT" | "GROCERY";
type ConnectionOption = { catalogProfile: CatalogProfile; id: string; provider: SalesChannelProvider; displayName: string; branchId: string; branchName: string; status: string; authorizationStatus: string; enabled: boolean };
type Options = { branches: Branch[]; connections: ConnectionOption[] };
type Connection = ConnectionOption & {
  externalStoreId?: string | null; integrationMode: string; webhookStatus: string; tokenExpiresAt?: string | null;
  lastHealthCheckAt?: string | null; lastSuccessAt?: string | null; lastSyncedAt?: string | null; lastRequestId?: string | null;
  lastPollingAt?: string | null; lastFinancialSyncAt?: string | null; merchantSnapshot?: Record<string, unknown> | null; capabilities?: Record<string, unknown> | null;
  lastError?: string | null; consecutiveFailures: number; mappingCount: number; pendingOrders: number; createdAt: string; updatedAt: string;
};
type Mapping = {
  id: string; connectionId: string; connectionName: string; provider: SalesChannelProvider; catalogProfile: CatalogProfile; branchName: string; productId: string;
  productName: string; internalCode?: string | null; ean?: string | null; externalProductId: string; externalProductName?: string | null;
  syncPrice: boolean; syncStock: boolean; enabled: boolean; status: string; syncStatus: string; lastSyncedAt?: string | null;
  publicationStatus: string; needsFullPublication: boolean; nextPromotionChangeAt?: string | null;
  partnerOperationId?: string | null; partnerAcceptedAt?: string | null; partnerConfirmedAt?: string | null; partnerConfirmationDueAt?: string | null;
  salePriceCents?: string | number; bundleProduct?: boolean; priceMode: "PRODUCT" | "CUSTOM"; customPriceCents?: string | number | null; effectivePriceCents?: string | number | null; remoteProductState: "NEW" | "EXISTING" | "REACTIVATE";
  lastError?: string | null; version: number; updatedAt: string;
};
type ProductOption = { id: string; name: string; internalCode?: string | null; ean?: string | null; scaleCode?: string | null; salePriceCents?: string | number; weightedProduct?: boolean; bundleProduct?: boolean; componentCount?: number; components?: Array<{ id: string; name: string; quantity: number }>; active?: boolean; physicalStock?: string | number; reservedStock?: string | number; availableStock?: string | number };
type Operation = { id: string; connectionId: string; connectionName: string; provider: SalesChannelProvider; status: string; attempts: number; lastError?: string | null };
type EventOperation = Operation & { providerEventId: string; eventType: string; source: string; receivedAt: string };
type CommandOperation = Operation & { action: string; outcomeUnknown: boolean; reconciliationDueAt?: string | null; createdAt: string };
type SyncOperation = Operation & { jobType: string; totalItems: number; processedItems: number; failedItems: number; createdAt: string };
type Operations = { events: EventOperation[]; commands: CommandOperation[]; jobs: SyncOperation[]; summary: { eventFailures: number; queuedCommands: number; syncFailures: number } };
type Paged<T> = { rows: T[]; total: number; summary: Record<string, number> };
type Filters = { provider: string; status: string; branchId: string; connectionId: string };
type ConnectionForm = { provider: SalesChannelProvider; branchId: string; displayName: string; externalStoreId: string; enabled: boolean };
type MappingForm = { connectionId: string; productId: string; externalProductId: string; externalProductName: string; syncPrice: boolean; syncStock: boolean; enabled: boolean; priceMode: "PRODUCT" | "CUSTOM"; customPrice: string; remoteProductState: "NEW" | "EXISTING" | "REACTIVATE" };
type MappingIntent = MappingForm["remoteProductState"];
type StoreOperationAction = "SAVE_HOURS" | "CREATE_INTERRUPTION" | "DELETE_INTERRUPTION";

const emptyOptions: Options = { branches: [], connections: [] };
const emptyOperations: Operations = { events: [], commands: [], jobs: [], summary: { eventFailures: 0, queuedCommands: 0, syncFailures: 0 } };
const emptyFilters = (): Filters => ({ provider: "", status: "", branchId: "", connectionId: "" });
const blankConnection = (branchId = ""): ConnectionForm => ({ provider: "IFOOD", branchId, displayName: "", externalStoreId: "", enabled: true });
const blankMapping = (connectionId = ""): MappingForm => ({ connectionId, productId: "", externalProductId: "", externalProductName: "", syncPrice: false, syncStock: false, enabled: true, priceMode: "PRODUCT", customPrice: "", remoteProductState: "NEW" });
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const money = (value?: string | number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0) / 100);
const stockNumber = (value?: string | number | null) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(value ?? 0));
const mutationApplied = (result: unknown) => Boolean((result as { data?: { _execute?: unknown } })?.data?._execute);
function box<T>(result: unknown): T | undefined { return (((result as { data?: { _select?: { data?: T }[] } }).data?._select ?? [])[0]?.data); }
function nestedRecord(value: unknown, key: string): Record<string, unknown> { const next = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined; return next && typeof next === "object" ? next as Record<string, unknown> : {}; }
function capabilityLabel(value: unknown) {
  if (value === true) return "Verificado";
  if (value === false) return "Não aplicável";
  if (value && typeof value === "object") {
    const state = String((value as Record<string, unknown>).state ?? "").toUpperCase();
    if (state === "VERIFIED") return "Verificado em operação real";
    if (state === "NOT_APPLICABLE") return "Não aplicável";
    if (state === "BLOCKED" || state === "DENIED") return "Não liberado pelo iFood";
    if (state === "PENDING") return "Será validado no primeiro uso";
  }
  if (typeof value === "string" && value.startsWith("REQUIRES_")) return "Aguardando validação no iFood";
  return "Ainda não verificado";
}
function publicationLabel(item: Mapping) {
  if (item.publicationStatus === "DRAFT" || item.needsFullPublication) return "Rascunho — enviar";
  if (item.publicationStatus === "RECEIVED") return "Recebido pelo iFood";
  if (["CONFIRMED", "ACCEPTED"].includes(item.publicationStatus)) return "Confirmado pelo iFood";
  if (item.publicationStatus === "ERROR" || item.syncStatus === "ERROR") return "Erro";
  if (item.publicationStatus === "ARCHIVED") return "Arquivado";
  return item.syncStatus === "COMPLETED" ? "Enviado" : "Pendente";
}
const unsafeRetryCodes = ["ADD_ITEM", "REPLACE_ITEM", "UPDATE_ITEM", "REMOVE_ITEM"];
const unsafeRetryActions = new Set([...unsafeRetryCodes, ...unsafeRetryCodes.map(salesChannelActionLabel)]);
const storeOperationSuccess: Record<StoreOperationAction, string> = {
  SAVE_HOURS: "Horários salvos e confirmados pelo iFood.",
  CREATE_INTERRUPTION: "Pausa programada e confirmada pelo iFood.",
  DELETE_INTERRUPTION: "Pausa encerrada e confirmada pelo iFood.",
};

export function SalesChannelsPage() {
  const { permissions, profile } = useAuth();
  const permission = permissions.CANAIS_VENDA;
  const platformSupport = profile?.role.systemRole === true && profile.role.name === "Administrador da Plataforma";
  const [params, setParams] = useSearchParams();
  const requested = params.get("section");
  const section: Section = requested === "products" || (requested === "operations" && platformSupport) ? requested : "connections";
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [connections, setConnections] = useState<Paged<Connection>>({ rows: [], total: 0, summary: {} });
  const [mappings, setMappings] = useState<Paged<Mapping>>({ rows: [], total: 0, summary: {} });
  const [operations, setOperations] = useState<Operations>(emptyOperations);
  const [operationLimit, setOperationLimit] = useState(50);
  const [operationView, setOperationView] = useState<"events" | "commands" | "jobs" | "">("");
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
  const [authorization, setAuthorization] = useState<Connection | null>(null);
  const [storeOperations, setStoreOperations] = useState<Connection | null>(null);
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
        const result = await executeQuery(queryRef(dc, "SalesChannelOperations", { connectionId: filters.connectionId || null, limit: operationLimit, requestKey: crypto.randomUUID() }));
        if (request === sequence.current) setOperations(box<Operations>(result) ?? emptyOperations);
      }
    } catch (error) {
      console.error(error);
      if (request === sequence.current) setNotice({ type: "error", text: "Não foi possível carregar a gestão de canais." });
    } finally { if (request === sequence.current) setBusy(false); }
  }, [filters, operationLimit, page, section, sort, term]);

  useEffect(() => { const timer = window.setTimeout(() => void loadOptions().catch((error) => { console.error(error); setNotice({ type: "error", text: "Não foi possível carregar filiais e conexões." }); }), 0); return () => window.clearTimeout(timer); }, [loadOptions]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), term ? 350 : 0); return () => { window.clearTimeout(timer); sequence.current += 1; }; }, [load, term]);
  useEffect(() => { if (requested === "operations" && !platformSupport) setParams({}, { replace: true }); }, [platformSupport, requested, setParams]);
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
  function changeSection(next: Section) { setParams(next === "connections" ? {} : { section: next }); setTerm(""); setFilters(emptyFilters()); setDraftFilters(emptyFilters()); setSort(null); setPage(0); setOperationLimit(50); setOperationView(""); }
  function changeSort(key: string) { setSort((current) => nextTableSort(current, key)); setPage(0); }
  function clearTools() { setTerm(""); setFilters(emptyFilters()); setDraftFilters(emptyFilters()); setSort(null); setPage(0); setOperationLimit(50); }
  function openConnection(item?: Connection) { setConnectionModal(item ?? "new"); setConnectionForm(item ? { provider: item.provider, branchId: item.branchId, displayName: item.displayName, externalStoreId: item.externalStoreId ?? "", enabled: item.enabled } : blankConnection(options.branches[0]?.id)); }
  function openMapping(item?: Mapping, intent: MappingIntent = "NEW") {
    const initial = item
      ? options.connections.find((connection) => connection.id === item.connectionId)
      : intent === "EXISTING"
        ? options.connections[0]
        : options.connections.find((connection) => connection.catalogProfile === "GROCERY");
    setMappingModal(item ?? "new");
    setMappingForm(item ? { connectionId: item.connectionId, productId: item.productId, externalProductId: item.externalProductId, externalProductName: item.externalProductName ?? "", syncPrice: item.syncPrice, syncStock: item.syncStock, enabled: item.enabled, priceMode: item.priceMode ?? "PRODUCT", customPrice: item.customPriceCents ? moneyInputFromCents(item.customPriceCents) : "", remoteProductState: item.remoteProductState ?? (item.needsFullPublication ? "NEW" : "EXISTING") } : { ...blankMapping(initial?.id), syncPrice: initial?.catalogProfile === "GROCERY", syncStock: initial?.catalogProfile === "GROCERY", remoteProductState: intent });
  }
  async function refresh(message?: string) { await Promise.all([load(), loadOptions()]); if (message) setNotice({ type: "success", text: message }); }
  async function saveConnection(event: FormEvent) {
    event.preventDefault();
    if (acting) return;
    if (!connectionForm.branchId || connectionForm.displayName.trim().length < 2) return setNotice({ type: "error", text: "Informe a filial e um nome com pelo menos 2 caracteres." });
    setActing("connection");
    try {
      const editing = connectionModal !== "new" ? connectionModal : null;
      const result = editing
        ? await executeMutation(mutationRef(dc, "UpdateSalesChannelConnection", { id: editing.id, displayName: connectionForm.displayName.trim(), externalStoreId: connectionForm.externalStoreId.trim(), enabled: connectionForm.enabled }))
        : await executeMutation(mutationRef(dc, "CreateSalesChannelConnection", { provider: "IFOOD", branchId: connectionForm.branchId, displayName: connectionForm.displayName.trim(), externalStoreId: "" }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      setConnectionModal(null); await refresh(editing ? "Configuração atualizada." : "Ambiente preparado. O credenciamento oficial é a próxima etapa.");
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível salvar. Verifique sua permissão, duplicidade e operações em andamento. Uma loja com pedidos ou produtos vinculados precisa de uma nova conexão para trocar o ID." }); } finally { setActing(null); }
  }
  async function saveMapping(event: FormEvent) {
    event.preventDefault();
    if (acting) return;
    const profile = options.connections.find((item) => item.id === mappingForm.connectionId)?.catalogProfile;
    if (!mappingForm.connectionId || !mappingForm.productId || (profile !== "GROCERY" && !mappingForm.externalProductId.trim())) return setNotice({ type: "error", text: profile === "GROCERY" ? "Selecione uma conexão e um produto com EAN ou código de balança." : "Selecione conexão e produto e informe o ID externo." });
    const customPriceCents = mappingForm.priceMode === "CUSTOM" ? parseMoneyToCents(mappingForm.customPrice) : null;
    if (mappingForm.priceMode === "CUSTOM" && (customPriceCents === null || !Number.isSafeInteger(customPriceCents) || customPriceCents <= 0)) return setNotice({ type: "error", text: "Informe um preço exclusivo do iFood maior que zero." });
    setActing("mapping");
    try {
      const editing = mappingModal !== "new" ? mappingModal : null;
      const result = editing
        ? await executeMutation(mutationRef(dc, "UpdateSalesChannelProductMapping", { id: editing.id, externalProductId: mappingForm.externalProductId.trim(), externalProductName: mappingForm.externalProductName.trim(), syncPrice: mappingForm.syncPrice, syncStock: mappingForm.syncStock, enabled: mappingForm.enabled, priceMode: mappingForm.priceMode, customPriceCents, remoteProductState: profile === "GROCERY" ? mappingForm.remoteProductState : "EXISTING" }))
        : await executeMutation(mutationRef(dc, "CreateSalesChannelProductMapping", { connectionId: mappingForm.connectionId, productId: mappingForm.productId, externalProductId: mappingForm.externalProductId.trim(), externalProductName: mappingForm.externalProductName.trim(), syncPrice: mappingForm.syncPrice, syncStock: mappingForm.syncStock, priceMode: mappingForm.priceMode, customPriceCents, remoteProductState: profile === "GROCERY" ? mappingForm.remoteProductState : "EXISTING" }));
      if (!mutationApplied(result)) throw new Error("Operação não aplicada");
      setMappingModal(null); await refresh(editing ? "Vínculo salvo e sincronização automática iniciada." : "Produto salvo e envio ao iFood iniciado automaticamente.");
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
  async function syncFinancial(connectionId: string) {
    setActing(`${connectionId}:financial`);
    try {
      const result = await executeMutation(mutationRef(dc, "RequestSalesChannelSync", { connectionId, scope: "FINANCIAL", requestKey: crypto.randomUUID() }));
      if (!mutationApplied(result)) throw new Error("Conexão indisponível");
      setDiagnostics(null);
      await refresh("Conciliação financeira enfileirada. O resultado aparecerá em Histórico e problemas.");
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível iniciar a conciliação. Confira se não existe outra sincronização em andamento." }); } finally { setActing(null); }
  }
  async function authorize(connection: Connection, merchantId: string) {
    setActing(connection.id);
    try {
      const result = await executeMutation(mutationRef(dc, "ConnectSalesChannelMerchant", { connectionId: connection.id, merchantId, requestKey: crypto.randomUUID() }));
      if (!mutationApplied(result)) throw new Error("Conexão não elegível");
      setAuthorization(null);
      await refresh("Validação segura iniciada. Acompanhe o resultado em Diagnóstico ou Operações.");
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Não foi possível vincular esta loja. Confira sua permissão de gerenciamento, se a loja já está vinculada a outra conexão e tente novamente." });
    } finally { setActing(null); }
  }
  async function retry(id: string) {
    setActing(id);
    try { const result = await executeMutation(mutationRef(dc, "RetrySalesChannelCommand", { id })); if (!mutationApplied(result)) throw new Error("Não elegível"); await refresh("Comando reenfileirado."); }
    catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível reenfileirar este comando." }); } finally { setActing(null); }
  }
  async function retryDecommission(connectionId: string) {
    setActing(connectionId);
    try {
      const result = await executeMutation(mutationRef(dc, "RetrySalesChannelDecommissioning", { id: connectionId }));
      if (!mutationApplied(result)) throw new Error("Não elegível");
      await refresh("Desativação dos produtos reenfileirada. A conexão será arquivada quando o iFood confirmar todos os itens.");
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Não foi possível retomar a remoção. Confira o histórico e sua permissão de exclusão." });
    } finally { setActing(null); }
  }
  async function exportCsv() {
    setActing("export");
    try {
      const result = await executeQuery(queryRef(dc, "ExportSalesChannelManagement", { section: section.toUpperCase(), term: term.trim(), provider: filters.provider, status: filters.status, branchId: filters.branchId || null, connectionId: filters.connectionId || null, requestKey: crypto.randomUUID() }));
      const exported = box<{ connections: Connection[]; products: Mapping[] }>(result) ?? { connections: [], products: [] };
      if (section === "connections") {
        const rows = exported.connections;
        downloadSalesChannelCsv("conexoes-canais.csv", buildSalesChannelCsv(["Parceiro", "Loja", "Filial", "ID externo", "Autorização", "Saúde", "Sincronização"], rows.map((item) => [salesChannelProviderLabel(item.provider), item.displayName, item.branchName, item.externalStoreId, item.authorizationStatus, salesChannelHealth(item).label, dateTime(item.lastSyncedAt)])));
      }
      if (section === "products") {
        const rows = exported.products;
        downloadSalesChannelCsv("catalogo-canais.csv", buildSalesChannelCsv(["Produto", "Tipo", "Código", "Parceiro", "Conexão", "ID externo", "Preço iFood", "Regra de preço", "Estoque", "Status"], rows.map((item) => [item.productName, item.bundleProduct ? "Combo" : "Produto", item.internalCode, salesChannelProviderLabel(item.provider), item.connectionName, item.externalProductId, money(item.effectivePriceCents), item.syncPrice ? (item.priceMode === "CUSTOM" ? "Exclusivo do iFood" : "Preço do cadastro") : "Sem sincronização", item.syncStock ? (item.bundleProduct ? "Automático pelos componentes" : "Automático") : "Manual", item.syncStatus])));
      }
      setNotice({ type: "success", text: "CSV completo gerado com os filtros aplicados." });
    } catch (error) { console.error(error); setNotice({ type: "error", text: "Não foi possível exportar os dados." }); } finally { setActing(null); }
  }

  const pagination = <footer className="catalog-pagination channels-pagination"><button disabled={page === 0 || busy} onClick={() => setPage(Math.max(0, page - 1))}>← Anterior</button><span>Página {page + 1} de {pages} · {total} registro(s)</span><button disabled={page + 1 >= pages || busy} onClick={() => setPage(page + 1)}>Próxima →</button></footer>;
  return <section className="catalog-page channels-page">
    <header><div className="catalog-title-group"><Link className="catalog-back" to="/modulos/canais" aria-label="Voltar ao submenu de canais" title="Voltar"><span className="material-symbols-rounded">arrow_back</span></Link><div><span className="eyebrow">Canais de venda</span><h1>Gestão de conexões</h1></div></div><nav className="channels-management-tabs" aria-label="Áreas da gestão"><button className={section === "connections" ? "active" : ""} onClick={() => changeSection("connections")}><span className="material-symbols-rounded">hub</span>Conexões</button><button className={section === "products" ? "active" : ""} onClick={() => changeSection("products")}><span className="material-symbols-rounded">inventory_2</span>Catálogo</button>{platformSupport && <button className={section === "operations" ? "active" : ""} onClick={() => changeSection("operations")}><span className="material-symbols-rounded">monitor_heart</span>Histórico e problemas</button>}</nav><div className={`catalog-header-actions${section === "products" ? " channels-catalog-actions" : ""}`}>{hasTools && <button className="catalog-clear-tools" onClick={clearTools}><span className="material-symbols-rounded">ink_eraser</span>Limpar filtros</button>}{section === "connections" && permission?.canCreate && <button className="catalog-primary" onClick={() => openConnection()}><span className="material-symbols-rounded">add_link</span>Novo canal</button>}{section === "products" && permission?.canManage && <><button className="catalog-primary" onClick={() => openMapping(undefined, "NEW")} disabled={!options.connections.some((item) => item.catalogProfile === "GROCERY")} title="Criar um novo item em uma loja iFood Mercado"><span className="material-symbols-rounded">add</span>Adicionar produto</button><button className="catalog-secondary" onClick={() => openMapping(undefined, "EXISTING")} disabled={!options.connections.length} title="Relacionar um item que já existe no iFood"><span className="material-symbols-rounded">link</span>Vincular produto</button><button className="catalog-secondary" onClick={() => openMapping(undefined, "REACTIVATE")} disabled={!options.connections.some((item) => item.catalogProfile === "GROCERY")} title="Reativar um item inativo em uma loja iFood Mercado"><span className="material-symbols-rounded">restart_alt</span>Reativar existente</button></>}</div></header>
    {notice && <div className={`master-toast master-toast--${notice.type}`} role="alert" aria-live="assertive"><span className="material-symbols-rounded">{notice.type === "success" ? "check_circle" : "error"}</span><strong>{notice.text}</strong></div>}
    {section === "connections" && <Kpis activeKey={filters.status} onSelect={(status) => { setFilters({ ...filters, status }); setPage(0); }} items={[["", "link", "Conexões", connections.summary.total, "Ambientes configurados", "info"], ["AUTHORIZED", "verified", "Autorizadas", connections.summary.authorized, "Prontas para operar", "success"], ["PREPARING", "build_circle", "Em preparação", connections.summary.preparing, "Dependem do parceiro", "info"], ["ATTENTION", "warning", "Atenção", connections.summary.attention, "Exigem diagnóstico", "danger"]]} />}
    {section === "products" && <Kpis activeKey={filters.status} onSelect={(status) => { setFilters({ ...filters, status }); setPage(0); }} items={[["", "inventory_2", "Produtos vinculados", mappings.summary.total, "Catálogo integrado", "info"], ["AUTOMATIC", "bolt", "Automáticos", mappings.summary.automatic, "Preço ou estoque ativo", "success"], ["PENDING", "schedule", "Pendentes", mappings.summary.pending, "Aguardam processamento", "info"], ["ERROR", "error", "Com erro", mappings.summary.errors, "Exigem correção", "danger"]]} />}
    {section === "operations" && <Kpis activeKey={operationView} onSelect={(key) => setOperationView(key as typeof operationView)} items={[["events", "webhook", "Falhas de evento", operations.summary.eventFailures, "Inbox idempotente", operations.summary.eventFailures ? "danger" : "success"], ["commands", "outbox", "Comandos em fila", operations.summary.queuedCommands, "Aguardando parceiro", "info"], ["jobs", "sync_problem", "Falhas de sincronização", operations.summary.syncFailures, "Catálogo, preço e estoque", operations.summary.syncFailures ? "danger" : "success"]]} />}
    <div className="catalog-panel channels-tools-panel"><Toolbar section={section} term={term} setTerm={(value) => { setTerm(value); setPage(0); }} filterCount={filterCount} onFilters={() => { setDraftFilters(filters); setFilterModal(true); }} onExport={permission?.canExport && section !== "operations" ? exportCsv : undefined} exportBusy={acting === "export"} onRefresh={() => void load()} busy={busy} /></div>
    {section === "connections" && <Connections footer={pagination} data={connections} permission={permission} sort={sort} acting={acting} onSort={changeSort} onEdit={openConnection} onDiagnostics={setDiagnostics} onStore={setStoreOperations} onAuthorize={setAuthorization} onSync={sync} onRetryDecommission={retryDecommission} onRemove={setConfirmRemove} />}
    {section === "products" && <Mappings footer={pagination} data={mappings} permission={permission} sort={sort} acting={acting} onSort={changeSort} onEdit={openMapping} onSync={sync} onRemove={setConfirmRemove} />}
    {section === "operations" && <OperationPanels view={operationView} data={operations} permission={permission} acting={acting} onRetry={retry} footer={<footer className="catalog-pagination channels-pagination"><span>Até {operationLimit} registros recentes por categoria</span>{operationLimit < 500 && (operations.events.length >= operationLimit || operations.commands.length >= operationLimit || operations.jobs.length >= operationLimit) && <button disabled={busy} onClick={() => setOperationLimit(Math.min(500, operationLimit + 50))}>Mostrar mais</button>}</footer>} />}
    {filterModal && <FilterModal section={section} options={options} value={draftFilters} setValue={setDraftFilters} onClose={() => setFilterModal(false)} onApply={(event) => { event.preventDefault(); setFilters(draftFilters); setPage(0); setOperationLimit(50); setFilterModal(false); }} />}
    {connectionModal && <ConnectionModal editing={connectionModal !== "new" ? connectionModal : null} branches={options.branches} form={connectionForm} setForm={setConnectionForm} busy={acting === "connection"} onClose={() => setConnectionModal(null)} onSubmit={saveConnection} />}
    {mappingModal && <MappingModal editing={mappingModal !== "new" ? mappingModal : null} connections={options.connections} form={mappingForm} setForm={setMappingForm} busy={acting === "mapping"} onClose={() => setMappingModal(null)} onSubmit={saveMapping} />}
    {confirmRemove && <RemoveDialog connection={"branchId" in confirmRemove} grocery={!('branchId' in confirmRemove) && confirmRemove.catalogProfile === "GROCERY"} busy={acting === confirmRemove.id} onClose={() => setConfirmRemove(null)} onConfirm={() => void remove()} />}
    {diagnostics && <Diagnostics connection={diagnostics} canManage={Boolean(permission?.canManage)} busy={acting === `${diagnostics.id}:financial`} onFinancialSync={() => void syncFinancial(diagnostics.id)} onClose={() => setDiagnostics(null)} />}
    {authorization && <AuthorizationWizard connection={authorization} busy={acting === authorization.id} onClose={() => setAuthorization(null)} onAuthorize={(merchantId) => void authorize(authorization, merchantId)} />}
    {storeOperations && <StoreOperations connection={storeOperations} canManage={Boolean(permission?.canManage)} onNotice={setNotice} onClose={() => setStoreOperations(null)} />}
    {busy && <Loading />}
  </section>;
}

function Toolbar({ section, term, setTerm, filterCount, onFilters, onExport, exportBusy, onRefresh, busy }: { section: Section; term: string; setTerm: (value: string) => void; filterCount: number; onFilters: () => void; onExport?: () => void; exportBusy: boolean; onRefresh: () => void; busy: boolean }) { return <div className="catalog-toolbar channels-toolbar">{section !== "operations" && <label><span className="material-symbols-rounded">search</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={section === "connections" ? "Pesquisar parceiro, loja, filial ou ID" : "Pesquisar produto, código, EAN ou ID externo"} /></label>}<button onClick={onFilters}><span className="material-symbols-rounded">tune</span>Pesquisa avançada{filterCount > 0 && <b>{filterCount}</b>}</button>{onExport && <button onClick={onExport} disabled={exportBusy}>{exportBusy ? "Exportando..." : "Exportar CSV"}</button>}<button onClick={onRefresh} disabled={busy}><span className="material-symbols-rounded">refresh</span>Atualizar</button></div>; }

function Connections({ data, footer, permission, sort, acting, onSort, onEdit, onDiagnostics, onStore, onAuthorize, onSync, onRetryDecommission, onRemove }: { data: Paged<Connection>; footer: ReactNode; permission?: { canUpdate?: boolean; canDelete?: boolean; canManage?: boolean }; sort: TableSort | null; acting: string | null; onSort: (key: string) => void; onEdit: (item: Connection) => void; onDiagnostics: (item: Connection) => void; onStore: (item: Connection) => void; onAuthorize: (item: Connection) => void; onSync: (id: string) => Promise<void>; onRetryDecommission: (id: string) => Promise<void>; onRemove: (item: Connection) => void }) {
  return <DataPanel footer={footer}><table><thead><tr><SortableTableHeader label="Canal" sortKey="provider" sort={sort} onChange={onSort} /><SortableTableHeader label="Loja" sortKey="displayName" sort={sort} onChange={onSort} /><SortableTableHeader label="Filial" sortKey="branchName" sort={sort} onChange={onSort} /><th>ID externo</th><SortableTableHeader label="Saúde" sortKey="status" sort={sort} onChange={onSort} /><th>Catálogo</th><SortableTableHeader label="Última sincronização" sortKey="lastSyncedAt" sort={sort} onChange={onSort} /><th>Ações</th></tr></thead><tbody>{data.rows.map((item) => { const health = salesChannelHealth(item); const ready = isSalesChannelOperational(item); const authorizing = ["PENDING", "PENDING_APPROVAL"].includes(item.authorizationStatus); return <tr key={item.id}><td><Provider provider={item.provider} /></td><td><strong>{item.displayName}</strong><small>{item.integrationMode} · {item.catalogProfile === "GROCERY" ? "Mercado" : item.catalogProfile === "RESTAURANT" ? "Restaurante" : "Tipo detectado na autorização"}</small></td><td>{item.branchName}</td><td><code>{item.externalStoreId || "—"}</code></td><td><Status variant={health.key} label={item.status === "DECOMMISSIONING" ? "Desativando no iFood" : health.label} title={item.lastError ?? undefined} /></td><td><strong>{item.mappingCount}</strong><small>{item.pendingOrders} pedido(s) pendente(s)</small></td><td>{dateTime(item.lastSyncedAt)}</td><td><div className="catalog-actions"><button className="catalog-action catalog-action--info" onClick={() => onDiagnostics(item)}><span className="material-symbols-rounded">monitor_heart</span>Diagnóstico</button>{permission?.canManage && item.provider === "IFOOD" && !ready && item.status !== "DECOMMISSIONING" && <button className="catalog-action catalog-action--success" disabled={authorizing || acting === item.id || !item.enabled} title="Selecionar uma loja autorizada e validar a conexão" onClick={() => onAuthorize(item)}><span className="material-symbols-rounded">verified_user</span>{authorizing ? "Validando..." : "Conectar"}</button>}{permission?.canManage && ready && <button className="catalog-action catalog-action--info" onClick={() => onStore(item)}><span className="material-symbols-rounded">storefront</span>Loja</button>}{permission?.canManage && ready && <button className="catalog-action catalog-action--success" disabled={acting === item.id} title="Atualizar preços e disponibilidade dos produtos vinculados" onClick={() => void onSync(item.id)}><span className="material-symbols-rounded">sync</span>Sincronizar</button>}{permission?.canDelete && item.status === "DECOMMISSIONING" && <button className="catalog-action catalog-action--edit" disabled={acting === item.id} title="Reenviar somente as desativações que falharam" onClick={() => void onRetryDecommission(item.id)}><span className="material-symbols-rounded">restart_alt</span>Retomar remoção</button>}{permission?.canUpdate && item.status !== "DECOMMISSIONING" && <button className="catalog-action catalog-action--edit" onClick={() => onEdit(item)}><span className="material-symbols-rounded">edit</span>Configurar</button>}{permission?.canDelete && item.status !== "DECOMMISSIONING" && <button className="catalog-action catalog-action--danger" onClick={() => onRemove(item)}><span className="material-symbols-rounded">link_off</span>Remover</button>}</div></td></tr>; })}</tbody></table>{!data.rows.length && <Empty icon="hub" title="Nenhuma conexão encontrada" text="Prepare uma loja iFood ou altere os filtros para visualizar conexões." />}</DataPanel>;
}
function Mappings({ data, footer, permission, sort, acting, onSort, onEdit, onSync, onRemove }: { data: Paged<Mapping>; footer: ReactNode; permission?: { canManage?: boolean }; sort: TableSort | null; acting: string | null; onSort: (key: string) => void; onEdit: (item: Mapping) => void; onSync: (id: string) => Promise<void>; onRemove: (item: Mapping) => void }) {
  return <DataPanel footer={footer}><table><thead><tr><SortableTableHeader label="Produto" sortKey="productName" sort={sort} onChange={onSort} /><SortableTableHeader label="Canal" sortKey="provider" sort={sort} onChange={onSort} /><SortableTableHeader label="Identificador iFood" sortKey="externalProductId" sort={sort} onChange={onSort} /><th>Nome externo</th><th>Preço no iFood</th><th>Estoque</th><SortableTableHeader label="Publicação" sortKey="syncStatus" sort={sort} onChange={onSort} /><SortableTableHeader label="Último envio" sortKey="lastSyncedAt" sort={sort} onChange={onSort} /><th>Ações</th></tr></thead><tbody>{data.rows.map((item) => { const label = publicationLabel(item); const confirmed = ["CONFIRMED", "ACCEPTED"].includes(item.publicationStatus) && !item.needsFullPublication; return <tr key={item.id}><td><strong>{item.productName}</strong><small>{item.bundleProduct ? "Combo · " : ""}{item.internalCode || item.ean || "Sem código"}</small></td><td><Provider provider={item.provider} /><small>{item.connectionName} · {item.branchName}</small></td><td><code>{item.externalProductId}</code><small>{item.catalogProfile === "GROCERY" ? "EAN / código de balança" : "Item do catálogo"}</small></td><td>{item.externalProductName || "—"}</td><td><strong>{money(item.effectivePriceCents)}</strong><small>{item.syncPrice ? (item.priceMode === "CUSTOM" ? "Exclusivo do iFood · automático" : "Preço do cadastro · automático") : "Não sincroniza preço"}</small></td><td><Status variant={item.syncStock ? "active" : "paused"} label={item.syncStock ? (item.bundleProduct ? "Por componentes" : "Automático") : "Manual"} /></td><td><Status variant={item.syncStatus === "ERROR" || item.publicationStatus === "ERROR" ? "error" : confirmed ? "active" : "pending"} label={label} title={item.lastError ?? undefined} />{item.publicationStatus === "RECEIVED" && <small title={item.partnerOperationId ?? undefined}>O iFood recebeu a atualização; confira a exibição no catálogo.</small>}{item.nextPromotionChangeAt && <small>Próxima promoção: {dateTime(item.nextPromotionChangeAt)}</small>}</td><td>{dateTime(item.lastSyncedAt)}</td><td><div className="catalog-actions">{permission?.canManage && <><button className="catalog-action catalog-action--success" disabled={acting === item.connectionId} title="Sincroniza novamente os produtos desta loja; o processamento acontece em segundo plano." onClick={() => void onSync(item.connectionId)}><span className="material-symbols-rounded">sync</span>Sincronizar loja</button><button className="catalog-action catalog-action--edit" onClick={() => onEdit(item)}><span className="material-symbols-rounded">edit</span>Configurar</button><button className="catalog-action catalog-action--danger" onClick={() => onRemove(item)}><span className="material-symbols-rounded">delete</span>Remover</button></>}</div></td></tr>; })}</tbody></table>{!data.rows.length && <Empty icon="inventory_2" title="Nenhum produto vinculado" text="Adicione um produto do Insight Pad e escolha se ele deve ser criado ou vinculado ao item que já existe no iFood." />}</DataPanel>;
}
function OperationPanels({ data: rawData, view, footer, permission, acting, onRetry }: { data: Operations; view: "events" | "commands" | "jobs" | ""; footer: ReactNode; permission?: { canUpdate?: boolean }; acting: string | null; onRetry: (id: string) => Promise<void> }) {
  const data: Operations = { ...rawData, commands: rawData.commands.map((item) => ({ ...item, action: salesChannelActionLabel(item.action) })), jobs: rawData.jobs.map((item) => ({ ...item, jobType: salesChannelJobLabel(item.jobType) })) };
  return <div className="channels-operation-grid" data-view={view}><OperationCard title="Comandos enviados" icon="outbox"><table><thead><tr><th>Canal</th><th>Ação</th><th>Status</th><th>Tentativas</th><th>Data</th><th>Ação segura</th></tr></thead><tbody>{data.commands.map((item) => { const safeRetry = !item.outcomeUnknown && !unsafeRetryActions.has(item.action); return <tr key={item.id}><td>{salesChannelProviderLabel(item.provider)} · {item.connectionName}</td><td>{item.action}</td><td><Status variant={item.status === "ERROR" ? "error" : item.status === "CONFIRMED" ? "active" : "pending"} label={item.outcomeUnknown ? "Resultado a confirmar" : item.status === "AWAITING_PARTNER" ? "Aguardando iFood" : item.status} title={item.lastError ?? undefined} />{item.reconciliationDueAt && <small>Reconciliação: {dateTime(item.reconciliationDueAt)}</small>}</td><td>{item.attempts}</td><td>{dateTime(item.createdAt)}</td><td>{permission?.canUpdate && item.status === "ERROR" && (safeRetry ? <button className="catalog-action catalog-action--edit" disabled={acting === item.id} onClick={() => void onRetry(item.id)}>Tentar novamente</button> : <Link className="catalog-action catalog-action--info" to="/integracoes/canais/pedidos">Reconciliar pedido</Link>)}</td></tr>; })}</tbody></table>{!data.commands.length && <Empty icon="outbox" title="Nenhum comando recente" text="Aceites, recusas e conclusões aparecerão aqui." />}</OperationCard><OperationCard title="Sincronizações" icon="sync"><table><thead><tr><th>Canal</th><th>Escopo</th><th>Status</th><th>Progresso</th><th>Data</th></tr></thead><tbody>{data.jobs.map((item) => <tr key={item.id}><td>{salesChannelProviderLabel(item.provider)} · {item.connectionName}</td><td>{item.jobType}</td><td><Status variant={item.status === "ERROR" ? "error" : item.status === "COMPLETED" ? "active" : "pending"} label={item.status === "AWAITING_PARTNER" ? "Aguardando iFood" : item.status} title={item.lastError ?? undefined} /></td><td>{item.processedItems}/{item.totalItems} · {item.failedItems} falha(s)</td><td>{dateTime(item.createdAt)}</td></tr>)}</tbody></table>{!data.jobs.length && <Empty icon="sync" title="Nenhuma sincronização recente" text="Catálogo, preço e estoque aparecerão aqui." />}</OperationCard><OperationCard title="Eventos recebidos" icon="webhook"><table><thead><tr><th>Canal</th><th>Evento</th><th>Origem</th><th>Status</th><th>Tentativas</th><th>Recebido</th></tr></thead><tbody>{data.events.map((item) => <tr key={item.id}><td>{salesChannelProviderLabel(item.provider)} · {item.connectionName}</td><td><strong>{item.eventType}</strong><small>{item.providerEventId}</small></td><td><Status variant={item.source === "WEBHOOK" ? "active" : "pending"} label={item.source === "WEBHOOK" ? "Webhook" : "Reconciliação"} /></td><td><Status variant={item.status === "ERROR" ? "error" : item.status === "PROCESSED" || item.status === "ACKNOWLEDGED" ? "active" : "pending"} label={item.status === "AWAITING_PARTNER" ? "Aguardando iFood" : item.status} title={item.lastError ?? undefined} /></td><td>{item.attempts}</td><td>{dateTime(item.receivedAt)}</td></tr>)}</tbody></table>{!data.events.length && <Empty icon="webhook" title="Nenhum evento recente" text="Webhooks e eventos consultados aparecerão aqui." />}</OperationCard>{footer}</div>;
}
function Kpis({ items, activeKey, onSelect }: { items: [string, string, string, number | undefined, string, string][]; activeKey: string; onSelect: (key: string) => void }) { return <div className="channels-kpis">{items.map(([key, icon, label, value, detail, variant]) => <button type="button" className={`channel-kpi channel-kpi--${variant}${activeKey === key ? " active" : ""}`} aria-pressed={activeKey === key} onClick={() => onSelect(activeKey === key && key ? "" : key)} key={label}><span className="material-symbols-rounded">{icon}</span><div><small>{label}</small><strong>{Number(value ?? 0)}</strong><p>{detail}</p></div></button>)}</div>; }
function DataPanel({ children, footer }: { children: ReactNode; footer: ReactNode }) { return <div className="catalog-panel channels-data-panel"><div className="catalog-scroll"><div className="catalog-table channels-table">{children}</div></div>{footer}</div>; }
function OperationCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) { return <section className="channel-operation-card"><header><span className="material-symbols-rounded">{icon}</span><h2>{title}</h2></header><div className="channel-operation-card__scroll">{children}</div></section>; }
function Provider({ provider }: { provider: SalesChannelProvider }) { return <span className={`channel-provider channel-provider--${provider.toLowerCase()}`}>{salesChannelProviderLabel(provider)}</span>; }
function Status({ variant, label, title }: { variant: string; label: string; title?: string }) { return <span className={`channel-status channel-status--${variant}`} title={title}><i />{salesChannelStatusLabel(label)}</span>; }
function Empty({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="channels-empty"><span className="material-symbols-rounded">{icon}</span><strong>{title}</strong><p>{text}</p></div>; }
function Loading() { return <div className="catalog-loader"><div className="catalog-loader__mark"><span /><img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" /></div><strong>Atualizando canais de venda...</strong></div>; }

function FilterModal({ section, options, value, setValue, onClose, onApply }: { section: Section; options: Options; value: Filters; setValue: (value: Filters) => void; onClose: () => void; onApply: (event: FormEvent) => void }) {
  useDialogAccessibility(true, onClose);
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal advanced-search-modal channel-filter-modal" role="dialog" aria-modal="true" aria-label="Pesquisa avançada"><header><div><span className="eyebrow">Pesquisa</span><h2>Filtros avançados</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={onApply}><div className="master-form-grid">{section !== "operations" && <label><span>Parceiro</span><select value={value.provider} onChange={(event) => setValue({ ...value, provider: event.target.value })}><option value="">Todos os parceiros</option>{Object.entries(SALES_CHANNEL_PROVIDERS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>}{section === "connections" && <label><span>Filial</span><select value={value.branchId} onChange={(event) => setValue({ ...value, branchId: event.target.value })}><option value="">Todas as filiais</option>{options.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}{section !== "connections" && <label><span>Conexão</span><select value={value.connectionId} onChange={(event) => setValue({ ...value, connectionId: event.target.value })}><option value="">Todas as conexões</option>{options.connections.map((item) => <option key={item.id} value={item.id}>{salesChannelProviderLabel(item.provider)} · {item.displayName}</option>)}</select></label>}{section !== "operations" && <label><span>Status</span><select value={value.status} onChange={(event) => setValue({ ...value, status: event.target.value })}><option value="">Todos os status</option>{section === "connections" ? <><option value="AUTHORIZED">Autorizada</option><option value="NOT_CONNECTED">Não conectada</option><option value="PENDING_APPROVAL">Aguardando aprovação</option><option value="PREPARING">Em preparação</option><option value="ATTENTION">Atenção</option><option value="ERROR">Com erro</option><option value="SUSPENDED">Suspensa</option></> : <><option value="ENABLED">Ativo</option><option value="PAUSED">Pausado</option><option value="AUTOMATIC">Automático</option><option value="PENDING">Pendente</option><option value="COMPLETED">Sincronizado</option><option value="ERROR">Com erro</option></>}</select></label>}</div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose}>Cancelar</button><button className="catalog-primary catalog-modal-submit">Aplicar filtros</button></footer></form></section></div>;
}

function ConnectionModal({ editing, branches, form, setForm, busy, onClose, onSubmit }: { editing: Connection | null; branches: Branch[]; form: ConnectionForm; setForm: (value: ConnectionForm) => void; busy: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  useDialogAccessibility(true, onClose);
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-modal" role="dialog" aria-modal="true" aria-label={editing ? "Configurar loja iFood" : "Preparar loja iFood"}><header><div><span className="eyebrow">Integração iFood</span><h2>{editing ? "Configurar loja" : "Preparar nova loja"}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={onSubmit}><div className="channel-modal-body"><div className="master-form-grid"><label><span>Parceiro</span><input value="iFood" disabled /></label><label><span>Filial</span><select value={form.branchId} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, branchId: event.target.value })} required><option value="">Selecione</option>{branches.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label><span>Nome para identificar a loja</span><input autoFocus value={form.displayName} maxLength={160} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Ex.: iFood · Loja Centro" required /></label>{editing?.externalStoreId && <label><span>Loja iFood vinculada</span><input value={editing.externalStoreId} disabled /></label>}{editing && <label className="channel-toggle"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>Manter recepção de pedidos e sincronizações ativa</span></label>}</div></div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className={`catalog-primary catalog-modal-submit ${editing ? "catalog-modal-submit--edit" : "catalog-modal-submit--create"}`} disabled={busy}>{busy ? "Salvando..." : editing ? "Salvar configuração" : "Preparar loja"}</button></footer></form></section></div>;
}

function MappingModal({ editing, connections, form, setForm, busy, onClose, onSubmit }: { editing: Mapping | null; connections: ConnectionOption[]; form: MappingForm; setForm: (value: MappingForm) => void; busy: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const [term, setTerm] = useState(editing?.productName ?? "");
  const [products, setProducts] = useState<ProductOption[]>(editing ? [{ id: editing.productId, name: editing.productName, internalCode: editing.internalCode, ean: editing.ean }] : []);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  useDialogAccessibility(true, onClose);

  useEffect(() => {
    let cancelled = false;
    if (!editing && term.trim().length < 2) {
      return () => { cancelled = true; };
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await executeQuery(queryRef(dc, "SalesChannelProductOptions", { term: term.trim(), connectionId: form.connectionId || null, productId: editing?.productId ?? null, limit: 30, requestKey: crypto.randomUUID() }));
        if (!cancelled) setProducts((result.data as { _select?: ProductOption[] })._select ?? []);
      } catch (error) {
        console.error(error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [editing, form.connectionId, term]);

  const intent = form.remoteProductState;
  const availableConnections = editing || intent === "EXISTING" ? connections : connections.filter((item) => item.catalogProfile === "GROCERY");
  const modalCopy: Record<MappingIntent, { title: string; submit: string }> = {
    NEW: { title: "Adicionar produto ao iFood", submit: "Salvar e criar no iFood" },
    EXISTING: { title: "Vincular produto existente", submit: "Salvar vínculo e sincronizar" },
    REACTIVATE: { title: "Reativar produto existente", submit: "Salvar e reativar no iFood" },
  };
  const connection = connections.find((item) => item.id === form.connectionId);
  const grocery = connection?.catalogProfile === "GROCERY";
  const selectedProduct = products.find((item) => item.id === form.productId);
  const groceryIdentifier = resolveGroceryIdentifier(selectedProduct?.ean ?? (editing ? editing.ean : null), selectedProduct?.scaleCode);
  const identifierValue = grocery ? groceryIdentifier.value : form.externalProductId.trim();
  const customPriceCents = parseMoneyToCents(form.customPrice);
  const priceReady = form.priceMode === "CUSTOM" ? customPriceCents > 0 : Number(selectedProduct?.salePriceCents ?? editing?.salePriceCents ?? 0) > 0;
  const registrationReady = selectedProduct?.active !== false;
  const productLoaded = Boolean(selectedProduct && selectedProduct.salePriceCents !== undefined);
  const componentsReady = !selectedProduct?.bundleProduct || Number(selectedProduct.componentCount ?? 0) > 0;
  const productReady = Boolean(form.productId) && productLoaded && ((!form.enabled && Boolean(editing)) || (registrationReady && componentsReady && priceReady && (!grocery || groceryIdentifier.valid)));

  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-modal" role="dialog" aria-modal="true" aria-label={editing ? "Configurar produto" : modalCopy[intent].title}>
    <header><div><span className="eyebrow">Catálogo</span><h2>{editing ? "Configurar produto" : modalCopy[intent].title}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header>
    <form onSubmit={onSubmit}><div className="channel-modal-body">
      <div className="master-form-grid">
        <label><span>Loja conectada</span><select value={form.connectionId} disabled={Boolean(editing)} onChange={(event) => {
          const next = connections.find((item) => item.id === event.target.value);
          setForm({ ...form, connectionId: event.target.value, externalProductId: next?.catalogProfile === "GROCERY" ? "" : form.externalProductId, syncPrice: next?.catalogProfile === "GROCERY", syncStock: next?.catalogProfile === "GROCERY" });
        }} required><option value="">Selecione a loja</option>{availableConnections.map((item) => <option key={item.id} value={item.id}>{salesChannelProviderLabel(item.provider)} · {item.displayName} · {item.branchName}</option>)}</select></label>
        <label className="channel-product-picker"><span>Produto cadastrado no Insight Pad</span><input value={term} disabled={Boolean(editing)} onChange={(event) => { const value = event.target.value; setTerm(value); setProducts([]); setPickerOpen(value.trim().length >= 2); setForm({ ...form, productId: "", externalProductId: grocery ? "" : form.externalProductId }); }} placeholder="Digite ao menos 2 caracteres para pesquisar" autoComplete="off" role="combobox" aria-expanded={pickerOpen} aria-controls="channel-product-results" />
          {!editing && pickerOpen && <div id="channel-product-results" className="channel-product-results" role="listbox">{loading ? <small>Pesquisando...</small> : products.length ? products.map((item) => {
            const identifier = resolveGroceryIdentifier(item.ean,item.scaleCode);
            return <button type="button" role="option" aria-selected={form.productId === item.id} key={item.id} onClick={() => { setForm({ ...form, productId: item.id, externalProductId: grocery ? identifier.value : form.externalProductId }); setTerm(item.name); setPickerOpen(false); }}><strong>{item.bundleProduct ? "Combo · " : ""}{item.name}</strong><small>{item.internalCode || "Sem código interno"} · {money(item.salePriceCents)}{item.bundleProduct ? ` · ${stockNumber(item.availableStock)} combo(s) disponível(is)` : ""}{grocery ? ` · ${identifier.valid ? `${identifier.kind} ${identifier.value}` : "sem identificador válido"}` : ""}</small></button>;
          }) : <small>Nenhum produto encontrado.</small>}</div>}
          <small>Combos aparecem com a disponibilidade calculada pelos componentes e terão a baixa de cada componente na venda.</small>
        </label>
        <label><span>{grocery ? "Identificador usado pelo iFood" : "ID do item no catálogo iFood"}</span><input value={identifierValue} maxLength={160} disabled={grocery} onChange={(event) => setForm({ ...form, externalProductId: event.target.value })} required={!grocery} placeholder={grocery ? "Carregado do cadastro do produto" : "Cole o ID fornecido pelo catálogo iFood"} />{grocery && groceryIdentifier.error && <small className="channel-field-error">{groceryIdentifier.error}</small>}{!grocery && <small>Para Restaurante, esta versão vincula e atualiza preço/disponibilidade de um item que já existe no catálogo iFood.</small>}</label>
        <label><span>Nome exibido no iFood <small>(opcional)</small></span><input value={form.externalProductName} maxLength={240} onChange={(event) => setForm({ ...form, externalProductName: event.target.value })} placeholder={selectedProduct?.name ?? ""} /></label>
        <label><span>Preço usado no iFood</span><select value={form.priceMode} onChange={(event) => { const priceMode = event.target.value as MappingForm["priceMode"]; setForm({ ...form, priceMode, syncPrice: priceMode === "CUSTOM" ? true : form.syncPrice, customPrice: priceMode === "CUSTOM" && !form.customPrice ? moneyInputFromCents(selectedProduct?.salePriceCents ?? editing?.salePriceCents ?? 0) : form.customPrice }); }}><option value="PRODUCT">Mesmo preço do cadastro</option><option value="CUSTOM">Preço exclusivo para o iFood</option></select><small>{form.priceMode === "CUSTOM" ? "Alterações no preço normal e nas promoções do cadastro não substituirão este valor." : "Preço e promoção vigentes no cadastro serão usados."}</small></label>
        {form.priceMode === "CUSTOM" && <label><span>Preço exclusivo no iFood</span><input inputMode="numeric" value={form.customPrice} onChange={(event) => setForm({ ...form, customPrice: maskMoneyInput(event.target.value), syncPrice: true })} placeholder="R$ 0,00" required /><small>Valor que será enviado ao iFood para esta loja.</small></label>}
        <label className="channel-toggle"><input type="checkbox" checked={form.syncPrice} disabled={form.priceMode === "CUSTOM"} onChange={(event) => setForm({ ...form, syncPrice: event.target.checked })} /><span>{form.priceMode === "CUSTOM" ? "Manter o preço exclusivo sincronizado" : "Atualizar o preço automaticamente"}</span></label>
        <label className="channel-toggle"><input type="checkbox" checked={form.syncStock} onChange={(event) => setForm({ ...form, syncStock: event.target.checked })} /><span>{grocery ? "Atualizar a quantidade disponível automaticamente" : "Pausar ou reativar conforme o estoque"}</span></label>
        {editing && <label className="channel-toggle"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>Produto ativo nesta loja</span></label>}
      </div>
    </div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className={`catalog-primary catalog-modal-submit ${editing ? "catalog-modal-submit--edit" : "catalog-modal-submit--create"}`} disabled={busy || !productReady || (!grocery && !identifierValue)}>{busy ? "Salvando e enviando..." : editing ? "Salvar e sincronizar" : modalCopy[intent].submit}</button></footer></form>
  </section></div>;
}

function AuthorizationWizard({ connection, busy, onClose, onAuthorize }: { connection: Connection; busy: boolean; onClose: () => void; onAuthorize: (merchantId: string) => void }) {
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [selected, setSelected] = useState(connection.externalStoreId ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useDialogAccessibility(true, onClose);
  useEffect(() => {
    let active = true;
    void fetchAvailableMerchants({ connectionId: connection.id }).then(({ data }) => {
      if (!active) return;
      setMerchants(data.merchants);
      if (data.merchants.length === 1) setSelected((current) => current || data.merchants[0]?.id || "");
    }).catch(() => { if (active) setError("Não foi possível consultar as lojas autorizadas agora."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [connection.id]);
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-modal channel-authorization" role="dialog" aria-modal="true" aria-label="Conectar ao iFood"><header><div><span className="eyebrow">Assistente de conexão</span><h2>Escolha a loja iFood</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><div className="channel-modal-body"><ol className="channel-wizard-steps"><li className="done"><b>1</b><span>Filial preparada</span></li><li className="active"><b>2</b><span>Selecionar loja</span></li><li><b>3</b><span>Confirmar identidade</span></li></ol>{loading ? <div className="channels-inline-loading">Consultando lojas autorizadas no iFood...</div> : error ? <div className="channel-diagnostics-error"><span className="material-symbols-rounded">error</span><p>{error}</p></div> : merchants.length ? <div className="channel-merchant-list" role="radiogroup" aria-label="Lojas iFood autorizadas">{merchants.map((merchant) => <label key={merchant.id} className={selected === merchant.id ? "selected" : ""}><input type="radio" name="merchant" checked={selected === merchant.id} onChange={() => setSelected(merchant.id)} /><span className="material-symbols-rounded">storefront</span><div><strong>{merchant.name}</strong><small>{merchant.type} · {merchant.catalogProfile === "GROCERY" ? "Mercado" : merchant.catalogProfile === "RESTAURANT" ? "Restaurante" : "Tipo será validado"}</small><code>{merchant.id}</code></div></label>)}</div> : <Empty icon="link_off" title="Nenhuma loja disponível" text="Autorize o Insight Pad no Portal do Parceiro iFood e atualize esta etapa." />}</div><footer><button type="button" className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className="catalog-primary catalog-modal-submit" disabled={!selected || loading || busy} onClick={() => onAuthorize(selected)}>{busy ? "Validando..." : "Conectar e validar"}</button></footer></section></div>;
}

type StoreDayName = "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
type StoreShift = { key: string; dayOfWeek: StoreDayName; start: string; duration: number };
const STORE_DAYS: { dayOfWeek: StoreDayName; label: string }[] = [
  { dayOfWeek: "MONDAY", label: "Segunda" }, { dayOfWeek: "TUESDAY", label: "Terça" }, { dayOfWeek: "WEDNESDAY", label: "Quarta" },
  { dayOfWeek: "THURSDAY", label: "Quinta" }, { dayOfWeek: "FRIDAY", label: "Sexta" }, { dayOfWeek: "SATURDAY", label: "Sábado" }, { dayOfWeek: "SUNDAY", label: "Domingo" },
];
const newShift = (dayOfWeek: StoreDayName, start = "09:00", duration = 480): StoreShift => ({ key: crypto.randomUUID(), dayOfWeek, start, duration });
function minutesFromTime(value: string) { const [hour,minute] = value.split(":").map(Number); return hour * 60 + minute; }
function shiftEnd(shift: StoreShift) { const total = (minutesFromTime(shift.start) + shift.duration) % 1440; return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`; }
function durationUntil(start: string, end: string) { const duration = (minutesFromTime(end) - minutesFromTime(start) + 1440) % 1440; return duration || 1440; }
const defaultStoreShifts = () => STORE_DAYS.filter((day) => day.dayOfWeek !== "SUNDAY").map((day) => newShift(day.dayOfWeek, "09:00", day.dayOfWeek === "SATURDAY" ? 240 : 480));
function objectRecords(value: unknown): Record<string, unknown>[] { if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object"); if (value && typeof value === "object") { const record = value as Record<string, unknown>; for (const key of ["interruptions", "shifts", "data"]) if (Array.isArray(record[key])) return objectRecords(record[key]); return [record]; } return []; }
function parseStoreShifts(value: unknown): StoreShift[] { return objectRecords(value).flatMap((record) => { const day = String(record.dayOfWeek ?? "").toUpperCase() as StoreDayName; const start = String(record.start ?? record.openingTime ?? "").slice(0, 5); let duration = Number(record.duration ?? 0); if ((!Number.isFinite(duration) || duration <= 0) && /^\d{2}:\d{2}/.test(start) && /^\d{2}:\d{2}/.test(String(record.end ?? record.closingTime ?? ""))) { const [sh,sm] = start.split(":").map(Number); const [eh,em] = String(record.end ?? record.closingTime).slice(0,5).split(":").map(Number); duration = ((eh! * 60 + em!) - (sh! * 60 + sm!) + 1440) % 1440 || 1440; } return STORE_DAYS.some((item) => item.dayOfWeek === day) && /^\d{2}:\d{2}$/.test(start) && Number.isInteger(duration) && duration >= 15 && duration <= 1440 ? [newShift(day,start,duration)] : []; }); }

function StoreOperations({ connection, canManage, onNotice, onClose }: { connection: Connection; canManage: boolean; onNotice: (notice: Notice) => void; onClose: () => void }) {
  const [data, setData] = useState<{ status?: unknown; openingHours?: unknown; interruptions?: unknown }>({});
  const [shifts, setShifts] = useState<StoreShift[]>(defaultStoreShifts);
  const [pause, setPause] = useState({ description: "Pausa operacional", start: "", end: "" });
  const [busy, setBusy] = useState("");
  useDialogAccessibility(true, () => { if (!busy) onClose(); });
  const reload = useCallback(async ({ announceSuccess = false, afterMutation = false } = {}) => {
    setBusy("READ");
    try {
      const result = await runMerchantOperation({ connectionId: connection.id, action: "READ" });
      const next = (result.data.data as typeof data) ?? {};
      setData(next);
      const parsed = parseStoreShifts(next.openingHours);
      if (Object.prototype.hasOwnProperty.call(next, "openingHours")) setShifts(parsed);
      if (announceSuccess) onNotice({ type: "success", text: "Dados da loja atualizados pelo iFood." });
      return true;
    } catch {
      onNotice({ type: "error", text: afterMutation ? "A alteração foi aceita, mas não foi possível atualizar a tela. Feche e abra a loja para conferir." : "Não foi possível consultar o estado da loja no iFood." });
      return false;
    } finally {
      setBusy("");
    }
  }, [connection.id, onNotice]);
  useEffect(() => { const timer = window.setTimeout(() => void reload(), 0); return () => window.clearTimeout(timer); }, [reload]);
  async function action(name: StoreOperationAction, payload?: unknown) {
    if (name === "SAVE_HOURS" && (invalidShifts || overlappingShifts)) {
      onNotice({ type: "error", text: overlappingShifts ? "Existem horários sobrepostos. Ajuste os intervalos antes de salvar." : "Revise os horários antes de salvar no iFood." });
      return;
    }
    setBusy(name);
    try {
      await runMerchantOperation({ connectionId: connection.id, action: name, payload });
      if (name === "CREATE_INTERRUPTION") setPause({ description: "Pausa operacional", start: "", end: "" });
      const refreshed = await reload({ afterMutation: true });
      if (refreshed) onNotice({ type: "success", text: storeOperationSuccess[name] });
    } catch {
      onNotice({ type: "error", text: "O iFood não concluiu a alteração. Revise os dados e tente novamente." });
    } finally {
      setBusy("");
    }
  }
  const interruptions = objectRecords(data.interruptions);
  const status = objectRecords(data.status)[0] ?? {};
  const validPause = Boolean(pause.description.trim() && pause.start && pause.end && new Date(pause.end).getTime() > new Date(pause.start).getTime());
  const invalidShifts = !shifts.length || shifts.some((shift) => !/^\d{2}:\d{2}$/.test(shift.start) || !Number.isInteger(shift.duration) || shift.duration < 15 || shift.duration > 1440);
  const overlappingShifts = !invalidShifts && storeHoursHaveOverlap(shifts);
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-store-modal" role="dialog" aria-modal="true" aria-label="Operação da loja iFood"><header><div><span className="eyebrow">Loja iFood</span><h2>{connection.displayName}</h2></div><button onClick={onClose} aria-label="Fechar">×</button></header><div className="channel-modal-body"><div className="channel-store-status"><span className="material-symbols-rounded">storefront</span><div><small>Status informado pelo iFood</small><strong>{salesChannelStatusLabel(String(status.state ?? status.status ?? status.operation ?? (busy === "READ" ? "Consultando..." : "Disponível")))}</strong></div><button type="button" onClick={() => void reload({ announceSuccess: true })} disabled={Boolean(busy)}>Atualizar</button></div><section className="channel-store-section"><header><h3>Horários de funcionamento</h3><p>Os horários atuais são carregados do iFood. Você pode adicionar mais de um intervalo no mesmo dia.</p></header><div className="channel-hours-grid">{STORE_DAYS.map((day) => { const dayShifts = shifts.filter((shift) => shift.dayOfWeek === day.dayOfWeek); return <div className="channel-hours-day" key={day.dayOfWeek}><header><label className="channel-toggle"><input type="checkbox" checked={dayShifts.length > 0} disabled={!canManage} onChange={(event) => setShifts(event.target.checked ? [...shifts,newShift(day.dayOfWeek)] : shifts.filter((shift) => shift.dayOfWeek !== day.dayOfWeek))} /><span>{day.label}</span></label>{canManage && dayShifts.length > 0 && dayShifts.length < 8 && <button type="button" onClick={() => setShifts([...shifts,newShift(day.dayOfWeek,"18:00",240)])}>+ Intervalo</button>}</header>{dayShifts.map((shift) => <div className="channel-hours-row" key={shift.key}><label><span>Início</span><input type="time" value={shift.start} disabled={!canManage} onChange={(event) => setShifts(shifts.map((item) => item.key === shift.key ? { ...item,start:event.target.value } : item))} /></label><label><span>Fecha às</span><input type="time" value={shiftEnd(shift)} disabled={!canManage} onChange={(event) => setShifts(shifts.map((item) => item.key === shift.key ? { ...item,duration:durationUntil(item.start,event.target.value) } : item))} /><small>{shift.duration === 1440 ? "Aberto por 24 horas" : shiftEnd(shift) <= shift.start ? "Fecha no dia seguinte" : ""}</small></label>{canManage && dayShifts.length > 1 && <button type="button" aria-label={`Remover intervalo de ${day.label}`} onClick={() => setShifts(shifts.filter((item) => item.key !== shift.key))}>×</button>}</div>)}</div>; })}</div>{overlappingShifts && <p className="catalog-form-error" role="alert">Existem horários sobrepostos. Ajuste os intervalos antes de salvar.</p>}{canManage && <button className="catalog-primary" disabled={Boolean(busy) || invalidShifts || overlappingShifts} onClick={() => void action("SAVE_HOURS", { shifts: shifts.map((shift) => ({ dayOfWeek: shift.dayOfWeek, start: `${shift.start}:00`, duration: shift.duration })) })}>Salvar horários no iFood</button>}</section><section className="channel-store-section"><header><h3>Pausas programadas</h3><p>Use uma pausa para indisponibilidade temporária sem desconectar a loja.</p></header>{interruptions.length ? <div className="channel-interruptions">{interruptions.map((item, index) => <article key={String(item.id ?? index)}><div><strong>{String(item.description ?? "Pausa")}</strong><small>{String(item.start ?? "")} — {String(item.end ?? "")}</small></div>{canManage && Boolean(item.id) && <button className="catalog-action catalog-action--danger" disabled={Boolean(busy)} onClick={() => void action("DELETE_INTERRUPTION", { id: item.id })}>Encerrar</button>}</article>)}</div> : <p className="channel-store-empty">Nenhuma pausa ativa.</p>}{canManage && <div className="channel-pause-form"><label><span>Motivo</span><input value={pause.description} maxLength={180} onChange={(event) => setPause({ ...pause, description: event.target.value })} /></label><label><span>Início</span><input type="datetime-local" value={pause.start} onChange={(event) => setPause({ ...pause, start: event.target.value })} /></label><label><span>Fim</span><input type="datetime-local" min={pause.start || undefined} value={pause.end} onChange={(event) => setPause({ ...pause, end:event.target.value })} /></label><button className="catalog-action catalog-action--edit" disabled={Boolean(busy) || !validPause} onClick={() => void action("CREATE_INTERRUPTION", { description: pause.description.trim(), start: new Date(pause.start).toISOString(), end: new Date(pause.end).toISOString() })}>Programar pausa</button></div>}</section></div><footer><button className="catalog-modal-cancel" onClick={onClose}>Fechar</button></footer></section></div>;
}

function RemoveDialog({ connection, grocery, busy, onClose, onConfirm }: { connection: boolean; grocery: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) { useDialogAccessibility(true, onClose); return <div className="catalog-backdrop"><section className="catalog-confirm" role="alertdialog" aria-modal="true" aria-label="Confirmar remoção"><span className="material-symbols-rounded">{connection ? "link_off" : "delete"}</span><h2>{connection ? "Remover conexão?" : "Remover vínculo?"}</h2><p>{connection ? "Os produtos publicados serão desativados no iFood antes do arquivamento. Enquanto isso, a conexão ficará como “Desativando no iFood”; pedidos, histórico e auditoria serão preservados." : grocery ? "O vínculo será encerrado e a desativação do produto será enfileirada na loja iFood Mercado. O histórico será preservado." : "O produto será desativado no catálogo iFood antes de o vínculo ser encerrado. O histórico será preservado."}</p><footer><button className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Cancelar</button><button className="catalog-action catalog-action--danger catalog-modal-submit" onClick={onConfirm} disabled={busy}>{busy ? "Removendo..." : "Confirmar remoção"}</button></footer></section></div>; }
function Diagnostics({ connection, canManage, busy, onFinancialSync, onClose }: { connection: Connection; canManage: boolean; busy: boolean; onFinancialSync: () => void; onClose: () => void }) {
  useDialogAccessibility(true, () => { if (!busy) onClose(); });
  const health = salesChannelHealth(connection);
  const catalog = nestedRecord(connection.capabilities, "catalog");
  const merchant = connection.merchantSnapshot ?? {};
  const merchantName = String(merchant.name ?? connection.displayName);
  const merchantStatus = String(merchant.status ?? "Ainda não consultado");
  const profile = connection.catalogProfile === "GROCERY" ? "Mercado" : connection.catalogProfile === "RESTAURANT" ? "Restaurante" : "Ainda não confirmado";
  return <div className="catalog-backdrop"><section className="catalog-modal master-modal channel-diagnostics-modal" role="dialog" aria-modal="true" aria-label="Diagnóstico">
    <header><div><span className="eyebrow">Saúde da integração</span><h2>{connection.displayName}</h2></div><button onClick={onClose} disabled={busy} aria-label="Fechar">×</button></header>
    <div className="channel-diagnostics-body">
      <div className="channel-diagnostics-hero"><Provider provider={connection.provider} /><Status variant={health.key} label={health.label} /></div>
      <dl className="channel-diagnostics-summary"><div><dt>Loja</dt><dd>{merchantName}<small>{profile} · {merchantStatus}</small></dd></div><div><dt>Pedidos</dt><dd>{capabilityLabel(connection.capabilities?.order)}</dd></div><div><dt>Preço no iFood</dt><dd>{capabilityLabel(catalog.price)}</dd></div><div><dt>Estoque</dt><dd>{capabilityLabel(catalog.inventoryQuantity ?? catalog.availability)}</dd></div><div><dt>Separação</dt><dd>{capabilityLabel(connection.capabilities?.grocerySeparation)}</dd></div><div><dt>Financeiro</dt><dd>{capabilityLabel(connection.capabilities?.financial)}<small>{connection.lastFinancialSyncAt ? `Última conciliação: ${dateTime(connection.lastFinancialSyncAt)}` : "Valide antes do piloto"}</small></dd></div><div><dt>Recebimento de eventos</dt><dd>{connection.webhookStatus === "ACTIVE" ? "Ativo" : "Aguardando primeiro evento"}</dd></div><div><dt>Último sucesso</dt><dd>{dateTime(connection.lastSuccessAt)}</dd></div></dl>
      {connection.lastError && <div className="channel-diagnostics-error"><span className="material-symbols-rounded">error</span><div><strong>Última falha</strong><p>{connection.lastError}</p></div></div>}
      <details className="channel-diagnostics-advanced"><summary>Informações técnicas para suporte</summary><dl><div><dt>Autorização</dt><dd>{connection.authorizationStatus}</dd></div><div><dt>Modo de recepção</dt><dd>{connection.integrationMode === "HYBRID" ? "Webhook com conferência automática" : connection.integrationMode}</dd></div><div><dt>Última consulta de pedidos</dt><dd>{dateTime(connection.lastPollingAt)}</dd></div><div><dt>Última verificação</dt><dd>{dateTime(connection.lastHealthCheckAt)}</dd></div><div><dt>Falhas consecutivas</dt><dd>{connection.consecutiveFailures}</dd></div><div><dt>Validade do acesso</dt><dd>{dateTime(connection.tokenExpiresAt)}</dd></div><div><dt>ID para suporte</dt><dd><code>{connection.lastRequestId || "—"}</code></dd></div></dl></details>
    </div>
    <footer><button className="catalog-modal-cancel" onClick={onClose} disabled={busy}>Fechar</button>{canManage && <button className="catalog-primary" disabled={busy} onClick={onFinancialSync}><span className="material-symbols-rounded">account_balance</span>{busy ? "Conciliando..." : connection.lastFinancialSyncAt ? "Conciliar agora" : "Validar financeiro"}</button>}</footer>
  </section></div>;
}
