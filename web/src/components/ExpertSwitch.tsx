import { motion } from 'framer-motion'

interface Props {
  on: boolean
  onChange: (v: boolean) => void
}

export function ExpertSwitch({ on, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Experten-Modus umschalten"
      onClick={() => onChange(!on)}
      className="group relative flex items-center gap-3"
    >
      <span className="hidden text-xs font-medium uppercase tracking-wide text-white/70 transition-colors group-hover:text-white sm:inline">
        Experten-Modus
      </span>
      <span
        className={`relative h-7 w-12 rounded-full border transition-colors duration-300 ${
          on
            ? 'border-white/40 bg-gradient-to-r from-indigo-400/80 to-fuchsia-400/80'
            : 'border-white/20 bg-white/10'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-lg shadow-black/30"
          style={{ left: on ? 'calc(100% - 1.625rem)' : '0.125rem' }}
        />
        <span
          className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
            on ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            boxShadow: '0 0 16px 2px rgba(168,85,247,0.45)',
          }}
        />
      </span>
    </button>
  )
}
