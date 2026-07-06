import { LogOut, Menu, Eye } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useLogo } from '@/hooks/useConfig'
import RoleBadge from '@/components/ui/RoleBadge'

function HudStatus() {
  return (
    <div className="hidden md:flex items-center gap-1.5">
      <span className="status-dot" />
      <span className="hud-readout">SISTEMA ONLINE</span>
    </div>
  )
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':        'DASHBOARD',
  '/acoes/nova':       'REGISTRAR AÇÃO',
  '/acoes/historico':  'HISTÓRICO DE OPERAÇÕES',
  '/estatisticas':     'ESTATÍSTICAS',
  '/recrutamento':     'RECRUTAMENTO',
  '/membros':          'MEMBROS DA UNIDADE',
  '/configuracoes':    'CONFIGURAÇÕES',
}

export default function Topbar() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'SISTEMA SWAT'

  const { data: logoData } = useLogo()
  const isViewOnly = user?.nivel === 'view_only'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-sb/90 backdrop-blur-sm border-b border-gold/15 flex items-center px-4 gap-3 shrink-0">
      <button
        onClick={toggleSidebar}
        className="text-txt2 hover:text-gold transition-colors p-1"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Logo miniatura */}
      <div className="logo-ring" style={{ width: 32, height: 32, border: '2px solid var(--gold)' }}>
        {logoData?.logo ? (
          <img src={logoData.logo} alt="Logo SWAT" className="logo-circle" />
        ) : (
          <span className="logo-fallback" style={{ fontSize: 7, letterSpacing: 0 }}>
            PMC<br />SWAT
          </span>
        )}
      </div>

      <h1 className="font-orbitron text-sm font-bold text-gold tracking-widest">
        {title}
      </h1>

      <div className="flex-1 flex justify-center">
        <HudStatus />
      </div>

      {/* Badge view only — visível e permanente */}
      {isViewOnly && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded border border-bdr2 bg-bdr font-mono text-[10px] text-txt2 tracking-widest">
          <Eye size={11} className="text-txt3" />
          SOMENTE LEITURA
        </div>
      )}

      {user && (
        <div className="flex items-center gap-3">
          <RoleBadge nivel={user.nivel} />
          <span className="text-txt2 text-sm font-mono">{user.username}</span>
          <button
            onClick={handleLogout}
            className="text-txt3 hover:text-red transition-colors p-1"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </header>
  )
}
