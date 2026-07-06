import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { staggerItem } from '@/lib/motion'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  index?: number
  interactive?: boolean
}

export default function GlowCard({ children, className = '', onClick, index, interactive }: Props) {
  const isInteractive = interactive ?? Boolean(onClick)

  return (
    <motion.div
      className={`cyber-card-wrap ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      whileHover={isInteractive ? { y: -2 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      variants={index !== undefined ? staggerItem : undefined}
    >
      <div className="cyber-card">
        <span className="card-hud" aria-hidden="true" />
        {children}
      </div>
    </motion.div>
  )
}
