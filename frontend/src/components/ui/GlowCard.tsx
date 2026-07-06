import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function GlowCard({ children, className = '', onClick }: Props) {
  return (
    <div
      className={`cyber-card-wrap ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="cyber-card">
        {children}
      </div>
    </div>
  )
}
