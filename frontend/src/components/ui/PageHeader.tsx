import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ icon: Icon, title, subtitle, actions }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 border border-gold/30 bg-gold/5"
            style={{ clipPath: 'polygon(22% 0, 100% 0, 100% 78%, 78% 100%, 0 100%, 0 22%)' }}>
            <Icon size={18} className="text-gold" />
          </div>
          <div>
            <h2 className="font-orbitron text-sm font-bold text-gold tracking-widest flex items-center gap-2">
              {title}
              <span className="status-dot gold" />
            </h2>
            <p className="hud-readout mt-0.5">
              {subtitle ?? 'NPD // S.W.A.T — UNIDADE TÁTICA'}
            </p>
          </div>
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
      <div className="tactical-divider" />
    </div>
  )
}
