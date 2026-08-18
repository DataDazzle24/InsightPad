import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function PlatformAdminRoute() {
  const { profile } = useAuth()
  const allowed = profile?.role.systemRole === true && profile.role.name === 'Administrador da Plataforma'
  return allowed ? <Outlet /> : <Navigate to="/acesso-negado" replace />
}
