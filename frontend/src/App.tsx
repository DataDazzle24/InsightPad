import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { AppLayout } from './layout/AppLayout'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModuleMenuPage } from './pages/ModuleMenuPage'
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage'
import { appRoutes } from './config/pages'
import { PermissionRoute } from './routes/PermissionRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { PlatformAdminRoute } from './routes/PlatformAdminRoute'
import './App.css'

const CatalogPages = lazy(() => import('./pages/CatalogPages').then((module) => ({ default: module.CatalogPages })))
const MasterDataPage = lazy(() => import('./pages/MasterDataPage').then((module) => ({ default: module.MasterDataPage })))
const PointOfSalePage = lazy(() => import('./pages/PointOfSalePage').then((module) => ({ default: module.PointOfSalePage })))
const SalesManagementPage = lazy(() => import('./pages/SalesManagementPage').then((module) => ({ default: module.SalesManagementPage })))
const PlatformAdminPage = lazy(() => import('./pages/PlatformAdminPage').then((module) => ({ default: module.PlatformAdminPage })))

export default function App() {
  return (
   <AppErrorBoundary>
    <Suspense fallback={<div className="session-loader"><div className="brand-mark"><span>Insight Pad</span></div><p>Carregando módulo...</p></div>}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/acesso-negado" element={<AccessDeniedPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<PlatformAdminRoute />}><Route path="/plataforma/administracao" element={<PlatformAdminPage />} /></Route>
          <Route index element={<DashboardPage />} />
          <Route path="/modulos/vendas" element={<ModuleMenuPage moduleKey="vendas" />} />
          <Route path="/modulos/cadastros" element={<ModuleMenuPage moduleKey="cadastros" />} />
          <Route path="/modulos/dashboards" element={<ModuleMenuPage moduleKey="dashboards" />} />
          {appRoutes.map(({ pageKey, route }) => (
            <Route element={<PermissionRoute pageKey={pageKey} />} key={pageKey}>
              <Route path={route} element={pageKey === 'CAIXA' ? <PointOfSalePage /> : pageKey === 'GESTAO_VENDAS' ? <SalesManagementPage /> : pageKey === 'CAD_CATEGORIA' || pageKey === 'CAD_SUBCATEGORIA' ? <CatalogPages pageKey={pageKey} /> : pageKey === 'CAD_FILIAL' || pageKey === 'CAD_FORNECEDOR' || pageKey === 'CAD_CLIENTE' || pageKey === 'CAD_PRODUTO' ? <MasterDataPage pageKey={pageKey} /> : <ModulePlaceholderPage pageKey={pageKey} />} />
            </Route>
          ))}
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
   </AppErrorBoundary>
  )
}
