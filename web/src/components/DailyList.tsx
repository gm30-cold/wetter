import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FusedHour } from '../types/forecast'
import { GlassCard } from './GlassCard'
import { DisagreementBadge } from './DisagreementBadge'
import { formatDayLong, formatNumber, startOfDay, weatherCodeInfo } from '../utils/format'

interface Props {
  hours: FusedHour[]
  expert: boolean
}

interface DayAgg {
  date: number
  hours: FusedHour[]
}

interface DaypartAgg {
  key: 'morning' | 'afternoon' | 'evening' | 'night'
  label: string
  icon: string
  hours: FusedHour[]
}

function aggregate(hours: FusedHour[]): DayAgg[] {
  const map = new Map<number, FusedHour[]>()
  for (const h of hours) {
    const k = startOfDay(h.time)
    const arr = map.get(k) ?? []
    arr.push(h)
    map.set(k, arr)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([date, hs]) => ({ date, hours: hs }))
}

function dayparts(hours: FusedHour[]): DaypartAgg[] {
  const buckets: Record<DaypartAgg['key'], FusedHour[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  }
  for (const h of hours) {
    const hr = new Date(h.time).getHours()
    if (hr >= 6 && hr < 12) buckets.morning.push(h)
    else if (hr >= 12 && hr < 18) buckets.afternoon.push(h)
    else if (hr >= 18 && hr < 22) buckets.evening.push(h)
    else buckets.night.push(h)
  }
  return [
    { key: 'morning', label: 'Vormittag', icon: '🌅', hours: buckets.morning },
    { key: 'afternoon', label: 'Nachmittag', icon: '☀️', hours: buckets.afternoon },
    { key: 'evening', label: 'Abend', icon: '🌆', hours: buckets.evening },
    { key: 'night', label: 'Nacht', icon: '🌙', hours: buckets.night },
  ]
}

export function DailyList({ hours, expert }: Props) {
  const days = aggregate(hours).slice(0, 10)
  const [openDate, setOpenDate] = useState<number | null>(null)
  return (
    <GlassCard className="p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
        10-Tage-Übersicht
      </h2>
      <p className="mb-3 text-[11px] text-white/50">Tippe einen Tag für den Verlauf.</p>
      <div className="space-y-1">
        {days.map((d, i) => (
          <DayRow
            key={d.date}
            day={d}
            expert={expert}
            isLast={i === days.length - 1}
            open={openDate === d.date}
            onToggle={() => setOpenDate(openDate === d.date ? null : d.date)}
          />
        ))}
      </div>
    </GlassCard>
  )
}

