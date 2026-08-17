import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function PlatformAdminRoute() {
  const { profile } = useAuth()
  const allowed = profile?.role.systemRole === true && ['Administrador da Plataforma','Administrador'].includes(profile.role.name)
  return allowed ? <Outlet /> : <Navigate to="/acesso-negado" replace />
}
