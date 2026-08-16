import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
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
          {appRoutes.map(({ pageKey, route }) => (
            <Route element={<PermissionRoute pageKey={pageKey} />} key={pageKey}>
              <Route path={route} element={<ModulePlaceholderPage pageKey={pageKey} />} />
            </Route>
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
