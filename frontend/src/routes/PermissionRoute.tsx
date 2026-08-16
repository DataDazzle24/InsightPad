import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

interface PermissionRouteProps {
  pageKey: string
}

export function PermissionRoute({ pageKey }: PermissionRouteProps) {
  const { canAccess } = useAuth()

  if (!canAccess(pageKey)) {
    return <Navigate to="/acesso-negado" replace />
  }

  return <Outlet />
}
