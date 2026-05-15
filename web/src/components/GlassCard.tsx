import { ReactNode } from 'react'

type Variant = 'subtle' | 'default' | 'strong'

interface Props {
  children?: ReactNode
  variant?: Variant
  className?: string
  onClick?: () => void
}

export function GlassCard({ children, variant = 'default', className = '', onClick }: Props) {
  const base =
    variant === 'subtle' ? 'glass-subtle' : variant === 'strong' ? 'glass-strong' : 'glass'
  return (
    <div
      onClick={onClick}
      className={`relative rounded-3xl ${base} overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {children}
    </div>
  )
}
