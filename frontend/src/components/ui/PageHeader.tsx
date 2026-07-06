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
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-gold shrink-0" />
        <div>
          <h2 className="font-orbitron text-sm font-bold text-gold tracking-widest">{title}</h2>
          {subtitle && (
            <p className="font-mono text-[10px] text-txt3 tracking-wider mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
