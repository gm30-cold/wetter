import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GeoPlace, searchPlaces } from '../api/openMeteo'
import { Coordinate } from '../types/forecast'

interface Props {
  currentPlace: string | null
  onPick: (coord: Coordinate, name: string) => void
  onLocateMe: () => void
}

export function PlaceSearch({ currentPlace, onPick, onLocateMe }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoPlace[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const c = new AbortController()
    const t = setTimeout(() => {
      searchPlaces(query, c.signal).then(setResults)
    }, 200)
    return () => {
      clearTimeout(t)
      c.abort()
    }
  }, [query])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/[0.10]"
      >
        <svg className="h-3.5 w-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-7.58 8-13a8 8 0 1 0-16 0c0 5.42 8 13 8 13z"/>
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <span className="max-w-[180px] truncate text-sm">{currentPlace ?? 'Standort wählen'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-20 w-[min(440px,calc(100vw-32px))] overflow-hidden rounded-3xl glass-strong"
            >
              <div className="p-2">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ort suchen…"
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm placeholder:text-white/40 outline-none focus:bg-white/10"
                />
              </div>
              <button
                onClick={() => {
                  onLocateMe()
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-3 text-sm text-white/80 hover:bg-white/5"
              >
                <span className="text-base">📍</span>
                Aktuellen Standort verwenden
              </button>
              {results.length > 0 && (
                <ul className="max-h-[50vh] overflow-y-auto border-t border-white/10">
                  {results.map((r) => (
                    <li key={`${r.latitude}-${r.longitude}-${r.name}`}>
                      <button
                        onClick={() => {
                          onPick(
                            { latitude: r.latitude, longitude: r.longitude },
                            [r.name, r.admin1].filter(Boolean).join(', ')
                          )
                          setOpen(false)
                          setQuery('')
                        }}
                        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm hover:bg-white/5"
                      >
                        <div>
                          <div>{r.name}</div>
                          <div className="text-[11px] text-white/40">
                            {[r.admin1, r.country].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <span className="text-white/30">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
