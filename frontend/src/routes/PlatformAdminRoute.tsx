import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function PlatformAdminRoute() {
  const { profile, status } = useAuth()
  const allowed = status === 'authenticated' && profile?.role.systemRole === true && profile.role.name === 'Administrador da Plataforma'
  return allowed ? <Outlet /> : <Navigate to="/acesso-negado" replace />
}
