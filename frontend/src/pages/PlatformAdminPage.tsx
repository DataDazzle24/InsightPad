import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { getDataConnect } from "firebase/data-connect";
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
import { useAuth } from "../auth/useAuth";
import { PlatformPermissions } from "../components/PlatformPermissions";

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
};
type Role = { id: string; tenantId: string; name: string; active: boolean };
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
  pages: Array<{
    id: string;
    pageKey: string;
    displayName: string;
    module: string;
  }>;
  permissions: Array<Record<string, unknown>>;
};
const empty: Workspace = {
    tenants: [],
    roles: [],
    users: [],
    pages: [],
    permissions: [],
  },
  dc = getDataConnect(firebaseApp, connectorConfig);

export function PlatformAdminPage() {
  const profile = useAuth().profile,
    isPlatform = profile?.role.name === "Administrador da Plataforma";
  const [data, setData] = useState<Workspace>(empty),
    [tab, setTab] = useState<"tenants" | "users" | "permissions">(
      isPlatform ? "tenants" : "users",
    ),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(true),
    [notice, setNotice] = useState<Notice | null>(null),
    [tenantModal, setTenantModal] = useState(false),
    [userModal, setUserModal] = useState(false),
    [tenantForm, setTenantForm] = useState<Record<string, string>>({
      planCode: "BRONZE",
    }),
    [userForm, setUserForm] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await platformAdminWorkspace(dc, {
          requestKey: crypto.randomUUID(),
        }),
        box =
          ((result.data._select ?? [])[0] as { data?: Workspace } | undefined)
            ?.data ?? empty;
      setData(box);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Não foi possível carregar a administração da plataforma.",
      });
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const q = search.trim().toLocaleLowerCase("pt-BR"),
    tenants = useMemo(
      () =>
        data.tenants.filter(
          (item) =>
            !q ||
            [item.legalName, item.tradeName, item.document, item.planCode].some(
              (value) => value?.toLocaleLowerCase("pt-BR").includes(q),
            ),
        ),
      [data.tenants, q],
    ),
    users = useMemo(
      () =>
        data.users.filter(
          (item) =>
            !q ||
            [
              item.name,
              item.email,
              item.tenantName,
              item.roleName,
              item.id,
            ].some((value) => value?.toLocaleLowerCase("pt-BR").includes(q)),
        ),
      [data.users, q],
    ),
    availableRoles = data.roles.filter(
      (role) => role.tenantId === userForm.tenantId && role.active,
    );
  async function createTenant(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createPlatformTenant(dc, { payload: tenantForm });
      if (!result.data._execute) throw new Error();
      setTenantModal(false);
      setTenantForm({ planCode: "BRONZE" });
      setNotice({
        type: "success",
        text: "Empresa e ambiente criados com sucesso.",
      });
      await load();
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Não foi possível criar o ambiente. Confira os dados e duplicidades.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function linkUser(event: FormEvent) {
    event.preventDefault();
    if (!userForm.uid || !userForm.tenantId || !userForm.roleId) {
      setNotice({
        type: "error",
        text: "Informe UID do Firebase, empresa e perfil.",
      });
      return;
    }
    setBusy(true);
    try {
      const result = await linkPlatformUser(dc, { payload: userForm });
      if (!result.data._execute) throw new Error();
      setUserModal(false);
      setUserForm({});
      setNotice({
        type: "success",
        text: "Usuário vinculado ao ambiente com sucesso.",
      });
      await load();
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        text: "Não foi possível vincular o usuário. Confira UID, empresa e perfil.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function tenantStatus(item: Tenant) {
    setBusy(true);
    try {
      await setPlatformTenantStatus(dc, {
        tenantId: item.id,
        active: !item.active,
      });
      setNotice({
        type: "success",
        text: `Empresa ${item.active ? "inativada" : "ativada"} com sucesso.`,
      });
      await load();
    } catch {
      setNotice({
        type: "error",
        text: "Não foi possível alterar o status da empresa.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function userStatus(item: PlatformUser) {
    setBusy(true);
    try {
      await setPlatformUserStatus(dc, {
        userId: item.id,
        active: !item.active,
      });
      setNotice({
        type: "success",
        text: `Usuário ${item.active ? "inativado" : "ativado"} com sucesso.`,
      });
      await load();
    } catch {
      setNotice({
        type: "error",
        text: "Não foi possível alterar o status do usuário.",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="platform-admin">
      <header>
        <div>
          <span className="eyebrow">DATA DAZZLE · CONTROL PLANE</span>
          <h1>
            {isPlatform ? "Administração da plataforma" : "Gestão de acessos"}
          </h1>
          <p>
            {isPlatform
              ? "Empresas, ambientes, assinaturas e vínculos de acesso do Insight Pad."
              : "Usuários, perfis e acessos do seu ambiente."}
          </p>
        </div>
        <div className="platform-kpis">
          <span>
            <b>{data.tenants.length}</b> empresas
          </span>
          <span>
            <b>{data.users.length}</b> usuários
          </span>
        </div>
      </header>
      <AppToast notice={notice} onClose={() => setNotice(null)} />
      <nav className="platform-tabs">
        {isPlatform && (
          <button
            className={tab === "tenants" ? "active" : ""}
            onClick={() => setTab("tenants")}
          >
            <span className="material-symbols-rounded">domain</span>Empresas e
            ambientes
          </button>
        )}
        <button
          className={tab === "users" ? "active" : ""}
          onClick={() => setTab("users")}
        >
          <span className="material-symbols-rounded">manage_accounts</span>
          Usuários
        </button>
        <button
          className={tab === "permissions" ? "active" : ""}
          onClick={() => setTab("permissions")}
        >
          <span className="material-symbols-rounded">lock_person</span>
          Perfis e permissões
        </button>
      </nav>
      {tab === "permissions" ? (
        <PlatformPermissions
          roles={data.roles}
          pages={data.pages}
          permissions={data.permissions}
          onNotice={setNotice}
          onSaved={load}
        />
      ) : (
      <div className="platform-panel">
        <div className="platform-toolbar">
          <label>
            <span className="material-symbols-rounded">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                tab === "tenants"
                  ? "Pesquisar empresa, documento ou plano"
                  : "Pesquisar usuário, e-mail, UID ou empresa"
              }
            />
          </label>
          <button
            className="catalog-primary"
            onClick={() => {
              if (tab === "tenants") setTenantModal(true);
              else {
                setUserForm({
                  tenantId: isPlatform ? "" : (data.tenants[0]?.id ?? ""),
                });
                setUserModal(true);
              }
            }}
          >
            <span className="material-symbols-rounded">add</span>
            {tab === "tenants" ? "Nova empresa" : "Vincular usuário"}
          </button>
        </div>
        <div className="platform-table">
          <table>
            <thead>
              {tab === "tenants" ? (
                <tr>
                  <th>Empresa</th>
                  <th>Documento</th>
                  <th>Plano</th>
                  <th>Usuários</th>
                  <th>Filiais</th>
                  <th>Vigência</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              ) : (
                <tr>
                  <th>Usuário</th>
                  <th>Empresa</th>
                  <th>Perfil</th>
                  <th>UID Firebase</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              )}
            </thead>
            <tbody>
              {tab === "tenants"
                ? tenants.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.tradeName || item.legalName}</strong>
                        <small>{item.email || "—"}</small>
                      </td>
                      <td>{item.document || "—"}</td>
                      <td>
                        <span className="plan-badge">
                          {item.planCode || "—"}
                        </span>
                      </td>
                      <td>{item.userCount}</td>
                      <td>{item.branchCount}</td>
                      <td>
                        {item.startsOn || "—"} →{" "}
                        {item.expiresOn || "Sem expiração"}
                      </td>
                      <td>
                        <span
                          className={`catalog-status catalog-status--${item.active ? "active" : "inactive"}`}
                        >
                          <i />
                          {item.active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={item.active ? "danger" : "success"}
                          onClick={() => void tenantStatus(item)}
                        >
                          {item.active ? "Inativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))
                : users.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <small>{item.email}</small>
                      </td>
                      <td>{item.tenantName}</td>
                      <td>{item.roleName}</td>
                      <td>
                        <code>{item.id}</code>
                      </td>
                      <td>
                        {item.lastLoginAt
                          ? new Date(item.lastLoginAt).toLocaleString("pt-BR")
                          : "Nunca"}
                      </td>
                      <td>
                        <span
                          className={`catalog-status catalog-status--${item.active ? "active" : "inactive"}`}
                        >
                          <i />
                          {item.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setUserForm({
                              uid: item.id,
                              name: item.name,
                              email: item.email,
                              tenantId: item.tenantId,
                              roleId: item.roleId,
                            });
                            setUserModal(true);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className={item.active ? "danger" : "success"}
                          onClick={() => void userStatus(item)}
                        >
                          {item.active ? "Inativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {isPlatform && tenantModal && (
        <div className="catalog-backdrop">
          <section className="catalog-modal platform-modal">
            <header>
              <div>
                <span className="eyebrow">NOVO AMBIENTE</span>
                <h2>Cadastrar empresa</h2>
              </div>
              <button onClick={() => setTenantModal(false)}>×</button>
            </header>
            <form onSubmit={createTenant}>
              <div className="platform-form">
                <label>
                  Razão social *
                  <input
                    value={tenantForm.legalName ?? ""}
                    onChange={(e) =>
                      setTenantForm({
                        ...tenantForm,
                        legalName: e.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Nome fantasia
                  <input
                    value={tenantForm.tradeName ?? ""}
                    onChange={(e) =>
                      setTenantForm({
                        ...tenantForm,
                        tradeName: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  CNPJ/CPF
                  <input
                    value={tenantForm.document ?? ""}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, document: e.target.value })
                    }
                    inputMode="numeric"
                  />
                </label>
                <label>
                  E-mail
                  <input
                    type="email"
                    value={tenantForm.email ?? ""}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Telefone
                  <input
                    value={tenantForm.phone ?? ""}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, phone: e.target.value })
                    }
                    inputMode="tel"
                  />
                </label>
                <label>
                  Plano
                  <select
                    value={tenantForm.planCode}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, planCode: e.target.value })
                    }
                  >
                    <option>BRONZE</option>
                    <option>PRATA</option>
                    <option>OURO</option>
                  </select>
                </label>
                <label>
                  Início
                  <input
                    type="date"
                    value={tenantForm.startsOn ?? ""}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, startsOn: e.target.value })
                    }
                  />
                </label>
                <label>
                  Expiração
                  <input
                    type="date"
                    value={tenantForm.expiresOn ?? ""}
                    onChange={(e) =>
                      setTenantForm({
                        ...tenantForm,
                        expiresOn: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <footer>
                <button type="button" onClick={() => setTenantModal(false)}>
                  Cancelar
                </button>
                <button className="catalog-primary">Criar ambiente</button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {userModal && (
        <div className="catalog-backdrop">
          <section className="catalog-modal platform-modal">
            <header>
              <div>
                <span className="eyebrow">ACESSO</span>
                <h2>Vincular usuário</h2>
              </div>
              <button onClick={() => setUserModal(false)}>×</button>
            </header>
            <form onSubmit={linkUser}>
              <div className="platform-form">
                <div className="platform-alert">
                  <span className="material-symbols-rounded">security</span>Crie
                  primeiro a identidade no Firebase Authentication e informe o
                  UID abaixo. Isso impede criação de credenciais administrativas
                  no navegador.
                </div>
                <label>
                  UID do Firebase *
                  <input
                    value={userForm.uid ?? ""}
                    onChange={(e) =>
                      setUserForm({ ...userForm, uid: e.target.value.trim() })
                    }
                    required
                  />
                </label>
                <label>
                  Nome *
                  <input
                    value={userForm.name ?? ""}
                    onChange={(e) =>
                      setUserForm({ ...userForm, name: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  E-mail *
                  <input
                    type="email"
                    value={userForm.email ?? ""}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Empresa *
                  <select
                    value={userForm.tenantId ?? ""}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        tenantId: e.target.value,
                        roleId: "",
                      })
                    }
                    required
                  >
                    <option value="">Selecione</option>
                    {data.tenants
                      .filter((item) => item.active)
                      .map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.tradeName || item.legalName}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Perfil *
                  <select
                    value={userForm.roleId ?? ""}
                    onChange={(e) =>
                      setUserForm({ ...userForm, roleId: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecione</option>
                    {availableRoles.map((role) => (
                      <option value={role.id} key={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <footer>
                <button type="button" onClick={() => setUserModal(false)}>
                  Cancelar
                </button>
                <button className="catalog-primary">Vincular acesso</button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {busy && <AppLoading text="Atualizando administração..." />}
    </section>
  );
}
