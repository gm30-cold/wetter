import { ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkline } from './Sparkline'

interface Props {
  label: string
  value: string
  hint?: string
  gradient: string
  icon?: ReactNode
  series?: number[]
  times?: number[]
  unit?: string
  seriesGradient?: [string, string]
  currentIndex?: number
  expandable?: boolean
  extraDetail?: ReactNode
  yDigits?: number
}

export function MetricTile({
  label,
  value,
  hint,
  gradient,
  icon,
  series,
  times,
  unit = '',
  seriesGradient,
  currentIndex,
  expandable = true,
  extraDetail,
  yDigits = 1,
}: Props) {
  const [open, setOpen] = useState(false)
  const canExpand = expandable && ((series && series.length > 1) || !!extraDetail)
  return (
    <button
      type="button"
      onClick={() => canExpand && setOpen((v) => !v)}
      disabled={!canExpand}
      className={`relative col-span-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-left transition-all ${
        canExpand ? 'hover:border-white/20 active:scale-[0.98]' : ''
      } ${open ? 'sm:col-span-2' : ''}`}
    >
      <div
        className={`absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-xl`}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-1">
          <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
          {canExpand && (
            <span
              className={`text-[10px] text-white/35 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            >
              ▾
            </span>
          )}
        </div>
        <div className="num mt-0.5 flex items-baseline gap-1.5 text-base font-medium">
          {value}
          {icon && <span className="text-sm text-white/60">{icon}</span>}
        </div>
        {hint && <div className="num mt-0.5 text-[10px] text-white/45">{hint}</div>}

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              {extraDetail && (
                <div className="mt-3 text-xs text-white/70">{extraDetail}</div>
              )}
              {series && series.length > 1 && (
                <div className="mt-3">
                  <Sparkline
                    values={series}
                    times={times}
                    gradient={seriesGradient ?? ['#7dd3fc', '#a855f7']}
                    unit={unit}
                    current={currentIndex}
                    yDigits={yDigits}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  )
}
