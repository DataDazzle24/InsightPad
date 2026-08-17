import { useMemo, useState } from "react";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  setPlatformRolePermission,
} from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import type { Notice } from "./SalesUi";

type Role = { id: string; tenantId: string; name: string; active: boolean };
type Page = {
  id: string;
  pageKey: string;
  displayName: string;
  module: string;
};
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

export function PlatformPermissions({
  roles,
  pages,
  permissions,
  onNotice,
  onSaved,
}: {
  roles: Role[];
  pages: Page[];
  permissions: Array<Record<string, unknown>>;
  onNotice: (notice: Notice) => void;
  onSaved: () => Promise<void>;
}) {
  const [selectedRole, setSelectedRole] = useState(""),
    [saving, setSaving] = useState("");
  const normalized = useMemo(
    () =>
      permissions.map((item) => ({
        roleId: String(item.roleId),
        pageId: String(item.pageId),
        canAccess: Boolean(item.canAccess),
        canCreate: Boolean(item.canCreate),
        canUpdate: Boolean(item.canUpdate),
        canDelete: Boolean(item.canDelete),
        canExport: Boolean(item.canExport),
        canManage: Boolean(item.canManage),
      })),
    [permissions],
  );
  const roleId = roles.some((role) => role.id === selectedRole)
    ? selectedRole
    : (roles[0]?.id ?? "");
  const current = (pageId: string): Permission =>
    normalized.find(
      (item) => item.roleId === roleId && item.pageId === pageId,
    ) ?? {
      roleId,
      pageId,
      canAccess: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canExport: false,
      canManage: false,
    };
  async function toggle(page: Page, key: PermissionKey) {
    if (!roleId || saving) return;
    const before = current(page.id),
      value = !before[key],
      next = { ...before, [key]: value };
    if (key === "canAccess" && !value)
      Object.assign(next, {
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
        canManage: false,
      });
    if (key !== "canAccess" && value) next.canAccess = true;
    setSaving(`${page.id}:${key}`);
    try {
      await setPlatformRolePermission(dc, {
        payload: next,
      });
      await onSaved();
      onNotice({
        type: "success",
        text: `Permissões de ${page.displayName} atualizadas.`,
      });
    } catch (error) {
      console.error(error);
      onNotice({
        type: "error",
        text: "Não foi possível atualizar a permissão. Verifique seu nível de acesso.",
      });
    } finally {
      setSaving("");
    }
  }
  return (
    <div className="platform-panel permissions-panel">
      <div className="permissions-role">
        <label>
          Perfil administrado
          <select
            value={roleId}
            onChange={(event) => setSelectedRole(event.target.value)}
          >
            {roles
              .filter((role) => role.active)
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
          </select>
        </label>
        <p>
          O acesso é obrigatório para as demais ações. Alterações são aplicadas
          imediatamente.
        </p>
      </div>
      <div className="platform-table permissions-grid">
        <table>
          <thead>
            <tr>
              <th>Módulo / página</th>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const permission = current(page.id);
              return (
                <tr key={page.id}>
                  <td>
                    <strong>{page.displayName}</strong>
                    <small>
                      {page.module} · {page.pageKey}
                    </small>
                  </td>
                  {columns.map((column) => (
                    <td key={column.key}>
                      <input
                        aria-label={`${column.label} ${page.displayName}`}
                        type="checkbox"
                        checked={permission[column.key]}
                        disabled={!roleId || Boolean(saving)}
                        onChange={() => void toggle(page, column.key)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
