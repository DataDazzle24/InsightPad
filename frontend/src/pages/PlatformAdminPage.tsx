import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, NavLink } from "react-router-dom";
import { executeMutation, getDataConnect, mutationRef } from "firebase/data-connect";
import {
  createPlatformTenant,
  linkPlatformUser,
  platformAdminWorkspace,
  setPlatformTenantStatus,
  setPlatformUserStatus,
  connectorConfig,
} from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import { AppLoading, AppToast, type Notice } from "../components/SalesUi";
import { PlatformBillingPanel, type PlatformBillingSummary } from "../components/PlatformBillingPanel";
import { PlatformPermissions } from "../components/PlatformPermissions";
import { SortableTableHeader } from "../components/SortableTableHeader";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { datePtBr, formatMoneyFromCents, maskMoneyInput, moneyInputFromCents, nextPlatformTenantStep, parseMoneyToCents, type PlatformTenantStep } from "../utils/platformBilling";
import { nextTableSort, sortTableRows, type TableSort } from "../utils/tableSorting";

type Tenant = {
  id: string;
  legalName: string;
  tradeName?: string;
  document?: string;
  email?: string;
  phone?: string;
  planCode?: string;
  startsOn?: string;
  expiresOn?: string;
  active: boolean;
  userCount: number;
  branchCount: number;
  billingProfileConfigured: boolean;
  responsibleName?: string;
  responsibleRole?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  billingEmail?: string;
  billingPhone?: string;
  communicationChannel?: string;
  allowEmailBilling: boolean;
  allowWhatsappBilling: boolean;
  communicationConsentSource?: string;
  communicationConsentAt?: string;
  monthlyAmountCents: string;
  billingDay: number;
  graceDays: number;
  suspendAfterDays: number;
  preferredPaymentMethod?: string;
  nextDueDate?: string;
  billingNotes?: string;
  openBalanceCents: string;
  overdueCount: number;
};
type Role = { id: string; tenantId: string; tenantName: string; name: string; active: boolean };
type PlatformUser = {
  id: string;
  tenantId: string;
  tenantName: string;
  roleId: string;
  roleName: string;
  name: string;
  email: string;
  active: boolean;
  onboardingPending: boolean;
  lastLoginAt?: string;
};
type Workspace = {
  tenants: Tenant[];
  roles: Role[];
  users: PlatformUser[];
  pages: Array<{ id: string; pageKey: string; displayName: string; module: string }>;
  permissions: Array<Record<string, unknown>>;
};
export type PlatformAdminView = "tenants" | "billing" | "users" | "permissions";
type TenantForm = {
  tenantId?: string;
  legalName: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  planCode: string;
  startsOn: string;
  expiresOn: string;
  responsibleName: string;
  responsibleRole: string;
  responsibleEmail: string;
  responsiblePhone: string;
  billingEmail: string;
  billingPhone: string;
  allowEmailBilling: boolean;
  allowWhatsappBilling: boolean;
  communicationConsentSource: string;
  communicationConsentAt: string;
  monthlyAmount: string;
  billingDay: string;
  graceDays: string;
  suspendAfterDays: string;
  preferredPaymentMethod: string;
  nextDueDate: string;
  billingNotes: string;
};
type StatusConfirmation = { kind: "tenant"; item: Tenant } | { kind: "user"; item: PlatformUser };

const empty: Workspace = { tenants: [], roles: [], users: [], pages: [], permissions: [] };
const dc = getDataConnect(firebaseApp, connectorConfig);
const PAGE_SIZE = 20;
const today = () => new Date().toISOString().slice(0, 10);
const tenantName = (item: Tenant) => item.tradeName || item.legalName;
const emptyTenantForm = (): TenantForm => ({
  legalName: "",
  tradeName: "",
  document: "",
  email: "",
  phone: "",
  planCode: "BRONZE",
  startsOn: today(),
  expiresOn: "",
  responsibleName: "",
  responsibleRole: "",
  responsibleEmail: "",
  responsiblePhone: "",
  billingEmail: "",
  billingPhone: "",
  allowEmailBilling: true,
  allowWhatsappBilling: false,
  communicationConsentSource: "",
  communicationConsentAt: "",
  monthlyAmount: "",
  billingDay: "10",
  graceDays: "3",
  suspendAfterDays: "7",
  preferredPaymentMethod: "PIX",
  nextDueDate: "",
  billingNotes: "",
});
const toLocalDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const operationApplied = (result: unknown) => Boolean((result as { data?: { _execute?: unknown } })?.data?._execute);

