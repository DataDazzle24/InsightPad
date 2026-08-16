import { Navigate, Route, Routes } from 'react-router-dom'
import { AccessDeniedPage } from './pages/AccessDeniedPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/acesso-negado" element={<AccessDeniedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
