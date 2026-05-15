import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from './hooks/useLocation'
import { useForecast } from './hooks/useForecast'
import { useLearnedWeights } from './hooks/useLearnedWeights'
import { AuroraBackground } from './components/AuroraBackground'
import { NowCard } from './components/NowCard'
import { HourlyStrip } from './components/HourlyStrip'
import { DailyList } from './components/DailyList'
import { InsightsCard } from './components/InsightsCard'
import { ExpertSwitch } from './components/ExpertSwitch'
import { PlaceSearch } from './components/PlaceSearch'
import { GlassCard } from './components/GlassCard'

export default function App() {
  const [expert, setExpert] = useState(false)
  const location = useLocation()
  const learned = useLearnedWeights(location.coord)
  const forecast = useForecast(location.coord, learned.weights)

  const nowIndex = useMemo(() => {
    const i = forecast.fused.findIndex((f) => f.time >= Date.now() - 30 * 60 * 1000)
    return i < 0 ? 0 : i
  }, [forecast.fused])

  const now = forecast.fused[nowIndex]
  const next48 = forecast.fused.slice(nowIndex, nowIndex + 48)

  return (
    <div className="relative min-h-dvh w-full">
      <AuroraBackground now={now} />

      <header className="safe-top sticky top-0 z-30 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <PlaceSearch
              currentPlace={location.placeName}
              onPick={(c, name) => location.setLocation(c, name)}
              onLocateMe={location.requestGeolocation}
            />
          </div>
          <ExpertSwitch on={expert} onChange={setExpert} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-2 safe-bottom">
        <AnimatePresence mode="wait">
          {!location.coord && !location.loading && (
            <NoLocationCard
              key="no-loc"
              error={location.error}
              onRetry={location.requestGeolocation}
            />
          )}

          {location.coord && forecast.loading && forecast.fused.length === 0 && (
            <LoadingCard key="loading" />
          )}

          {forecast.error && !forecast.loading && (
            <ErrorCard key="err" message={forecast.error} />
          )}

          {forecast.fused.length > 0 && now && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <NowCard now={now} expert={expert} next48={next48} nowIndex={0} />
              <HourlyStrip hours={forecast.fused.slice(nowIndex)} expert={expert} />
              <DailyList hours={forecast.fused} expert={expert} />
              <AnimatePresence>
                {expert && (
                  <InsightsCard
                    key="insights"
                    now={now}
                    next48={next48}
                    nowIndex={0}
                  />
                )}
              </AnimatePresence>
              <Footer
                lastUpdated={forecast.lastUpdated}
                modelCount={forecast.raw.length}
                isLearning={learned.isLearning}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-sky-300 to-indigo-500 shadow-lg shadow-indigo-500/30">
        <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-200" />
      </div>
      <div className="text-base font-medium tracking-tight">Wetterfusion</div>
    </div>
  )
}

function NoLocationCard({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <GlassCard variant="strong" className="px-6 py-12 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-sky-300/80 to-indigo-500/80 shadow-2xl" />
        <h2 className="mb-2 text-xl font-medium">Standort benötigt</h2>
        <p className="mx-auto mb-6 max-w-xs text-sm text-white/60">
          Wetterfusion braucht deinen Standort oder eine Suche, um die Modelle zu fusionieren.
        </p>
        {error && <p className="mb-3 text-xs text-rose-300/80">{error}</p>}
        <button
          onClick={onRetry}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition-transform active:scale-[0.97]"
        >
          Standort erlauben
        </button>
      </GlassCard>
    </motion.div>
  )
}

function LoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <GlassCard className="h-48 animate-pulse" />
      <GlassCard className="h-40 animate-pulse" />
      <GlassCard className="h-72 animate-pulse" />
    </motion.div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <GlassCard className="px-6 py-8 text-center">
        <div className="mb-2 text-3xl">⚠️</div>
        <div className="text-sm text-rose-200">{message}</div>
      </GlassCard>
    </motion.div>
  )
}

function Footer({
  lastUpdated,
  modelCount,
  isLearning,
}: {
  lastUpdated: number | null
  modelCount: number
  isLearning: boolean
}) {
  return (
    <div className="pt-2 text-center text-[11px] text-white/40">
      {lastUpdated && (
        <>
          Aktualisiert{' '}
          {new Date(lastUpdated).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          · {modelCount} Modelle fusioniert
          {isLearning && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-white/55">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              lerne Gewichte…
            </span>
          )}
        </>
      )}
    </div>
  )
}