export function PlatformAdminPage({ view }: { view: PlatformAdminView }) {
  const [data, setData] = useState<Workspace>(empty);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TableSort | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [tenantModal, setTenantModal] = useState<"new" | Tenant | null>(null);
  const [tenantStep, setTenantStep] = useState<PlatformTenantStep>("identity");
  const [tenantForm, setTenantForm] = useState<TenantForm>(emptyTenantForm);
  const [userModal, setUserModal] = useState(false);
  const [userForm, setUserForm] = useState<Record<string, string>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [statusConfirmation, setStatusConfirmation] = useState<StatusConfirmation | null>(null);
  const [billingSummary, setBillingSummary] = useState<PlatformBillingSummary>({ receivableCents: "0", overdueCents: "0", overdueTenants: 0, receivedMonthCents: "0" });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await platformAdminWorkspace(dc, { requestKey: crypto.randomUUID() });
      const box = ((result.data._select ?? [])[0] as { data?: Workspace } | undefined)?.data ?? empty;
      setData(box);
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Não foi possível carregar a administração da plataforma." });
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  useDialogAccessibility(Boolean(tenantModal), closeTenantModal);
  useDialogAccessibility(userModal, closeUserModal);
  useDialogAccessibility(Boolean(statusConfirmation), () => setStatusConfirmation(null));

  const q = search.trim().toLocaleLowerCase("pt-BR");
  const tenants = useMemo(() => data.tenants.filter((item) => !q || [item.legalName, item.tradeName, item.document, item.planCode, item.responsibleName, item.responsibleEmail].some((value) => value?.toLocaleLowerCase("pt-BR").includes(q))), [data.tenants, q]);
  const users = useMemo(() => data.users.filter((item) => !q || [item.name, item.email, item.tenantName, item.roleName, item.id].some((value) => value?.toLocaleLowerCase("pt-BR").includes(q))), [data.users, q]);
  const sortedTenants = useMemo(() => sortTableRows(tenants, sort, (item, key) => key === "tenantName" ? tenantName(item) : item[key as keyof Tenant]), [sort, tenants]);
  const sortedUsers = useMemo(() => sortTableRows(users, sort), [sort, users]);
  const records = view === "tenants" ? sortedTenants : sortedUsers;
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pagedTenants = sortedTenants.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pagedUsers = sortedUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const availableRoles = data.roles.filter((role) => role.tenantId === userForm.tenantId && role.active);
  const activeTenants = data.tenants.filter((item) => item.active).length;
  const configuredTenants = data.tenants.filter((item) => item.billingProfileConfigured).length;
  const overdueTenants = data.tenants.filter((item) => item.overdueCount > 0).length;
  const activeUsers = data.users.filter((item) => item.active).length;
  const onboardingPending = data.users.filter((item) => item.onboardingPending).length;
  const activeRoles = data.roles.filter((item) => item.active).length;
  const title = view === "tenants" ? "Empresas e ambientes" : view === "billing" ? "Cobranças e baixas" : "Gestão de usuários";

  function changeSort(key: string) {
    setSort((current) => nextTableSort(current, key));
    setPage(0);
  }
  function patchTenant<K extends keyof TenantForm>(key: K, value: TenantForm[K]) {
    setTenantForm((current) => ({ ...current, [key]: value }));
  }
  function openTenant(item?: Tenant) {
    if (!item) {
      setTenantForm(emptyTenantForm());
      setTenantModal("new");
    } else {
      setTenantForm({
        tenantId: item.id,
        legalName: item.legalName,
        tradeName: item.tradeName ?? "",
        document: item.document ?? "",
        email: item.email ?? "",
        phone: item.phone ?? "",
        planCode: item.planCode ?? "BRONZE",
        startsOn: item.startsOn?.slice(0, 10) ?? today(),
        expiresOn: item.expiresOn?.slice(0, 10) ?? "",
        responsibleName: item.responsibleName ?? "",
        responsibleRole: item.responsibleRole ?? "",
        responsibleEmail: item.responsibleEmail ?? "",
        responsiblePhone: item.responsiblePhone ?? "",
        billingEmail: item.billingEmail ?? "",
        billingPhone: item.billingPhone ?? "",
        allowEmailBilling: item.allowEmailBilling,
        allowWhatsappBilling: item.allowWhatsappBilling,
        communicationConsentSource: item.communicationConsentSource ?? "",
        communicationConsentAt: toLocalDateTime(item.communicationConsentAt),
        monthlyAmount: item.monthlyAmountCents ? moneyInputFromCents(item.monthlyAmountCents) : "",
        billingDay: String(item.billingDay ?? 10),
        graceDays: String(item.graceDays ?? 3),
        suspendAfterDays: String(item.suspendAfterDays ?? 7),
        preferredPaymentMethod: item.preferredPaymentMethod ?? "PIX",
        nextDueDate: item.nextDueDate?.slice(0, 10) ?? "",
        billingNotes: item.billingNotes ?? "",
      });
      setTenantModal(item);
    }
    setTenantStep("identity");
  }
  function closeTenantModal() {
    setTenantModal(null);
    setTenantStep("identity");
  }
  function closeUserModal() {
    setUserModal(false);
    setUserForm({});
    setEditingUserId(null);
  }
  function validateTenantStep(step: PlatformTenantStep) {
    if (step === "identity" && tenantForm.legalName.trim().length < 2) {
      setNotice({ type: "error", text: "Informe a razão social do ambiente." });
      return false;
    }
    if (step === "responsible" && (tenantForm.responsibleName.trim().length < 2 || !tenantForm.responsibleEmail.includes("@") || tenantForm.responsiblePhone.replace(/\D/g, "").length < 10)) {
      setNotice({ type: "error", text: "Informe nome, e-mail e telefone válidos do responsável." });
      return false;
    }
    if (step === "billing") {
      const billingDay = Number(tenantForm.billingDay);
      if (parseMoneyToCents(tenantForm.monthlyAmount) < 0 || billingDay < 1 || billingDay > 31) {
        setNotice({ type: "error", text: "Confira o valor mensal e informe um dia de vencimento entre 1 e 31." });
        return false;
      }
      if (tenantForm.allowWhatsappBilling && (!tenantForm.communicationConsentSource || !tenantForm.communicationConsentAt)) {
        setNotice({ type: "error", text: "Para comunicações financeiras por WhatsApp, registre a origem e a data da autorização." });
        return false;
      }
    }
    return true;
  }
  function nextTenantStep() {
    if (!validateTenantStep(tenantStep)) return;
    setTenantStep(nextPlatformTenantStep);
  }
  async function saveTenant(event: FormEvent) {
    event.preventDefault();
    if (tenantStep !== "billing") {
      nextTenantStep();
      return;
    }
    if (!validateTenantStep("identity") || !validateTenantStep("responsible") || !validateTenantStep("billing")) return;
    setBusy(true);
    try {
      const payload = {
        ...tenantForm,
        monthlyAmountCents: parseMoneyToCents(tenantForm.monthlyAmount),
        billingDay: Number(tenantForm.billingDay),
        graceDays: Number(tenantForm.graceDays),
        suspendAfterDays: Number(tenantForm.suspendAfterDays),
        communicationChannel: tenantForm.allowEmailBilling && tenantForm.allowWhatsappBilling ? "BOTH" : tenantForm.allowWhatsappBilling ? "WHATSAPP" : tenantForm.allowEmailBilling ? "EMAIL" : "NONE",
        communicationConsentAt: tenantForm.communicationConsentAt ? new Date(tenantForm.communicationConsentAt).toISOString() : "",
      };
      const result = tenantModal === "new"
        ? await createPlatformTenant(dc, { payload })
        : await executeMutation(mutationRef(dc, "UpdatePlatformTenant", { payload }));
      if (!operationApplied(result)) throw new Error("Operação não aplicada");
      const created = tenantModal === "new";
      closeTenantModal();
      setNotice({ type: "success", text: created ? "Ambiente, perfil administrador e configuração financeira criados." : "Ambiente e configuração financeira atualizados." });
      await load();
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Não foi possível salvar o ambiente. Confira campos, documento duplicado e dados financeiros." });
    } finally {
      setBusy(false);
    }
  }
  async function linkUser(event: FormEvent) {
    event.preventDefault();
    if (!userForm.uid || !userForm.tenantId || !userForm.roleId) {
      setNotice({ type: "error", text: "Informe UID do Firebase, empresa e perfil." });
      return;
    }
    setBusy(true);
    try {
      const result = await linkPlatformUser(dc, { payload: userForm });
      if (!operationApplied(result)) throw new Error("Operação não aplicada");
      closeUserModal();
      setNotice({ type: "success", text: "Usuário vinculado ao ambiente com sucesso." });
      await load();
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Não foi possível vincular o usuário. Confira UID, empresa e perfil; sua própria conta não pode ser alterada aqui." });
    } finally {
      setBusy(false);
    }
  }
  async function applyStatus() {
    if (!statusConfirmation) return;
    setBusy(true);
    try {
      if (statusConfirmation.kind === "tenant") {
        const item = statusConfirmation.item;
        const result = await setPlatformTenantStatus(dc, { tenantId: item.id, active: !item.active });
        if (!operationApplied(result)) throw new Error("Operação não aplicada");
        setNotice({ type: "success", text: `Ambiente ${item.active ? "inativado" : "ativado"} com sucesso.` });
      } else {
        const item = statusConfirmation.item;
        const result = await setPlatformUserStatus(dc, { userId: item.id, active: !item.active });
        if (!operationApplied(result)) throw new Error("Operação não aplicada");
        setNotice({ type: "success", text: `Usuário ${item.active ? "inativado" : "ativado"} com sucesso.` });
      }
      setStatusConfirmation(null);
      await load();
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", text: "Não foi possível alterar o status. A conta atual e o ambiente da Data Dazzle são protegidos." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="catalog-page platform-admin">
      <header className="catalog-page-header platform-page-header">
        <div className="catalog-title-group">
          <Link className="catalog-back" to="/modulos/plataforma" aria-label="Voltar ao submenu da gestão da plataforma" title="Voltar"><span className="material-symbols-rounded">arrow_back</span></Link>
          <div><span className="eyebrow">Gestão da plataforma</span><h1>{title}</h1></div>
        </div>
        {view === "tenants" ? <div className="platform-header-kpis"><span><b>{activeTenants}</b> ambientes ativos</span><span><b>{configuredTenants}</b> perfis financeiros</span><span className={overdueTenants ? "attention" : ""}><b>{overdueTenants}</b> em atraso</span></div> : view === "billing" ? <div className="platform-header-kpis platform-header-kpis--billing" aria-label="Resumo financeiro"><span className={overdueTenants ? "attention" : ""}><b>{overdueTenants}</b> em atraso</span><span><b>{formatMoneyFromCents(billingSummary.receivableCents)}</b> a receber</span><span className={Number(billingSummary.overdueCents) ? "attention" : ""}><b>{formatMoneyFromCents(billingSummary.overdueCents)}</b> em atraso</span><span className={billingSummary.overdueTenants ? "attention" : ""}><b>{billingSummary.overdueTenants}</b> clientes em atraso</span><span><b>{formatMoneyFromCents(billingSummary.receivedMonthCents)}</b> recebido no mês</span></div> : <div className="platform-header-kpis"><span><b>{activeUsers}</b> usuários ativos</span><span><b>{activeRoles}</b> perfis ativos</span><span className={onboardingPending ? "attention" : ""}><b>{onboardingPending}</b> acessos pendentes</span></div>}
      </header>
      <AppToast notice={notice} onClose={() => setNotice(null)} />
      {(view === "users" || view === "permissions") && <nav className="platform-tabs platform-user-tabs" aria-label="Áreas da gestão de usuários"><NavLink to="/plataforma/gestao-usuarios/usuarios"><span className="material-symbols-rounded">manage_accounts</span>Usuários</NavLink><NavLink to="/plataforma/gestao-usuarios/perfis-permissoes"><span className="material-symbols-rounded">lock_person</span>Perfis e permissões</NavLink></nav>}

      {view === "billing" ? <PlatformBillingPanel tenants={data.tenants} onNotice={setNotice} onSummaryChange={setBillingSummary} /> : view === "permissions" ? <PlatformPermissions roles={data.roles} pages={data.pages} permissions={data.permissions} onNotice={setNotice} onSaved={load} /> : <div className="platform-panel">
        <div className="platform-toolbar">
          <label className="platform-search"><span className="material-symbols-rounded">search</span><span className="sr-only">Pesquisar</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder={view === "tenants" ? "Pesquisar empresa, responsável, documento ou plano" : "Pesquisar usuário, e-mail, UID, perfil ou empresa"} /></label>
          {search && <button className="catalog-clear-tools" onClick={() => { setSearch(""); setPage(0); }}><span className="material-symbols-rounded">filter_alt_off</span>Limpar filtros</button>}
          <button className="catalog-primary" onClick={() => view === "tenants" ? openTenant() : (setUserForm({ tenantId: "" }), setEditingUserId(null), setUserModal(true))}><span className="material-symbols-rounded">add</span>{view === "tenants" ? "Novo ambiente" : "Vincular usuário"}</button>
        </div>
        <div className="platform-table">
          <table>
            <thead>{view === "tenants" ? <tr><SortableTableHeader label="Empresa / ambiente" sortKey="tenantName" sort={sort} onChange={changeSort} /><SortableTableHeader label="Responsável" sortKey="responsibleName" sort={sort} onChange={changeSort} /><SortableTableHeader label="Plano e mensalidade" sortKey="planCode" sort={sort} onChange={changeSort} /><SortableTableHeader label="Próximo vencimento" sortKey="nextDueDate" sort={sort} onChange={changeSort} /><SortableTableHeader label="Uso" sortKey="userCount" sort={sort} onChange={changeSort} /><SortableTableHeader label="Status" sortKey="active" sort={sort} onChange={changeSort} /><th>Ações</th></tr> : <tr><SortableTableHeader label="Usuário" sortKey="name" sort={sort} onChange={changeSort} /><SortableTableHeader label="Empresa" sortKey="tenantName" sort={sort} onChange={changeSort} /><SortableTableHeader label="Perfil" sortKey="roleName" sort={sort} onChange={changeSort} /><SortableTableHeader label="UID Firebase" sortKey="id" sort={sort} onChange={changeSort} /><SortableTableHeader label="Último acesso" sortKey="lastLoginAt" sort={sort} onChange={changeSort} /><SortableTableHeader label="Status" sortKey="active" sort={sort} onChange={changeSort} /><th>Ações</th></tr>}</thead>
            <tbody>
              {view === "tenants" ? pagedTenants.map((item) => <tr key={item.id} className={!item.active ? "inactive-row" : ""}>
                <td><strong>{tenantName(item)}</strong><small>{item.document || item.legalName}</small></td>
                <td><strong>{item.responsibleName || "Não configurado"}</strong><small>{item.responsibleEmail || item.email || "—"}</small></td>
                <td><span className={`plan-badge plan-badge--${(item.planCode || "bronze").toLowerCase()}`}>{item.planCode || "—"}</span><small>{formatMoneyFromCents(item.monthlyAmountCents || 0)} / mês</small></td>
                <td><strong>{datePtBr(item.nextDueDate)}</strong><small className={item.overdueCount ? "danger-text" : ""}>{item.overdueCount ? `${item.overdueCount} cobrança(s) em atraso` : item.openBalanceCents !== "0" ? `${formatMoneyFromCents(item.openBalanceCents)} em aberto` : "Sem pendências"}</small></td>
                <td><strong>{item.userCount} usuários</strong><small>{item.branchCount} filiais</small></td>
                <td><span className={`catalog-status catalog-status--${item.active ? "active" : "inactive"}`}><i />{item.active ? "Ativa" : "Inativa"}</span></td>
                <td className="platform-row-actions"><button className="catalog-row-edit" onClick={() => openTenant(item)}><span className="material-symbols-rounded">edit</span>Editar</button><button className={item.active ? "danger" : "success"} onClick={() => setStatusConfirmation({ kind: "tenant", item })}><span className="material-symbols-rounded">{item.active ? "block" : "check_circle"}</span>{item.active ? "Inativar" : "Ativar"}</button></td>
              </tr>) : pagedUsers.map((item) => <tr key={item.id} className={!item.active ? "inactive-row" : ""}>
                <td><strong>{item.name}</strong><small>{item.email}</small></td><td>{item.tenantName}</td><td>{item.roleName}</td><td><code>{item.id}</code></td><td>{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString("pt-BR") : "Nunca"}</td><td><span className={`catalog-status catalog-status--${item.active ? "active" : "inactive"}`}><i />{item.active ? "Ativo" : "Inativo"}</span></td>
                <td className="platform-row-actions"><button className="catalog-row-edit" onClick={() => { setUserForm({ uid: item.id, name: item.name, email: item.email, tenantId: item.tenantId, roleId: item.roleId }); setEditingUserId(item.id); setUserModal(true); }}><span className="material-symbols-rounded">edit</span>Editar</button><button className={item.active ? "danger" : "success"} onClick={() => setStatusConfirmation({ kind: "user", item })}><span className="material-symbols-rounded">{item.active ? "person_off" : "person_check"}</span>{item.active ? "Inativar" : "Ativar"}</button></td>
              </tr>)}
              {!records.length && <tr><td colSpan={7}><div className="platform-empty"><span className="material-symbols-rounded">search_off</span><strong>Nenhum registro encontrado</strong><small>Revise a pesquisa ou cadastre um novo registro.</small></div></td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="catalog-pagination platform-pagination"><span>{records.length} registro{records.length === 1 ? "" : "s"}</span><div><button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><span className="material-symbols-rounded">chevron_left</span>Anterior</button><strong>Página {page + 1} de {totalPages}</strong><button disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Próxima<span className="material-symbols-rounded">chevron_right</span></button></div></footer>
      </div>}

      {tenantModal && <div className="catalog-backdrop"><section className="catalog-modal master-modal platform-modal platform-tenant-modal" role="dialog" aria-modal="true" aria-labelledby="platform-tenant-title"><header><div><span className="eyebrow">{tenantModal === "new" ? "NOVO AMBIENTE" : "GESTÃO DO AMBIENTE"}</span><h2 id="platform-tenant-title">{tenantModal === "new" ? "Cadastrar empresa" : tenantName(tenantModal)}</h2></div><button type="button" aria-label="Fechar" onClick={closeTenantModal}>×</button></header><nav className="master-modal-tabs" aria-label="Etapas do ambiente"><button type="button" className={tenantStep === "identity" ? "active" : ""} onClick={() => setTenantStep("identity")}><span>1</span>Identificação</button><button type="button" className={tenantStep === "responsible" ? "active" : ""} onClick={() => validateTenantStep("identity") && setTenantStep("responsible")}><span>2</span>Responsável</button><button type="button" className={tenantStep === "billing" ? "active" : ""} onClick={() => validateTenantStep("identity") && validateTenantStep("responsible") && setTenantStep("billing")}><span>3</span>Cobrança</button></nav><form onSubmit={saveTenant}><div className="master-modal-content">
        {tenantStep === "identity" && <><div className="master-section-title"><span className="material-symbols-rounded">domain</span><div><strong>Identificação do ambiente</strong><small>Dados contratuais e período de vigência do Insight Pad.</small></div></div><div className="master-form-grid">
          <label className="field-wide"><span>Razão social *</span><input autoFocus value={tenantForm.legalName} maxLength={160} onChange={(event) => patchTenant("legalName", event.target.value)} required /></label><label><span>Nome fantasia</span><input value={tenantForm.tradeName} maxLength={160} onChange={(event) => patchTenant("tradeName", event.target.value)} /></label><label><span>CNPJ/CPF da empresa</span><input inputMode="numeric" value={tenantForm.document} maxLength={20} onChange={(event) => patchTenant("document", event.target.value)} /></label><label><span>E-mail institucional</span><input type="email" value={tenantForm.email} maxLength={254} onChange={(event) => patchTenant("email", event.target.value)} /></label><label><span>Telefone institucional</span><input inputMode="tel" value={tenantForm.phone} maxLength={24} onChange={(event) => patchTenant("phone", event.target.value)} /></label><label><span>Plano *</span><select value={tenantForm.planCode} onChange={(event) => patchTenant("planCode", event.target.value)}><option value="BRONZE">Bronze</option><option value="PRATA">Prata</option><option value="OURO">Ouro</option></select></label><label><span>Início da vigência *</span><input type="date" value={tenantForm.startsOn} onChange={(event) => patchTenant("startsOn", event.target.value)} required /></label><label><span>Fim da vigência</span><input type="date" min={tenantForm.startsOn} value={tenantForm.expiresOn} onChange={(event) => patchTenant("expiresOn", event.target.value)} /></label>
        </div></>}
        {tenantStep === "responsible" && <><div className="master-section-title"><span className="material-symbols-rounded">contact_page</span><div><strong>Responsável pelo ambiente</strong><small>Contato operacional e financeiro autorizado pelo cliente.</small></div></div><div className="master-form-grid">
          <label className="field-wide"><span>Nome completo *</span><input autoFocus value={tenantForm.responsibleName} maxLength={160} onChange={(event) => patchTenant("responsibleName", event.target.value)} required /></label><label><span>Cargo ou função</span><input value={tenantForm.responsibleRole} maxLength={100} onChange={(event) => patchTenant("responsibleRole", event.target.value)} /></label><label><span>E-mail do responsável *</span><input type="email" value={tenantForm.responsibleEmail} maxLength={254} onChange={(event) => patchTenant("responsibleEmail", event.target.value)} required /></label><label><span>Telefone / WhatsApp *</span><input inputMode="tel" value={tenantForm.responsiblePhone} maxLength={24} onChange={(event) => patchTenant("responsiblePhone", event.target.value)} required /></label><label><span>E-mail exclusivo de cobrança</span><input type="email" value={tenantForm.billingEmail} maxLength={254} onChange={(event) => patchTenant("billingEmail", event.target.value)} placeholder="Se vazio, usa o e-mail do responsável" /></label><label><span>Telefone exclusivo de cobrança</span><input inputMode="tel" value={tenantForm.billingPhone} maxLength={24} onChange={(event) => patchTenant("billingPhone", event.target.value)} placeholder="Se vazio, usa o telefone do responsável" /></label>
        </div><div className="platform-communication-options"><label><input type="checkbox" checked={tenantForm.allowEmailBilling} onChange={(event) => patchTenant("allowEmailBilling", event.target.checked)} /><span>Autoriza comunicações financeiras por e-mail?</span></label><label><input type="checkbox" checked={tenantForm.allowWhatsappBilling} onChange={(event) => patchTenant("allowWhatsappBilling", event.target.checked)} /><span>Autoriza comunicações financeiras por WhatsApp?</span></label></div>{tenantForm.allowWhatsappBilling && <div className="master-form-grid platform-consent-fields"><label><span>Origem da autorização *</span><select value={tenantForm.communicationConsentSource} onChange={(event) => patchTenant("communicationConsentSource", event.target.value)} required><option value="">Selecione</option><option value="CONTRATO">Contrato</option><option value="FORMULARIO">Formulário</option><option value="WHATSAPP">Conversa no WhatsApp</option><option value="OUTRO">Outro documento</option></select></label><label><span>Data da autorização *</span><input type="datetime-local" value={tenantForm.communicationConsentAt} onChange={(event) => patchTenant("communicationConsentAt", event.target.value)} required /></label><div className="platform-alert field-full"><span className="material-symbols-rounded">verified_user</span>Registre apenas autorizações realmente documentadas. Este campo prepara o envio futuro; nenhuma mensagem é disparada nesta versão.</div></div>}</>}
        {tenantStep === "billing" && <><div className="master-section-title"><span className="material-symbols-rounded">payments</span><div><strong>Condições de cobrança</strong><small>Parâmetros administrativos; bloqueios e disparos ainda não são automáticos.</small></div></div><div className="master-form-grid">
          <label><span>Mensalidade</span><input autoFocus inputMode="numeric" value={tenantForm.monthlyAmount} onChange={(event) => patchTenant("monthlyAmount", maskMoneyInput(event.target.value))} placeholder="R$ 0,00" /></label><label><span>Dia padrão de vencimento *</span><input type="number" min={1} max={31} value={tenantForm.billingDay} onChange={(event) => patchTenant("billingDay", event.target.value)} required /></label><label><span>Dias de tolerância</span><input type="number" min={0} max={90} value={tenantForm.graceDays} onChange={(event) => patchTenant("graceDays", event.target.value)} /></label><label><span>Referência de suspensão após</span><div className="input-with-suffix"><input type="number" min={0} max={365} value={tenantForm.suspendAfterDays} onChange={(event) => patchTenant("suspendAfterDays", event.target.value)} /><span>dias</span></div></label><label><span>Método preferido</span><select value={tenantForm.preferredPaymentMethod} onChange={(event) => patchTenant("preferredPaymentMethod", event.target.value)}><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="TRANSFERENCIA">Transferência</option><option value="CARTAO">Cartão</option><option value="OUTRO">Outro</option></select></label><label><span>Próximo vencimento</span><input type="date" value={tenantForm.nextDueDate} onChange={(event) => patchTenant("nextDueDate", event.target.value)} /></label><label className="field-full"><span>Observações financeiras</span><textarea value={tenantForm.billingNotes} maxLength={1000} onChange={(event) => patchTenant("billingNotes", event.target.value)} /></label><div className="platform-alert field-full"><span className="material-symbols-rounded">info</span>O valor e as datas alimentam a gestão da Data Dazzle. Suspensão automática, pagamentos online e alertas serão ativados somente em etapas futuras e após regras comerciais aprovadas.</div>
        </div></>}
      </div><footer>{tenantStep !== "identity" && <button type="button" onClick={() => setTenantStep(tenantStep === "billing" ? "responsible" : "identity")}><span className="material-symbols-rounded">arrow_back</span>Anterior</button>}<span className="platform-footer-spacer" /><button type="button" className="catalog-modal-cancel" onClick={closeTenantModal}>Cancelar</button>{tenantStep !== "billing" ? <button key="tenant-next" type="button" className={tenantModal === "new" ? "catalog-modal-submit catalog-modal-submit--create" : "catalog-modal-submit catalog-modal-submit--edit"} onClick={nextTenantStep}>Próxima<span className="material-symbols-rounded">arrow_forward</span></button> : <button key="tenant-save" type="submit" className={tenantModal === "new" ? "catalog-modal-submit catalog-modal-submit--create" : "catalog-modal-submit catalog-modal-submit--edit"} disabled={busy}>{tenantModal === "new" ? "Criar ambiente" : "Salvar alterações"}</button>}</footer></form></section></div>}

      {userModal && <div className="catalog-backdrop"><section className="catalog-modal master-modal platform-modal platform-user-modal" role="dialog" aria-modal="true" aria-labelledby="platform-user-title"><header><div><span className="eyebrow">GESTÃO DE ACESSO</span><h2 id="platform-user-title">{editingUserId ? "Editar usuário" : "Vincular usuário"}</h2></div><button type="button" aria-label="Fechar" onClick={closeUserModal}>×</button></header><form onSubmit={linkUser}><div className="master-modal-content"><div className="platform-alert"><span className="material-symbols-rounded">security</span>Crie primeiro a identidade no Firebase Authentication e informe o UID. Credenciais administrativas nunca são criadas no navegador.</div><div className="master-form-grid"><label className="field-full"><span>UID do Firebase *</span><input autoFocus value={userForm.uid ?? ""} onChange={(event) => setUserForm({ ...userForm, uid: event.target.value.trim() })} required readOnly={Boolean(editingUserId)} />{editingUserId && <small>O UID é imutável. Para trocar a identidade, inative este vínculo e crie outro.</small>}</label><label><span>Nome *</span><input value={userForm.name ?? ""} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required /></label><label><span>E-mail *</span><input type="email" value={userForm.email ?? ""} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required /></label><label><span>Empresa *</span><select value={userForm.tenantId ?? ""} onChange={(event) => setUserForm({ ...userForm, tenantId: event.target.value, roleId: "" })} required><option value="">Selecione</option>{data.tenants.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{tenantName(item)}</option>)}</select></label><label><span>Perfil *</span><select value={userForm.roleId ?? ""} onChange={(event) => setUserForm({ ...userForm, roleId: event.target.value })} required><option value="">Selecione</option>{availableRoles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label></div></div><footer><button type="button" className="catalog-modal-cancel" onClick={closeUserModal}>Cancelar</button><button className={`catalog-modal-submit catalog-modal-submit--${editingUserId ? "edit" : "create"}`} disabled={busy}>{editingUserId ? "Salvar alterações" : "Vincular acesso"}</button></footer></form></section></div>}

      {statusConfirmation && <div className="catalog-backdrop catalog-confirm-backdrop"><section className="catalog-modal catalog-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="platform-status-title"><header><div><span className="eyebrow">CONFIRMAÇÃO</span><h2 id="platform-status-title">{statusConfirmation.item.active ? "Confirmar inativação?" : "Confirmar ativação?"}</h2></div><button type="button" aria-label="Fechar" onClick={() => setStatusConfirmation(null)}>×</button></header><div className="master-modal-content"><p>{statusConfirmation.kind === "tenant" ? `O ambiente ${tenantName(statusConfirmation.item)} ${statusConfirmation.item.active ? "deixará de aceitar acessos" : "voltará a aceitar acessos"}. Cobranças e histórico financeiro serão preservados.` : `O acesso de ${statusConfirmation.item.name} será ${statusConfirmation.item.active ? "interrompido" : "restabelecido"}.`}</p></div><footer><button className="catalog-modal-cancel" onClick={() => setStatusConfirmation(null)}>Voltar</button><button className={statusConfirmation.item.active ? "danger" : "success"} onClick={() => void applyStatus()} disabled={busy}>{statusConfirmation.item.active ? "Inativar" : "Ativar"}</button></footer></section></div>}
      {busy && <AppLoading text="Atualizando administração..." />}
    </section>
  );
}
