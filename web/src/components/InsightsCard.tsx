import { motion } from 'framer-motion'
import { FusedHour } from '../types/forecast'
import { GlassCard } from './GlassCard'
import { MetricTile } from './MetricTile'
import { formatNumber } from '../utils/format'

interface Props {
  now: FusedHour
  next48: FusedHour[]
  nowIndex: number
}

export function InsightsCard({ now, next48, nowIndex }: Props) {
  const insights = deriveInsights(now, next48.slice(0, 24))
  const times = next48.map((h) => h.time)

  const series = (k: keyof FusedHour, transform: (v: number) => number = (v) => v): number[] =>
    next48.map((h) => {
      const f = h[k]
      if (
        typeof f === 'object' &&
        f !== null &&
        'mean' in (f as object) &&
        typeof (f as { mean: number }).mean === 'number'
      ) {
        return transform((f as { mean: number }).mean)
      }
      return 0
    })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard className="p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
          Erweiterte Indikatoren
        </h2>
        <p className="mb-4 text-[11px] text-white/50">
          Atmosphäre, Boden, Sicht — tippe eine Kachel für den 48-h-Verlauf.
        </p>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {now.uvIndex && (
            <MetricTile
              label="UV-Index"
              value={formatNumber(now.uvIndex.mean, 1)}
              hint={uvHint(now.uvIndex.mean)}
              gradient="from-amber-400 to-rose-500"
              series={series('uvIndex')}
              times={times}
              seriesGradient={['#fcd34d', '#f43f5e']}
              currentIndex={nowIndex}
              yDigits={1}
            />
          )}
          {now.dewPoint && (
            <MetricTile
              label="Taupunkt"
              value={`${formatNumber(now.dewPoint.mean, 1)}°`}
              hint={dewPointHint(now.dewPoint.mean, now.temperature?.mean)}
              gradient="from-cyan-400 to-blue-500"
              series={series('dewPoint')}
              times={times}
              seriesGradient={['#67e8f9', '#3b82f6']}
              currentIndex={nowIndex}
              unit="°"
              yDigits={1}
            />
          )}
          {now.soilMoisture && (
            <MetricTile
              label="Bodenfeuchte"
              value={`${formatNumber(now.soilMoisture.mean * 100, 0)}%`}
              hint={soilMoistureHint(now.soilMoisture.mean)}
              gradient="from-amber-700 to-emerald-600"
              series={series('soilMoisture', (v) => v * 100)}
              times={times}
              seriesGradient={['#fbbf24', '#10b981']}
              currentIndex={nowIndex}
              unit="%"
              yDigits={0}
            />
          )}
          {now.soilTemperature && (
            <MetricTile
              label="Bodentemp."
              value={`${formatNumber(now.soilTemperature.mean, 1)}°`}
              hint={soilTempHint(now.soilTemperature.mean)}
              gradient="from-orange-400 to-amber-600"
              series={series('soilTemperature')}
              times={times}
              seriesGradient={['#fb923c', '#d97706']}
              currentIndex={nowIndex}
              unit="°"
              yDigits={1}
            />
          )}
          {now.pressure && (
            <MetricTile
              label="Luftdruck"
              value={`${formatNumber(now.pressure.mean, 0)} hPa`}
              hint={pressureTrendHint(now.pressure.mean, next48)}
              gradient="from-indigo-400 to-purple-500"
              series={series('pressure')}
              times={times}
              seriesGradient={['#a5b4fc', '#a855f7']}
              currentIndex={nowIndex}
              unit=" hPa"
              yDigits={0}
            />
          )}
          {now.visibility && (
            <MetricTile
              label="Sichtweite"
              value={`${formatNumber(now.visibility.mean / 1000, 1)} km`}
              hint={visibilityHint(now.visibility.mean)}
              gradient="from-sky-400 to-cyan-500"
              series={series('visibility', (v) => v / 1000)}
              times={times}
              seriesGradient={['#7dd3fc', '#06b6d4']}
              currentIndex={nowIndex}
              unit=" km"
              yDigits={1}
            />
          )}
          {now.evapotranspiration && (
            <MetricTile
              label="Verdunstung"
              value={`${formatNumber(now.evapotranspiration.mean, 2)} mm`}
              hint="ET₀ · Bewässerungsbedarf"
              gradient="from-teal-400 to-emerald-500"
              series={series('evapotranspiration')}
              times={times}
              seriesGradient={['#5eead4', '#10b981']}
              currentIndex={nowIndex}
              unit=" mm"
              yDigits={2}
            />
          )}
        </div>

        {insights.length > 0 && (
          <div className="mt-5 space-y-1.5">
            <h3 className="text-[10px] uppercase tracking-wider text-white/50">
              Hinweise für die nächsten 24 h
            </h3>
            {insights.map((ins, i) => (
              <motion.div
                key={ins.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 ${ins.style}`}
              >
                <span className="text-base leading-none">{ins.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium">{ins.label}</div>
                  <div className="text-[11px] opacity-80">{ins.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}

interface Insight {
  label: string
  detail: string
  icon: string
  style: string
}

function deriveInsights(now: FusedHour, next24: FusedHour[]): Insight[] {
  const result: Insight[] = []

  const minTemp = Math.min(...next24.map((h) => h.temperature?.mean ?? 99))
  if (minTemp <= 0) {
    result.push({
      label: 'Frost-Risiko',
      detail: `Minimum ${formatNumber(minTemp, 1)}° — empfindliche Pflanzen schützen.`,
      icon: '❄️',
      style: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
    })
  } else if (minTemp <= 4) {
    result.push({
      label: 'Bodenfrost möglich',
      detail: `Tiefstwert ${formatNumber(minTemp, 1)}° — vor allem nachts.`,
      icon: '🌡️',
      style: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
    })
  }

  const maxUv = Math.max(...next24.map((h) => h.uvIndex?.mean ?? 0))
  if (maxUv >= 6) {
    result.push({
      label: 'Hoher UV-Index',
      detail: `Spitze ${formatNumber(maxUv, 1)} — Sonnenschutz tagsüber.`,
      icon: '☀️',
      style: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
    })
  }

  const maxGust = Math.max(...next24.map((h) => h.windGust?.mean ?? 0))
  if (maxGust >= 60) {
    result.push({
      label: 'Sturm-Böen erwartet',
      detail: `Spitzen bis ${formatNumber(maxGust, 0)} km/h.`,
      icon: '💨',
      style: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
    })
  } else if (maxGust >= 40) {
    result.push({
      label: 'Kräftiger Wind',
      detail: `Böen bis ${formatNumber(maxGust, 0)} km/h.`,
      icon: '🌬️',
      style: 'border-orange-300/30 bg-orange-400/10 text-orange-100',
    })
  }

  const totalRain = next24.reduce((s, h) => s + (h.precipitation?.meanMM ?? 0), 0)
  if (totalRain >= 15) {
    result.push({
      label: 'Viel Niederschlag',
      detail: `~${formatNumber(totalRain, 0)} mm in 24 h.`,
      icon: '🌧️',
      style: 'border-blue-300/30 bg-blue-400/10 text-blue-100',
    })
  }

  const sm = now.soilMoisture?.mean
  if (sm != null && sm < 0.15 && totalRain < 2) {
    result.push({
      label: 'Trockener Boden',
      detail: `${formatNumber(sm * 100, 0)}% Feuchte — Bewässerung sinnvoll.`,
      icon: '🪴',
      style: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
    })
  }

  const totalSnow = next24.reduce((s, h) => s + (h.snowfall?.mean ?? 0), 0)
  if (totalSnow > 0.5) {
    result.push({
      label: 'Schneefall',
      detail: `~${formatNumber(totalSnow, 1)} cm in 24 h.`,
      icon: '🌨️',
      style: 'border-slate-300/30 bg-slate-400/10 text-slate-100',
    })
  }

  return result
}

function dewPointHint(dew: number, temp?: number): string {
  if (temp == null) return 'Schwüle-Indikator'
  const spread = temp - dew
  if (spread < 2) return 'sehr feucht / Nebel möglich'
  if (dew >= 18) return 'schwül'
  if (dew >= 14) return 'angenehm'
  if (dew >= 8) return 'frisch'
  return 'trocken'
}

function uvHint(uv: number): string {
  if (uv < 3) return 'niedrig'
  if (uv < 6) return 'moderat'
  if (uv < 8) return 'hoch'
  if (uv < 11) return 'sehr hoch'
  return 'extrem'
}

function soilMoistureHint(m: number): string {
  if (m < 0.15) return 'sehr trocken'
  if (m < 0.25) return 'trocken'
  if (m < 0.4) return 'normal'
  if (m < 0.55) return 'feucht'
  return 'gesättigt'
}

function soilTempHint(t: number): string {
  if (t < 5) return 'Aussaat noch nicht'
  if (t < 8) return 'frostfest säen'
  if (t < 12) return 'mild — Salat, Erbsen'
  if (t < 16) return 'warm — Bohnen, Möhren'
  return 'sehr warm — Tomaten, Kürbis'
}

function pressureTrendHint(current: number, next48: FusedHour[]): string {
  const later = next48[6]?.pressure?.mean
  if (later == null) return ''
  const delta = later - current
  if (delta > 1.5) return `↗︎ steigend (${formatNumber(delta, 1)} hPa / 6h)`
  if (delta < -1.5) return `↘︎ fallend (${formatNumber(delta, 1)} hPa / 6h)`
  return 'stabil'
}

function visibilityHint(m: number): string {
  if (m < 1000) return 'dichter Nebel'
  if (m < 4000) return 'Nebel'
  if (m < 10000) return 'eingeschränkt'
  return 'klar'
}
