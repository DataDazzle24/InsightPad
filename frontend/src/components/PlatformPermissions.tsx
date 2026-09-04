import { useMemo, useState } from "react";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, setPlatformRolePermission } from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import type { Notice } from "./SalesUi";

type Role = { id: string; tenantId: string; tenantName: string; name: string; active: boolean };
type Page = { id: string; pageKey: string; displayName: string; module: string };
type Permission = {
  roleId: string;
  pageId: string;
  canAccess: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManage: boolean;
};
type PermissionKey = Exclude<keyof Permission, "roleId" | "pageId">;
const dc = getDataConnect(firebaseApp, connectorConfig);
const columns: Array<{ key: PermissionKey; label: string }> = [
  { key: "canAccess", label: "Acessar" },
  { key: "canCreate", label: "Criar" },
  { key: "canUpdate", label: "Editar" },
  { key: "canDelete", label: "Excluir" },
  { key: "canExport", label: "Exportar" },
  { key: "canManage", label: "Gerenciar" },
];

export function PlatformPermissions({ roles, pages, permissions, onNotice, onSaved }: {
  roles: Role[];
  pages: Page[];
  permissions: Array<Record<string, unknown>>;
  onNotice: (notice: Notice) => void;
  onSaved: () => Promise<void>;
}) {
  const [selectedRole, setSelectedRole] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState("");
  const activeRoles = useMemo(() => roles.filter((role) => role.active), [roles]);
  const roleId = activeRoles.some((role) => role.id === selectedRole) ? selectedRole : (activeRoles[0]?.id ?? "");
  const selected = activeRoles.find((role) => role.id === roleId);
  const visiblePages = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return pages.filter((page) => !term || [page.displayName, page.module, page.pageKey].some((value) => value.toLocaleLowerCase("pt-BR").includes(term)));
  }, [pages, search]);
  const normalized = useMemo(() => permissions.map((item) => ({
    roleId: String(item.roleId),
    pageId: String(item.pageId),
    canAccess: Boolean(item.canAccess),
    canCreate: Boolean(item.canCreate),
    canUpdate: Boolean(item.canUpdate),
    canDelete: Boolean(item.canDelete),
    canExport: Boolean(item.canExport),
    canManage: Boolean(item.canManage),
  })), [permissions]);
  const current = (pageId: string): Permission => normalized.find((item) => item.roleId === roleId && item.pageId === pageId) ?? {
    roleId, pageId, canAccess: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false, canManage: false,
  };

  async function toggle(page: Page, key: PermissionKey) {
    if (!roleId || saving) return;
    const before = current(page.id);
    const next = { ...before, [key]: !before[key] };
    if (key === "canAccess" && !next.canAccess) Object.assign(next, { canCreate: false, canUpdate: false, canDelete: false, canExport: false, canManage: false });
    if (key !== "canAccess" && next[key]) next.canAccess = true;
    setSaving(`${page.id}:${key}`);
    try {
      const result = await setPlatformRolePermission(dc, { payload: next });
      if (!(result.data as { _execute?: unknown })._execute) throw new Error("Operação não aplicada");
      await onSaved();
      onNotice({ type: "success", text: `Permissões de ${page.displayName} atualizadas para ${selected?.name ?? "o perfil"}.` });
    } catch (error) {
      console.error(error);
      onNotice({ type: "error", text: "Não foi possível atualizar a permissão. Recarregue os dados e tente novamente." });
    } finally {
      setSaving("");
    }
  }

  return <div className="platform-panel permissions-panel">
    <div className="permissions-toolbar">
      <label><span>Empresa e perfil</span><select value={roleId} onChange={(event) => setSelectedRole(event.target.value)}>{activeRoles.map((role) => <option key={role.id} value={role.id}>{role.tenantName} · {role.name}</option>)}</select></label>
      <label className="platform-search"><span className="material-symbols-rounded">search</span><span className="sr-only">Pesquisar página ou módulo</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar página, módulo ou chave" /></label>
      <div className="platform-alert"><span className="material-symbols-rounded">shield_lock</span>O acesso é obrigatório para as demais ações. Cada alteração é aplicada e auditada imediatamente.</div>
    </div>
    <div className="platform-table permissions-grid"><table><thead><tr><th>Módulo / página</th>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
      {visiblePages.map((page) => { const permission = current(page.id); return <tr key={page.id}><td><strong>{page.displayName}</strong><small>{page.module} · {page.pageKey}</small></td>{columns.map((column) => <td key={column.key}><input aria-label={`${column.label} ${page.displayName}`} type="checkbox" checked={permission[column.key]} disabled={!roleId || Boolean(saving)} onChange={() => void toggle(page, column.key)} /></td>)}</tr>; })}
      {!visiblePages.length && <tr><td colSpan={7}><div className="platform-empty compact"><span className="material-symbols-rounded">search_off</span><strong>Nenhuma página encontrada</strong></div></td></tr>}
    </tbody></table></div>
  </div>;
}
