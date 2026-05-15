import { motion } from 'framer-motion'
import { FusedHour } from '../types/forecast'
import { GlassCard } from './GlassCard'
import { DisagreementBadge } from './DisagreementBadge'
import { formatNumber, weatherCodeInfo } from '../utils/format'
import { MetricTile } from './MetricTile'
import { AggregateBar } from './AggregateBar'

interface Props {
  now: FusedHour
  expert: boolean
  next48: FusedHour[]
  nowIndex: number
}

export function NowCard({ now, expert, next48, nowIndex }: Props) {
  const t = now.temperature
  const app = now.apparentTemperature
  const precip = now.precipitation
  const wind = now.windSpeed
  const gust = now.windGust
  const dir = now.windDirection
  const cloud = now.cloudCover
  const hum = now.humidity
  const code = weatherCodeInfo(now.weatherCodeMode)

  const times = next48.map((h) => h.time)
  const precipProbSeries = next48.map((h) => (h.precipitation?.probability ?? 0) * 100)
  const windSeries = next48.map((h) => h.windSpeed?.mean ?? 0)
  const cloudSeries = next48.map((h) => h.cloudCover?.mean ?? 0)
  const humSeries = next48.map((h) => h.humidity?.mean ?? 0)

  return (
    <GlassCard variant="strong" className="px-7 py-7 md:px-9 md:py-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-white/60">Jetzt</div>
          <div className="mt-2 flex items-baseline gap-3">
            {t && (
              <div className="num text-7xl font-extralight tracking-tight md:text-8xl">
                {formatNumber(t.mean, 1)}°
              </div>
            )}
            {t && (
              <div className="flex flex-col gap-1.5">
                <span className="num text-sm text-white/60">± {formatNumber(t.stdDev, 1)}°</span>
                <DisagreementBadge level={t.disagreement} />
              </div>
            )}
          </div>
          {app && (
            <div className="num mt-2 text-sm text-white/60">
              Gefühlt {formatNumber(app.mean, 0)}°
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-5xl md:text-6xl drop-shadow-lg">{code.icon}</div>
          <div className="mt-1 text-sm text-white/70">{code.label}</div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {precip && (
          <MetricTile
            label="Regen"
            value={`${Math.round(precip.probability * 100)}%`}
            hint={
              precip.highMM > 0.1
                ? `${formatNumber(precip.lowMM, 1)}–${formatNumber(precip.highMM, 1)} mm`
                : `${precip.modelsExpectingRain}/${precip.totalModels} Modelle`
            }
            gradient="from-sky-400 to-blue-600"
            series={precipProbSeries}
            times={times}
            seriesGradient={['#7dd3fc', '#3b82f6']}
            currentIndex={nowIndex}
            unit="%"
            yDigits={0}
          />
        )}
        {wind && (
          <MetricTile
            label="Wind"
            value={`${formatNumber(wind.mean, 0)} km/h`}
            hint={
              dir && gust
                ? `${compassDir(dir.mean)} · Böen ${formatNumber(gust.mean, 0)} km/h`
                : gust
                  ? `Böen ${formatNumber(gust.mean, 0)} km/h`
                  : dir
                    ? compassDir(dir.mean)
                    : undefined
            }
            gradient="from-emerald-400 to-teal-500"
            icon={
              dir && (
                <span
                  className="inline-block"
                  style={{ transform: `rotate(${dir.mean}deg)` }}
                >
                  ↑
                </span>
              )
            }
            series={windSeries}
            times={times}
            seriesGradient={['#6ee7b7', '#10b981']}
            currentIndex={nowIndex}
            unit=" km/h"
            yDigits={0}
          />
        )}
        {cloud && (
          <MetricTile
            label="Bewölkung"
            value={`${formatNumber(cloud.mean, 0)}%`}
            gradient="from-slate-300 to-slate-500"
            series={cloudSeries}
            times={times}
            seriesGradient={['#cbd5e1', '#64748b']}
            currentIndex={nowIndex}
            unit="%"
            yDigits={0}
          />
        )}
        {hum && (
          <MetricTile
            label="Luftfeuchte"
            value={`${formatNumber(hum.mean, 0)}%`}
            gradient="from-cyan-400 to-blue-500"
            series={humSeries}
            times={times}
            seriesGradient={['#67e8f9', '#3b82f6']}
            currentIndex={nowIndex}
            unit="%"
            yDigits={0}
          />
        )}
      </div>

      {expert && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 space-y-3 overflow-hidden"
        >
          {t && t.perModel.length > 1 && (
            <AggregateBar
              label="Temperatur · Modell-Spanne"
              min={Math.min(...t.perModel.map((m) => m.value))}
              max={Math.max(...t.perModel.map((m) => m.value))}
              mean={t.mean}
              unit="°"
              confidence={confidenceFromCoeff(t.stdDev, t.mean)}
              gradient={['#fbbf24', '#ef4444']}
              digits={1}
            />
          )}
          {precip && precip.totalModels > 1 && (
            <AggregateBar
              label="Niederschlag · Modell-Spanne"
              min={precip.lowMM}
              max={precip.highMM}
              mean={precip.meanMM}
              unit=" mm"
              confidence={precip.probability}
              confidenceLabel="Regenwahrsch."
              gradient={['#7dd3fc', '#3b82f6']}
              digits={1}
            />
          )}
          {wind && wind.perModel.length > 1 && (
            <AggregateBar
              label="Wind · Modell-Spanne"
              min={Math.min(...wind.perModel.map((m) => m.value))}
              max={Math.max(...wind.perModel.map((m) => m.value))}
              mean={wind.mean}
              unit=" km/h"
              confidence={confidenceFromCoeff(wind.stdDev, wind.mean)}
              gradient={['#6ee7b7', '#10b981']}
              digits={0}
            />
          )}
        </motion.div>
      )}
    </GlassCard>
  )
}

function confidenceFromCoeff(std: number, mean: number): number {
  const ref = Math.max(Math.abs(mean), 1)
  const coeff = std / ref
  const conf = 1 - Math.min(coeff * 3, 1)
  return Math.max(0.1, conf)
}

function compassDir(deg: number): string {
  const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round((deg % 360) / 45) % 8]
}
