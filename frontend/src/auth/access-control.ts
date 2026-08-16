import type { GetCurrentUserAccessData } from '@insightpad/dataconnect'

type AccessUser = NonNullable<GetCurrentUserAccessData['user']>
type RolePermission = AccessUser['role']['rolePagePermissions_on_role'][number]
type UserPermission = AccessUser['userPagePermissions_on_user'][number]

export interface PagePermission {
  page: RolePermission['page']
  canAccess: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canExport: boolean
  canManage: boolean
}

export type PermissionMap = Record<string, PagePermission>

function normalize(permission: RolePermission | UserPermission): PagePermission {
  return {
    page: permission.page,
    canAccess: permission.canAccess,
    canCreate: permission.canCreate,
    canUpdate: permission.canUpdate,
    canDelete: permission.canDelete,
    canExport: permission.canExport,
    canManage: permission.canManage,
  }
}

export function resolvePermissions(accessUser: AccessUser): PermissionMap {
  const resolved: PermissionMap = {}

  for (const permission of accessUser.role.rolePagePermissions_on_role) {
    if (permission.page.active) {
      resolved[permission.page.pageKey] = normalize(permission)
    }
  }

  // A configuração individual é uma exceção explícita e prevalece
  // integralmente sobre a configuração herdada do perfil.
  for (const permission of accessUser.userPagePermissions_on_user) {
    if (permission.page.active) {
      resolved[permission.page.pageKey] = normalize(permission)
    }
  }

  return resolved
}
