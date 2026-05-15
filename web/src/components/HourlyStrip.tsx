import { FusedHour } from '../types/forecast'
import { GlassCard } from './GlassCard'
import { formatHour, formatNumber, weatherCodeInfo } from '../utils/format'

interface Props {
  hours: FusedHour[]
  expert: boolean
}

export function HourlyStrip({ hours, expert }: Props) {
  const slice = hours.slice(0, 48)
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
          Nächste 48 Stunden
        </h2>
        <span className="text-[11px] text-white/40">scrollen →</span>
      </div>
      <div className="-mx-2 overflow-x-auto">
        <div className="flex gap-2 px-2">
          {slice.map((h, idx) => {
            const isNewDay =
              idx > 0 &&
              new Date(h.time).getDate() !== new Date(slice[idx - 1].time).getDate()
            return (
              <div key={h.time} className="flex items-stretch">
                {isNewDay && <DayBreak time={h.time} />}
                <HourCard hour={h} expert={expert} />
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}

function DayBreak({ time }: { time: number }) {
  const d = new Date(time)
  const label = d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })
  return (
    <div className="mx-2 flex w-[1px] items-center">
      <div
        className="relative h-full w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
        title={label}
      >
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest text-white/40">
          {label}
        </span>
      </div>
    </div>
  )
}

function HourCard({ hour, expert }: { hour: FusedHour; expert: boolean }) {
  const t = hour.temperature
  const p = hour.precipitation
  const code = weatherCodeInfo(hour.weatherCodeMode)
  const showPrecip = p && p.probability > 0.1
  return (
    <div className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] py-3">
      <div className="num text-[11px] text-white/60">{formatHour(hour.time)}</div>
      <div className="text-xl">{code.icon}</div>
      {t && (
        <>
          <div className="num text-base font-medium">{formatNumber(t.mean, 0)}°</div>
          {expert && (
            <div className="num text-[10px] text-white/40">±{formatNumber(t.stdDev, 1)}</div>
          )}
        </>
      )}
      {showPrecip ? (
        <div className="text-[10px] font-medium text-sky-300">
          {Math.round(p!.probability * 100)}%
        </div>
      ) : (
        <div className="text-[10px] text-white/30">—</div>
      )}
    </div>
  )
}
