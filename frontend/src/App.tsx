import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModuleMenuPage } from './pages/ModuleMenuPage'
import { CatalogPages } from './pages/CatalogPages'
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage'
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
          <Route path="/modulos/vendas" element={<ModuleMenuPage moduleKey="vendas" />} />
          <Route path="/modulos/cadastros" element={<ModuleMenuPage moduleKey="cadastros" />} />
          <Route path="/modulos/dashboards" element={<ModuleMenuPage moduleKey="dashboards" />} />
          {appRoutes.map(({ pageKey, route }) => (
            <Route element={<PermissionRoute pageKey={pageKey} />} key={pageKey}>
              <Route path={route} element={pageKey === 'CAD_CATEGORIA' || pageKey === 'CAD_SUBCATEGORIA' ? <CatalogPages pageKey={pageKey} /> : <ModulePlaceholderPage pageKey={pageKey} />} />
            </Route>
          ))}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
