import { motion } from 'framer-motion'

interface Props {
  label: string
  min: number
  max: number
  mean: number
  unit: string
  confidence: number
  confidenceLabel?: string
  gradient?: [string, string]
  digits?: number
}

export function AggregateBar({
  label,
  min,
  max,
  mean,
  unit,
  confidence,
  confidenceLabel,
  gradient = ['#7dd3fc', '#a855f7'],
  digits = 1,
}: Props) {
  const span = Math.max(max - min, 0.01)
  const meanPct = ((mean - min) / span) * 100
  const confPct = Math.round(confidence * 100)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/70">{label}</span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="num text-white/50">{confidenceLabel ?? 'Sicherheit'}</span>
          <span className={`num font-medium ${confColor(confPct)}`}>{confPct}%</span>
        </div>
      </div>

      <div className="relative h-7 rounded-full">
        <div
          className="absolute inset-y-2 w-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
            opacity: 0.35,
          }}
        />
        <div
          className="absolute inset-y-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
            left: `${Math.max(0, meanPct - confPct / 2)}%`,
            width: `${Math.min(100, confPct)}%`,
            opacity: 0.55,
            filter: 'blur(0.3px)',
          }}
        />
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${meanPct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/95 shadow-lg shadow-black/40"
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between text-[11px]">
        <span className="num flex flex-col text-white/60">
          <span className="text-[9px] uppercase tracking-wider text-white/40">min</span>
          <span>
            {min.toFixed(digits)}
            {unit}
          </span>
        </span>
        <span className="num flex flex-col items-center text-white">
          <span className="text-[9px] uppercase tracking-wider text-white/55">Mittel</span>
          <span className="font-medium">
            {mean.toFixed(digits)}
            {unit}
          </span>
        </span>
        <span className="num flex flex-col items-end text-white/60">
          <span className="text-[9px] uppercase tracking-wider text-white/40">max</span>
          <span>
            {max.toFixed(digits)}
            {unit}
          </span>
        </span>
      </div>
    </div>
  )
}

function confColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-300'
  if (pct >= 55) return 'text-amber-300'
  return 'text-rose-300'
}
