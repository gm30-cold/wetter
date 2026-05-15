import { useEffect, useState } from 'react'
import { Coordinate, FusedHour, ModelForecast } from '../types/forecast'
import { fetchAllModels } from '../api/openMeteo'
import { fuse, ModelWeights } from '../fusion/engine'

interface ForecastState {
  raw: ModelForecast[]
  fused: FusedHour[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
}

export function useForecast(coord: Coordinate | null, weights?: ModelWeights) {
  const [state, setState] = useState<ForecastState>({
    raw: [],
    fused: [],
    loading: false,
    error: null,
    lastUpdated: null,
  })

  useEffect(() => {
    if (!coord) return
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchAllModels(coord, 10, controller.signal)
      .then((raw) => {
        if (controller.signal.aborted) return
        if (raw.length === 0) {
          setState((s) => ({
            ...s,
            loading: false,
            error: 'Keine Modelle erreichbar — Verbindung prüfen?',
          }))
          return
        }
        setState({
          raw,
          fused: fuse(raw, weights),
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setState((s) => ({ ...s, loading: false, error: 'Abruf fehlgeschlagen' }))
      })
    return () => controller.abort()
  }, [coord?.latitude, coord?.longitude])

  useEffect(() => {
    if (!weights || state.raw.length === 0) return
    setState((s) => ({ ...s, fused: fuse(s.raw, weights) }))
  }, [weights])

  return state
}