function DayRow({
  day,
  expert,
  isLast,
  open,
  onToggle,
}: {
  day: DayAgg
  expert: boolean
  isLast: boolean
  open: boolean
  onToggle: () => void
}) {
  const temps = day.hours.map((h) => h.temperature?.mean).filter((v): v is number => v != null)
  const stds = day.hours.map((h) => h.temperature?.stdDev).filter((v): v is number => v != null)
  const tMax = temps.length ? Math.max(...temps) : null
  const tMin = temps.length ? Math.min(...temps) : null
  const avgStd = stds.length ? stds.reduce((a, b) => a + b, 0) / stds.length : 0
  const disagreement = avgStd < 1.0 ? 'low' : avgStd < 2.5 ? 'medium' : 'high'

  const precipTotal = day.hours.map((h) => h.precipitation?.meanMM ?? 0).reduce((a, b) => a + b, 0)
  const precipProbMax = Math.max(0, ...day.hours.map((h) => h.precipitation?.probability ?? 0))

  const noonHour =
    day.hours.find((h) => new Date(h.time).getHours() === 13) ??
    day.hours[Math.floor(day.hours.length / 2)]
  const code = weatherCodeInfo(noonHour?.weatherCodeMode)

  return (
    <div className={!isLast || open ? 'border-b border-white/5' : ''}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span
          className={`shrink-0 text-[10px] text-white/35 transition-transform ${
            open ? 'rotate-90' : ''
          }`}
        >
          ▶
        </span>
        <div className="w-[88px] shrink-0 truncate text-sm">{formatDayLong(day.date)}</div>
        <div className="w-6 shrink-0 text-center text-lg">{code.icon}</div>
        <div className="num w-12 shrink-0 text-[11px] text-sky-300">
          {precipProbMax > 0.1 && <span>{Math.round(precipProbMax * 100)}%</span>}
          {precipTotal > 0.2 && (
            <div className="num text-[10px] text-white/50">{formatNumber(precipTotal, 1)} mm</div>
          )}
        </div>
        <div className="num flex items-baseline gap-1 text-sm">
          {tMin != null && tMax != null ? (
            <>
              <span className="text-white/50">{formatNumber(tMin, 0)}°</span>
              <span className="text-white/25">–</span>
              <span className="font-medium">{formatNumber(tMax, 0)}°</span>
            </>
          ) : (
            '—'
          )}
        </div>
        {expert && (
          <div className="ml-auto shrink-0">
            <DisagreementBadge level={disagreement} />
          </div>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <DayDetails day={day} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DayDetails({ day }: { day: DayAgg }) {
  const parts = dayparts(day.hours).filter((p) => p.hours.length > 0)
  return (
    <div className="grid gap-2 px-2 pb-3 pt-1 sm:grid-cols-2">
      {parts.map((part) => {
        const temps = part.hours.map((h) => h.temperature?.mean).filter((v): v is number => v != null)
        const tAvg = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null
        const tMin = temps.length ? Math.min(...temps) : null
        const tMax = temps.length ? Math.max(...temps) : null

        const precip = part.hours.reduce((a, h) => a + (h.precipitation?.meanMM ?? 0), 0)
        const precipProb = Math.max(0, ...part.hours.map((h) => h.precipitation?.probability ?? 0))

        const wind = part.hours.map((h) => h.windSpeed?.mean).filter((v): v is number => v != null)
        const gust = part.hours.map((h) => h.windGust?.mean).filter((v): v is number => v != null)
        const windAvg = wind.length ? wind.reduce((a, b) => a + b, 0) / wind.length : null
        const gustMax = gust.length ? Math.max(...gust) : null

        const clouds = part.hours
          .map((h) => h.cloudCover?.mean)
          .filter((v): v is number => v != null)
        const cloudAvg = clouds.length ? clouds.reduce((a, b) => a + b, 0) / clouds.length : null

        const codes = part.hours
          .map((h) => h.weatherCodeMode)
          .filter((v): v is number => v != null)
        const codeMode = mode(codes)
        const codeInfo = weatherCodeInfo(codeMode)

        const uv = part.hours.map((h) => h.uvIndex?.mean).filter((v): v is number => v != null)
        const uvMax = uv.length ? Math.max(...uv) : null

        return (
          <div
            key={part.key}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{part.icon}</span>
                <span className="text-xs font-medium text-white/85">{part.label}</span>
              </div>
              <span className="text-xs text-white/60">{codeInfo.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="num text-2xl font-light">
                {tAvg != null ? `${formatNumber(tAvg, 0)}°` : '—'}
              </span>
              <span className="num text-[11px] text-white/45">
                {tMin != null && tMax != null
                  ? `${formatNumber(tMin, 0)}° / ${formatNumber(tMax, 0)}°`
                  : ''}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-white/65">
              {precipProb > 0.05 && (
                <div className="flex items-center gap-1">
                  <span>🌧️</span>
                  <span className="num">
                    {Math.round(precipProb * 100)}% · {formatNumber(precip, 1)} mm
                  </span>
                </div>
              )}
              {windAvg != null && (
                <div className="flex items-center gap-1">
                  <span>🌬️</span>
                  <span className="num">
                    {formatNumber(windAvg, 0)}
                    {gustMax ? `·${formatNumber(gustMax, 0)}` : ''} km/h
                  </span>
                </div>
              )}
              {cloudAvg != null && (
                <div className="flex items-center gap-1">
                  <span>☁️</span>
                  <span className="num">{formatNumber(cloudAvg, 0)}%</span>
                </div>
              )}
              {uvMax != null && uvMax >= 1 && (
                <div className="flex items-center gap-1">
                  <span>☀️</span>
                  <span className="num">UV {formatNumber(uvMax, 1)}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function mode(vals: number[]): number | undefined {
  if (vals.length === 0) return undefined
  const counts = new Map<number, number>()
  for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best = vals[0]
  let bestCount = -1
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v
      bestCount = c
    }
  }
  return best
}
