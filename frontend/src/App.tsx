import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { BusinessModulePage } from './pages/BusinessModulePage'
import { LegacyModuleMenuPage } from './pages/LegacyModuleMenuPage'
import { appRoutes } from './config/pages'
import { PermissionRoute } from './routes/PermissionRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/acesso-negado" element={<AccessDeniedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/menu/vendas" element={<LegacyModuleMenuPage type="vendas" />} />
          <Route path="/menu/cadastros" element={<LegacyModuleMenuPage type="cadastros" />} />
          <Route path="/menu/dashboards" element={<LegacyModuleMenuPage type="dashboards" />} />
          {appRoutes.map(({ pageKey, route }) => (
            <Route element={<PermissionRoute pageKey={pageKey} />} key={pageKey}>
              <Route path={route} element={<BusinessModulePage pageKey={pageKey} />} />
            </Route>
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
