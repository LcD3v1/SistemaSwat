import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import type { Nivel } from '@/types'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/components/sections/LoginPage'
import DashboardPage from '@/components/sections/DashboardPage'
import RegistrarAcaoPage from '@/components/sections/RegistrarAcaoPage'
import HistoricoPage from '@/components/sections/HistoricoPage'
import EstatisticasPage from '@/components/sections/EstatisticasPage'
import RecrutamentoPage from '@/components/sections/RecrutamentoPage'
import RecrutaCandidatoPage from '@/components/sections/RecrutaCandidatoPage'
import MembrosPage from '@/components/sections/MembrosPage'
import ConfiguracoesPage from '@/components/sections/ConfiguracoesPage'

export const RANK: Record<Nivel, number> = { view_only: -1, membro: 0, moderador: 1, admin: 2 }

interface ProtectedRouteProps {
  children: React.ReactNode
  minNivel?: Nivel
  allowViewOnly?: boolean
}

function ProtectedRoute({ children, minNivel = 'membro', allowViewOnly = false }: ProtectedRouteProps) {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />

  if (user.nivel === 'view_only') {
    return allowViewOnly ? <>{children}</> : <Navigate to="/estatisticas" replace />
  }

  if (RANK[user.nivel] < RANK[minNivel]) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  if (token) return <Navigate to={user?.nivel === 'view_only' ? '/estatisticas' : '/dashboard'} replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user } = useAuthStore()
  return <Navigate to={user?.nivel === 'view_only' ? '/estatisticas' : '/dashboard'} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute allowViewOnly={true}><AppShell /></ProtectedRoute>
          }>
            <Route index element={<RootRedirect />} />
            <Route path="dashboard" element={
              <ProtectedRoute allowViewOnly={false}><DashboardPage /></ProtectedRoute>
            } />
            <Route path="acoes/nova" element={
              <ProtectedRoute minNivel="membro"><RegistrarAcaoPage /></ProtectedRoute>
            } />
            <Route path="acoes/historico" element={
              <ProtectedRoute allowViewOnly={false}><HistoricoPage /></ProtectedRoute>
            } />
            <Route path="estatisticas" element={<EstatisticasPage />} />
            <Route path="recrutamento" element={
              <ProtectedRoute minNivel="membro"><RecrutamentoPage /></ProtectedRoute>
            } />
            <Route path="recrutamento/:id" element={
              <ProtectedRoute minNivel="membro"><RecrutaCandidatoPage /></ProtectedRoute>
            } />
            <Route path="membros" element={<MembrosPage />} />
            <Route path="configuracoes" element={
              <ProtectedRoute minNivel="moderador"><ConfiguracoesPage /></ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
