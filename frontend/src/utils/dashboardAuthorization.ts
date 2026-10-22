import { useAuth } from '../auth/useAuth'
// RELATORIOS_OPERACIONAIS is the route permission for every dashboard tab.
export function useDashboardExport(){
 const {permissions}=useAuth()
 return permissions.RELATORIOS_OPERACIONAIS?.canAccess===true && permissions.RELATORIOS_OPERACIONAIS?.canExport===true
}
